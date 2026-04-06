from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from src.db import get_db_session, get_db_session_fa
from src.services.pollor_service import PollorService
from src.wire import SuccessResponse

router = APIRouter(prefix="/api/pollor", tags=["Pollor Addons"])

@router.post("/products/sync")
async def sync_product(
    addon_id: int,
    session: AsyncSession = Depends(get_db_session)
):
    """
    Sync a local AddonType to Polar as a one-time product.
    """
    result = await PollorService.sync_addon_product(session, addon_id)
    return result

@router.post("/subscribe")
async def buy_addon(
    addon_id: int,
    user_id: str, # In real app, from auth
    redirect_url: str,
    session: AsyncSession = Depends(get_db_session)
):
    """
    Buy an addon (Direct Invoice / Checkout).
    Frontend triggers this when user clicks a card.
    """
    result = await PollorService.create_addon_purchase_invoice(session, user_id, addon_id, redirect_url)
    return result

@router.get("/addons")
async def get_my_addons(
    user_id: str,
    session: AsyncSession = Depends(get_db_session)
):
    addons = await PollorService.get_valid_addons(session, user_id)
    # Simple serialization
    data = []
    for ua in addons:
        data.append({
            "id": str(ua.id),
            "addon_name": ua.addon.name,
            "limit_value": ua.limit_value,
            "used_value": ua.used_value,
            "remaining": ua.limit_value - ua.used_value,
            "status": ua.status
        })
    return SuccessResponse(data=data)

    return SuccessResponse(data=data)

# Webhook moved to src/routers/webhooks.py
