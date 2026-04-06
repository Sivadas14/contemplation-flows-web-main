from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from datetime import datetime, timezone
import logging
from src.db import AddonType, UserAddon, UserProfile
from src.polarservice.polar_client import get_polar_client
from src.settings import get_settings


logger = logging.getLogger(__name__)
settings = get_settings()

class PollorService:
    
    @staticmethod
    async def get_organization_id(polar_client) -> str:
       
        # Helper to get the first organization ID
        # In a real app, this might be configured in settings
        # orgs = polar_client.organizations.list()
        # items = orgs.items
        # if not items:
        #     raise HTTPException(status_code=500, detail="No Polar organization found")
        # return items[0].id
        return settings.polar_organization_id

    @staticmethod
    async def sync_addon_product(session: AsyncSession, addon_id: int) -> dict:
        """
        Syncs a local AddonType to Polar as a one-time product.
        If it already has a polar_product_id, checks existence or raises error.
        """
        stmt = select(AddonType).where(AddonType.id == addon_id)
        result = await session.execute(stmt)
        addon = result.scalar_one_or_none()
        
        if not addon:
            raise HTTPException(status_code=404, detail="Addon not found")
            
        if addon.polar_product_id:
            # Already synced, verify existence or just return
            return {"success": True, "message": "Addon already synced", "polar_product_id": addon.polar_product_id}
            
        # Create product in Polar
        with get_polar_client() as polar:
            org_id = await PollorService.get_organization_id(polar)
            
            # Determine price in cents (USD default for now)
            price_amount = 0
            if addon.price_usd:
                price_amount = int(addon.price_usd * 100)
            elif addon.price_inr:
                 # Fallback conversion or error? Assuming USD for Polar sandbox usually
                 price_amount = int(addon.price_inr * 100) # Placeholder conversion
            
            if price_amount <= 0:
                 raise HTTPException(status_code=400, detail="Addon must have a valid price")

            product = polar.products.create(request={
                
                "name" : str (addon.name),
                "description" : str(addon.description or ""),
                "prices":[
                    {
                        "amount_type": "fixed",
                        "price_amount": price_amount,
                        "price_currency": "usd",
                        # "type": "one_time" # SDK defaults or parameter might differ, usually inferred from absence of recurring interval
                    }
                ],
                "recurring_interval":None,
                "trial_interval":None,
                "recurring_interval_count":None,
                "trial_interval_count":None,
                "recurring_interval_count":None
                # properties={"metadata": {"addon_id": str(addon.id)}}
            })            
            addon.polar_product_id = product.id
            session.add(addon)
            await session.commit()
            
            return {
                "success": True, 
                "message": "Product created in Polar", 
                "polar_product_id": product.id,
                "name": product.name
            }

    @staticmethod
    async def create_addon_purchase_invoice(session: AsyncSession, user_id: str, addon_id: int, redirect_url: str | None = None) -> dict:
        """
        Creates a checkout/invoice for the addon.
        """
        # 1. Fetch Addon & User
        stmt = select(AddonType).where(AddonType.id == addon_id)
        res = await session.execute(stmt)
        addon = res.scalar_one_or_none()
        
        if not addon or not addon.polar_product_id:
            raise HTTPException(status_code=400, detail="Addon not synced with Polar")
            
        user_stmt = select(UserProfile).where(UserProfile.id == user_id)
        user_res = await session.execute(user_stmt)
        user = user_res.scalar_one_or_none()
        
        if not user:
             raise HTTPException(status_code=404, detail="User not found")

        # 2. Create UserAddon record (pending)
        # We create it now to track the intent, or we could wait for webhook.
        # User requested "without checkout, direct invoice type". 
        # Making a checkout is the closest to "Sending an invoice" if we don't have their card for instant charge.
        
        # 3. Create Checkout in Polar
        checkout_url = ""
        try:
             with get_polar_client() as polar:
                checkout = polar.checkouts.create(
                    request={
                        "products": [addon.polar_product_id],
                        "customer_email": user.email_id, # Pre-fill email
                        "success_url": redirect_url +"?upgrade=success" if redirect_url else f"{get_settings().frontend_url}/subscription?upgrade=success",
                        "metadata": {
                            "user_id": str(user_id),
                            "addon_id": str(addon_id),
                            "type": "addon_purchase"
                        }
                    }
                )
                checkout_url = checkout.url
        except Exception as e:
            logger.error(f"Failed to create addon checkout: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create invoice/checkout: {str(e)}")

        # 4. Create local record (optional, or wait for webhook)
        # Creating it as "pending_payment" so we know.
        user_addon = UserAddon(
            user_id=user_id,
            addon_id=addon_id,
            status="pending_payment",
            limit_value=addon.quantity,
            used_value=0,
            polar_order_id=None # Will be filled by webhook
        )
        session.add(user_addon)
        await session.commit()
        
        return {
            "success": True,
            "checkout_url": checkout_url,
            "message": "Invoice/Checkout created"
        }


    @staticmethod
    async def get_valid_addons(session: AsyncSession, user_id: str):
        stmt = select(UserAddon).join(AddonType).where(
            UserAddon.user_id == user_id,
            UserAddon.status == "active"
        ).order_by(UserAddon.created_at.desc())
        
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def handle_webhook(session: AsyncSession, payload: dict) -> dict:
        """
        Handles Polar webhooks for addon purchases.
        Listens for 'checkout.created' (succeeded) or 'order.created'.
        """
        event_type = payload.get("type")
        data = payload.get("data", {})
        
        if not data:
            return {"status": "ignored", "reason": "no_data"}
            
        logger.info(f"Pollor Webhook: {event_type}")
        
        # We are interested in successful checkouts that have our metadata
        # event: checkout.created (status=succeeded) OR order.created
        
        should_process = False
        metadata = data.get("metadata", {})
        
        if event_type == "checkout.created" and data.get("status") == "succeeded":
            should_process = True
        elif event_type == "order.created":
            should_process = True
            
        if not should_process:
             return {"status": "ignored", "reason": "event_type"}

        # Check metadata
        if metadata.get("type") != "addon_purchase":
             return {"status": "ignored", "reason": "not_addon_purchase"}
             
        user_id = metadata.get("user_id")
        addon_id = metadata.get("addon_id")
        
        if not user_id or not addon_id:
             logger.error("Missing user_id or addon_id in webhook metadata")
             return {"status": "error", "reason": "missing_metadata"}
             
        logger.info(f"Processing Addon Purchase: User={user_id}, Addon={addon_id}")
        
        # Find/Create UserAddon and Mark as Active
        # logic: find pending one for this user/addon, or create new if not found
        if not user_id:
            logger.error("Missing user_id in webhook metadata")
            return {"status": "error", "reason": "missing_metadata"}

        user_stmt = select(UserProfile).where(UserProfile.id == user_id)
        user_res = await session.execute(user_stmt)
        user = user_res.scalar_one_or_none()
        
        if not user:
            logger.error(f"User not found: {user_id}")
            return {"status": "error", "reason": "user_not_found"}


        if not user.polar_customer_id:
           user.polar_customer_id = data.get("customer_id")
           session.add(user)
           await session.commit()

        # Fetch AddonType first to ensure it exists
        addon_type_stmt = select(AddonType).where(AddonType.id == int(addon_id))
        addon_type_res = await session.execute(addon_type_stmt)
        addon_type = addon_type_res.scalar_one_or_none()

        if not addon_type:
            logger.error(f"Addon type not found: {addon_id}")
            return {"status": "error", "reason": "addon_not_found"}

        # Check for PENDING addon
        stmt = select(UserAddon).where(
            UserAddon.user_id == user_id,
            UserAddon.addon_id == int(addon_id),
            UserAddon.status == "pending_payment"
        ).order_by(UserAddon.created_at.desc())
        
        res = await session.execute(stmt)
        pending_addon = res.scalars().first()
        
        if pending_addon:
            pending_addon.status = "active"
            pending_addon.polar_order_id = data.get("id") # checkout id or order id
            pending_addon.updated_at = datetime.now(timezone.utc)
            session.add(pending_addon)
            await session.commit()
            return {"status": "success", "action": "activated_pending"}
        else:
            # Create new one if we missed the pending state or direct purchase
            new_addon = UserAddon(
                user_id=user_id,
                addon_id=int(addon_id),
                status="active",
                limit_value=addon_type.quantity,
                used_value=0,
                polar_order_id=data.get("id")
            )
            session.add(new_addon)
            await session.commit()
            return {"status": "success", "action": "created_new"}

