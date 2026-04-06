from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from polar_sdk import Polar
from src.dependencies import get_current_user
from src.polarservice.polar_client import get_polar_client
from src.settings import get_llm, Settings,get_settings
from src.db import UserProfile
from starlette.concurrency import run_in_threadpool
import logging

router = APIRouter(prefix="/api/orders", tags=["orders"])

# New endpoint to fetch invoice URL for a given order
@router.get("/{order_id}/invoice")
async def get_order_invoice(
    order_id: str,
    settings: Settings = Depends(get_settings),
    polar_client: Polar = Depends(get_polar_client),
) -> Dict[str, str]:
    """
    Fetch the invoice URL for a given order from Polar API.
    """
    import requests
    try:
        organization_id = settings.polar_organization_id
        # Try to use the SDK method if available
        if hasattr(polar_client.orders, "get_invoice"):
            invoice = polar_client.orders.get_invoice(
                organization_id=organization_id, order_id=order_id
            )
            # Try to extract URL from SDK response
            if hasattr(invoice, "url"):
                return {"url": invoice.url}
            if isinstance(invoice, dict) and "url" in invoice:
                return {"url": invoice["url"]}
        # Fallback: use requests directly
        api_url = f"https://api.polar.sh/v1/orders/{order_id}/invoice"
        headers = {"Authorization": f"Bearer {settings.polar_access_token}"}
        params = {"organization_id": organization_id}
        response = requests.get(api_url, headers=headers, params=params)
        data = response.json() if hasattr(response, "json") else response
        if isinstance(data, dict) and "url" in data:
            return {"url": data["url"]}
        raise HTTPException(status_code=404, detail="Invoice URL not found in response")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch invoice: {str(e)}")

@router.get("/")
async def get_orders(
    page: int = Query(1, ge=1, description="Page number (starts from 1)"),
    limit: int = Query(10, ge=1, le=100, description="Number of items per page (max 100)"),
    settings: Settings = Depends(get_settings),
    polar_client: Polar = Depends(get_polar_client),
) -> Dict[str, Any]:
    """
    Get orders from Polar API with pagination support.
    """
    try:
        organization_id = settings.polar_organization_id

        res = polar_client.orders.list(
            organization_id=organization_id,
            page=page,
            limit=limit,
        )

        logger = logging.getLogger("orders")
        try:
            logger.info("Polar orders.list returned type: %s", type(res))
            # Attempt short repr to avoid huge logs
            logger.debug("Polar raw response repr: %s", repr(res)[:1000])
        except Exception:
            pass

        # Normalize response (support SDK model objects and plain dicts)
        def _to_dict(obj):
            if hasattr(obj, "model_dump"):
                return obj.model_dump()
            if hasattr(obj, "dict"):
                return obj.dict()
            return obj if isinstance(obj, dict) else obj

        # If SDK returns object with `.result` attribute
        items = None
        pagination = {}

        if hasattr(res, "result"):
            result = res.result
            # result may be a model-like object or dict
            result_dict = _to_dict(result)
            if isinstance(result_dict, dict):
                items = result_dict.get("items") or result_dict.get("data") or []
                pagination = result_dict.get("pagination") or result_dict.get("paging") or {}

        # If items still None, check top-level
        if items is None:
            res_dict = _to_dict(res)
            if isinstance(res_dict, dict):
                items = res_dict.get("items") or res_dict.get("result") or []
                # if result is itself a list
                if isinstance(items, dict) and "items" in items:
                    pagination = items.get("pagination") or {}
                    items = items.get("items")
                pagination = pagination or res_dict.get("pagination") or res_dict.get("paging") or {}

        # Ensure items is a list and convert inner models to dicts
        if items is None:
            items = []

        normalized_items = []
        for it in items:
            if hasattr(it, "model_dump"):
                normalized_items.append(it.model_dump())
            elif hasattr(it, "dict"):
                normalized_items.append(it.dict())
            else:
                normalized_items.append(it)
        out = {"items": normalized_items, "pagination": pagination}
        try:
            logger.info("Returning %d items, pagination=%s", len(normalized_items), pagination)
            logger.debug("First item preview: %s", repr(normalized_items[0])[:400] if normalized_items else None)
        except Exception:
            pass
        return out

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch orders: {str(e)}",
        )
from sqlalchemy.orm import Session
from src.db import get_db_session, UserProfile
from typing import Optional

from datetime import datetime, timezone
from src.polarservice.customer_client import get_polar_customer_client

@router.get("/me")
async def get_my_orders(
    page: int = Query(1, ge=1, description="Page number (starts from 1)"),
    limit: int = Query(10, ge=1, le=100, description="Number of items per page (max 100)"),
    settings: Settings = Depends(get_settings),
    polar_client: Polar = Depends(get_polar_client),
    current_user: UserProfile = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get orders for the current authenticated user.
    Uses the user's polar_customer_id from their profile.
    """
    try:
        logger = logging.getLogger("orders")
        
        # Check if user has a polar_customer_id
        if not current_user.polar_customer_id:
            logger.warning("User %s doesn't have a polar_customer_id", current_user.id)
            return {
                "items": [],
                "pagination": {"total_count": 0, "max_page": 0, "current_page": page},
                "user_info": {
                    "user_id": str(current_user.id),
                    "name": current_user.name,
                    "email": current_user.email_id,
                    "has_polar_customer_id": False,
                    "polar_customer_id": None
                }
            }
        
        logger.info("Fetching orders for polar_customer_id: %s, organization_id: %s, page: %s, limit: %s", 
                   current_user.polar_customer_id, settings.polar_organization_id, page, limit)
        
        # Check for valid customer token
        use_customer_client = False
        customer_token = current_user.customer_token
        if customer_token and current_user.token_exp:
            token_exp = current_user.token_exp
            if token_exp.tzinfo is None:
                token_exp = token_exp.replace(tzinfo=timezone.utc)
            
            if token_exp > datetime.now(timezone.utc):
                use_customer_client = True
                logger.info("Using Customer Client with valid token")
            else:
                 logger.info("Customer token expired, falling back to OAT")

        def _fetch_orders():
            if use_customer_client:
                 client = get_polar_customer_client(customer_token)
                 with client:
                     return client.customer_portal.orders.list(
                         page=page,
                         limit=limit
                     )
            else:
                with polar_client as polar:
                    return polar.orders.list(
                        organization_id=settings.polar_organization_id,
                        customer_id=current_user.polar_customer_id,
                        page=page,
                        limit=limit
                    )
            
        res = await run_in_threadpool(_fetch_orders)
        
        # Normalize response
        def _to_dict(obj):
            if hasattr(obj, "model_dump"):
                return obj.model_dump()
            if hasattr(obj, "dict"):
                return obj.dict()
            return obj if isinstance(obj, dict) else {}

        res_dict = _to_dict(res)
        
        # Handle different response shapes from Polar SDK
        # Shape 1: { "result": { "items": [...], "pagination": {...} } }
        # Shape 2: { "items": [...], "pagination": {...} }
        
        items = []
        pagination = {"total_count": 0, "max_page": 0, "current_page": page}
        
        if "items" in res_dict:
            items = res_dict["items"]
            pagination = res_dict.get("pagination") or pagination
        elif "result" in res_dict and isinstance(res_dict["result"], dict):
            items = res_dict["result"].get("items") or []
            pagination = res_dict["result"].get("pagination") or pagination

        # Ensure items is always a list and normalized
        normalized_items = []
        for it in items:
            normalized_items.append(_to_dict(it))
        
        return {
            "items": normalized_items,
            "pagination": pagination,
            "user_info": {
                "user_id": str(current_user.id),
                "name": current_user.name,
                "email": current_user.email_id,
                "polar_customer_id": current_user.polar_customer_id,
                "has_polar_customer_id": True,
                "plan_type": current_user.plan_type.value if hasattr(current_user.plan_type, "value") else str(current_user.plan_type)
            }
        }
        
    except Exception as e:
        logger = logging.getLogger("orders")
        logger.error("Error fetching user orders: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch user orders: {str(e)}",
        )



