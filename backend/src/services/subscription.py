from datetime import datetime
from uuid import uuid4

from fastapi import HTTPException,Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from typing import Optional, Any
from datetime import datetime, timezone
import polar_sdk
FREE_SUB_PREFIX = "free_"  

from src.db import (
    get_db_session, 
    Subscription, 
    SubscriptionStatus, 
    UserProfile, 
    Plan, 
    PlanType,
    SubscriptionHistory
)
from fastapi.concurrency import run_in_threadpool
from src.settings import get_settings
from src.polarservice.polar_client import get_polar_client
from src.polarservice.customer_client import get_polar_customer_client

async def create_checkout_session(
    polar_product_id: str, # Polar Product ID (polar_plan_id)
    user_id: str,
    success_url: str | None = None,
    session_local: AsyncSession = Depends(get_db_session)
) -> str:
    """
    Creates a Polar checkout session using Product ID.
    User will choose the price/interval on the checkout page if multiple exist.
    """
    settings = get_settings()

    user_stmt = select(UserProfile).where(UserProfile.id == user_id)
    user_res = await session_local.execute(user_stmt)
    user = user_res.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.email_id:
       raise HTTPException(status_code=404, detail="Eamil Id not found")
    
    def _create_session():
        with get_polar_client() as polar:
            checkout_payload = {
                
                "products": [polar_product_id],
                "success_url": success_url +"?upgrade=success"  if success_url else f"{settings.frontend_url}/subscription?upgrade=success",
                "metadata": {
                    "user_id": user_id
                },
                "customer_email":str(user.email_id)
            }
            # The SDK usage:
            session = polar.checkouts.create(request=checkout_payload)
            return session.url

    try:
        url = await run_in_threadpool(_create_session)
        print(f"DEBUG: Checkout URL generated: {url}")
        return url
    except Exception as e:
        print(f"ERROR IN create_checkout_session: {str(e)}")
        import traceback
        traceback.print_exc()
        raise e



   

async def handle_checkout_success(
    session: AsyncSession,
    polar_subscription_id: str,
    polar_customer_id: str,
    polar_product_id: str,
    polar_price_id: str,
    metadata: dict
):
    """
    Handles 'subscription.created' or 'subscription.updated' or 'subscription.active' webhook events.
    Updates subscription details including current_period_start and current_period_end.
    """
    user_id = metadata.get("user_id")
    if not user_id:
        print(f"⚠️ No user_id found in metadata: {metadata}")
        return  # Cannot link
    
    print(f"🔍 Processing checkout success for user_id: {user_id}")
    
    # 1. Update User Profile
    stmt = select(UserProfile).where(UserProfile.id == user_id)
    result = await session.execute(stmt)
    user = result.scalars().first()
    
    if not user:
        print(f"❌ User not found: {user_id}")
        return  # User not found
        
    user.polar_customer_id = polar_customer_id
    print(f"✅ Updated user polar_customer_id: {polar_customer_id}")
    
    # 2. Update Plan Type
    # We need to find which Plan corresponds to this Polar Product
    plan_stmt = select(Plan).where(Plan.polar_plan_id == polar_product_id)
    plan_res = await session.execute(plan_stmt)
    plan = plan_res.scalar_one_or_none()
    
    if plan:
        print(f"✅ Found plan: {plan.name} (ID: {plan.id}, Type: {plan.plan_type})")
        
        # Update user's plan type
        old_plan_type = user.plan_type
        user.plan_type = plan.plan_type
        print(f"✅ Updated user plan_type: {old_plan_type} -> {plan.plan_type}")
        
        # 3. Create/Update Subscription Record
        # Check if subscription exists
        sub_stmt = select(Subscription).where(Subscription.polar_subscription_id == polar_subscription_id)
        sub_res = await session.execute(sub_stmt)
        subscription = sub_res.scalar_one_or_none()
   # ─────────────────────────────
    # 4️⃣ Else find FREE subscription
    # ─────────────────────────────
        if not subscription:
            res = await session.execute(
                select(Subscription).where(
                    Subscription.user_id == user_id,
                    Subscription.polar_subscription_id.like(f"{FREE_SUB_PREFIX}%")
                )
            )
            subscription = res.scalar_one_or_none()

            if subscription:
                print("🔄 Converting FREE subscription → PAID")
                subscription.polar_subscription_id = polar_subscription_id
            
            
        # Try to get subscription details from Polar API
        try:
            from src.polarservice.polar_client import get_polar_client
            from fastapi.concurrency import run_in_threadpool
            
            def _get_polar_subscription():
                with get_polar_client() as polar:
                    return polar.subscriptions.retrieve(polar_subscription_id)
            
            polar_subscription = await run_in_threadpool(_get_polar_subscription)
            
            # Extract period information if available
            current_period_start = None
            current_period_end = None
            
            if hasattr(polar_subscription, 'current_period_start'):
                current_period_start = polar_subscription.current_period_start
                print(f"📅 Polar current_period_start: {current_period_start}")
            
            if hasattr(polar_subscription, 'current_period_end'):
                current_period_end = polar_subscription.current_period_end
                print(f"📅 Polar current_period_end: {current_period_end}")
            
            if hasattr(polar_subscription, 'cancel_at_period_end'):
                cancel_at_period_end = polar_subscription.cancel_at_period_end
                print(f"📅 Polar cancel_at_period_end: {cancel_at_period_end}")
            
        except Exception as e:
            print(f"⚠️ Could not fetch subscription details from Polar: {e}")
            current_period_start = None
            current_period_end = None
        
        if not subscription:
            # Create new subscription record
            subscription = Subscription(
                user_id=user.id,
                plan_id=plan.id,
                polar_subscription_id=polar_subscription_id,
                status=SubscriptionStatus.ACTIVE,
                current_period_start=current_period_start,
                current_period_end=current_period_end,
                cancel_at_period_end=False,  # Default value
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(subscription)
            print(f"✅ Created new subscription record: {subscription.id}")
        else:
            # Update existing subscription record
            subscription.status = SubscriptionStatus.ACTIVE
            subscription.plan_id = plan.id
            subscription.updated_at = datetime.utcnow()
            
            # Update period information if available
            if current_period_start:
                subscription.current_period_start = current_period_start
            if current_period_end:
                subscription.current_period_end = current_period_end
            
            print(f"✅ Updated existing subscription record: {subscription.id}")
    
    else:
        print(f"⚠️ Plan with Polar ID {polar_product_id} not found")
    
    session.add(user)
    await session.commit()
    print("🎉 Database updated successfully")



async def handle_checkout_success_with_periods(
    session: AsyncSession,
    polar_subscription_id: str,
    polar_customer_id: str,
    polar_product_id: str,
    polar_price_id: str,
    current_period_start: Optional[str] = None,
    current_period_end: Optional[str] = None,
    cancel_at_period_end: bool = False,
    metadata: dict = None
):
    """
    Handles subscription webhook events with period information.
    """
    user_id = metadata.get("user_id") if metadata else None
    if not user_id:
        print(f"⚠️ No user_id found in metadata")
        return
    
    print(f"🔍 Processing subscription for user_id: {user_id}")
    
    # 1. Update User Profile
    stmt = select(UserProfile).where(UserProfile.id == user_id)
    result = await session.execute(stmt)
    user = result.scalars().first()
    
    if not user:
        print(f"❌ User not found: {user_id}")
        return
        
    user.polar_customer_id = polar_customer_id
    print(f"✅ Updated user polar_customer_id: {polar_customer_id}")
    
    # 2. Find Plan
    plan_stmt = select(Plan).where(Plan.polar_plan_id == polar_product_id)
    plan_res = await session.execute(plan_stmt)
    plan = plan_res.scalar_one_or_none()
    
    if not plan:
        print(f"⚠️ Plan with Polar ID {polar_product_id} not found")
        return
    
    print(f"✅ Found plan: {plan.name} (ID: {plan.id}, Type: {plan.plan_type})")
    
    # Update user's plan type
    old_plan_type = user.plan_type
    user.plan_type = plan.plan_type
    print(f"✅ Updated user plan_type: {old_plan_type} -> {plan.plan_type}")
    
    # 3. Create/Update Subscription Record
    sub_stmt = select(Subscription).where(Subscription.polar_subscription_id == polar_subscription_id)
    sub_res = await session.execute(sub_stmt)
    subscription = sub_res.scalar_one_or_none()

    if not subscription:
        res = await session.execute(
            select(Subscription).where(
                Subscription.user_id == user_id,
                Subscription.polar_subscription_id.like(f"{FREE_SUB_PREFIX}%")
            )
        )
        subscription = res.scalar_one_or_none()

        if subscription:
            print("🔄 Converting FREE subscription → PAID")
            subscription.polar_subscription_id = polar_subscription_id
    
    # Parse datetime strings if provided
    parsed_current_period_start = None
    parsed_current_period_end = None
    
    if current_period_start:
        try:
            parsed_current_period_start = datetime.fromisoformat(current_period_start.replace('Z', '+00:00'))
            print(f"📅 Parsed current_period_start: {parsed_current_period_start}")
        except Exception as e:
            print(f"⚠️ Could not parse current_period_start {current_period_start}: {e}")
    
    if current_period_end:
        try:
            parsed_current_period_end = datetime.fromisoformat(current_period_end.replace('Z', '+00:00'))
            print(f"📅 Parsed current_period_end: {parsed_current_period_end}")
        except Exception as e:
            print(f"⚠️ Could not parse current_period_end {current_period_end}: {e}")

    # Fallback: Fetch latest subscription details from Polar if period info is missing
    # (Happens with order.created events)
    if not parsed_current_period_end and polar_subscription_id:
        try:
            print(f"🔍 Period info missing, fetching from Polar for {polar_subscription_id}")
            def _get_polar_subscription():
                with get_polar_client() as polar:
                    return polar.subscriptions.retrieve(polar_subscription_id)
            
            polar_sub = await run_in_threadpool(_get_polar_subscription)
            if hasattr(polar_sub, 'current_period_start') and polar_sub.current_period_start:
                parsed_current_period_start = ensure_utc(polar_sub.current_period_start)
            if hasattr(polar_sub, 'current_period_end') and polar_sub.current_period_end:
                parsed_current_period_end = ensure_utc(polar_sub.current_period_end)
            if hasattr(polar_sub, 'cancel_at_period_end'):
                cancel_at_period_end = polar_sub.cancel_at_period_end
            print(f"✅ Fetched period info: {parsed_current_period_end}")
        except Exception as e:
            print(f"⚠️ Failed to fetch subscription details from Polar: {e}")

    if not subscription:
        # Create new subscription
        subscription = Subscription(
            user_id=user.id,
            plan_id=plan.id,
            polar_subscription_id=polar_subscription_id,
            status=SubscriptionStatus.ACTIVE,
            current_period_start=parsed_current_period_start,
            current_period_end=parsed_current_period_end,
            cancel_at_period_end=cancel_at_period_end,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(subscription)
        print(f"✅ Created new subscription: {subscription.id}")
    else:
        # Check for plan change or renewal
        plan_changed = subscription.plan_id != plan.id
        
        # Detect renewal: if the period end has moved forward
        is_renewal = False
        if parsed_current_period_end and subscription.current_period_end:
            # Add some buffer (1 min) to avoid tiny diffs, but usually it's a month
            if parsed_current_period_end > subscription.current_period_end:
                is_renewal = True

        if plan_changed or is_renewal:
             action = "Plan change" if plan_changed else "Renewal"
             print(f"🔄 {action} detected for subscription {subscription.id}. Archiving history.")
             
             history_entry = SubscriptionHistory(
                 subscription_id=subscription.id,
                 previous_plan_id=subscription.plan_id,
                 polar_subscription_id=subscription.polar_subscription_id,
                 status=subscription.status,
                 user_id=subscription.user_id,
                 archived_at=datetime.now(timezone.utc)
             )
             session.add(history_entry)

        # Update existing subscription
        subscription.status = SubscriptionStatus.ACTIVE
        subscription.plan_id = plan.id
        subscription.updated_at = datetime.utcnow()
        
        if parsed_current_period_start:
            subscription.current_period_start = parsed_current_period_start
        if parsed_current_period_end:
            subscription.current_period_end = parsed_current_period_end
        
        subscription.cancel_at_period_end = cancel_at_period_end
        
        print(f"✅ Updated existing subscription: {subscription.id} ({'Renewed' if is_renewal else 'Synced'})")
    
    session.add(user)
    await session.commit()
    print("🎉 Database updated successfully")




async def handle_subscription_revoked(
    session: AsyncSession,
    polar_subscription_id: str
):
    """
    Handles subscription revocation/cancellation.
    Updates subscription status and ended_at timestamp.
    """
    print(f"🔍 Handling subscription revocation: {polar_subscription_id}")
    
    # Find subscription with user relationship
    stmt = select(Subscription).options(selectinload(Subscription.user)).where(
        Subscription.polar_subscription_id == polar_subscription_id
    )
    result = await session.execute(stmt)
    sub = result.scalars().first()
    
    if sub:
        print(f"✅ Found subscription to revoke: {sub.id}")
        
        # 1. Archive to History
        history = SubscriptionHistory(
            subscription_id=sub.id,
            previous_plan_id=sub.plan_id,
            polar_subscription_id=sub.polar_subscription_id,
            status=sub.status,
            user_id=sub.user_id,
            archived_at=datetime.utcnow()
        )
        session.add(history)
        print(f"✅ Archived subscription to history")

        # 2. Update status to CANCELED
        sub.status = SubscriptionStatus.CANCELED
        sub.ended_at = datetime.utcnow()
        sub.canceled_at = datetime.utcnow()
        sub.updated_at = datetime.utcnow()
        session.add(sub)
        print(f"✅ Updated subscription status to CANCELED")
        
        # 3. Revert user to FREE plan
        if sub.user:
            old_plan_type = sub.user.plan_type
            
            # Find Free Plan
            free_plan_stmt = select(Plan).where(Plan.plan_type == PlanType.FREE)
            free_plan_res = await session.execute(free_plan_stmt)
            free_plan = free_plan_res.scalar_one_or_none()
            
            if free_plan:
                 # Create new Free Subscription
                 free_sub = Subscription(
                    user_id=sub.user_id,
                    plan_id=free_plan.id,
                    polar_subscription_id=f"free_{uuid4()}",
                    status=SubscriptionStatus.ACTIVE,
                    current_period_start=datetime.utcnow(),
                    current_period_end=None,  # Explicitly None for perpetual Free plan
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                 )
                 session.add(free_sub)
                 
                 sub.user.plan_type = PlanType.FREE
                 print(f"✅ Downgraded user from {old_plan_type} to {PlanType.FREE} and created free subscription")
            else:
                 # Fallback if free plan not found (should not happen if seeded)
                 sub.user.plan_type = PlanType.FREE
                 print(f"⚠️ Free plan not found, but updated user plan_type to {PlanType.FREE}")
            
            session.add(sub.user)
        
        await session.commit()
        print("🎉 Subscription revocation completed")
    else:
        print(f"⚠️ Subscription not found: {polar_subscription_id}")



async def sync_user_subscription(
    session: AsyncSession,
    user_id: str
):
    """
    Polls Polar for the user's subscription status and updates local DB.
    Replaces webhook functionality.
    """
    settings = get_settings()
    
    # 1. Get User
    stmt = select(UserProfile).where(UserProfile.id == user_id)
    result = await session.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 1b. Detect active Razorpay subscription for this user.
    # Polar sync must NEVER cancel a Razorpay sub or downgrade a Razorpay-paid
    # user to FREE — these are two independent payment gateways.
    rzp_stmt = select(Subscription).where(
        Subscription.user_id == user.id,
        Subscription.status == SubscriptionStatus.ACTIVE,
        Subscription.polar_subscription_id.like("rzp_%"),
    )
    rzp_res = await session.execute(rzp_stmt)
    active_rzp_sub = rzp_res.scalars().first()
    if active_rzp_sub:
        print(
            f"DEBUG: User {user.id} has an active Razorpay subscription "
            f"{active_rzp_sub.polar_subscription_id}. Polar sync will NOT "
            f"cancel it or downgrade the user."
        )

    # 2. Fetch Subscriptions from Polar
    def _fetch_polar_subs():
        with get_polar_client() as polar:
            # List all subscriptions (or filter if SDK allows, we'll filter in python)
            # In production, you might want to filter by customer_id or email if possible
            # For now, we fetch current valid subscriptions
            response = polar.subscriptions.list()
            
            # Access items safely
            items = getattr(response, 'items', None)
            if not items and hasattr(response, 'result'):
                items = getattr(response.result, 'items', [])
            return items or []

    all_subs = await run_in_threadpool(_fetch_polar_subs)
    
    # 3. Find active subscription for this user

    
    print(f"DEBUG: Syncing for User ID: {user_id}")
    print(f"DEBUG: Found {len(all_subs)} total subscriptions in Polar.")
    active_sub = None   # <-- FIX HERE

    for sub in all_subs:
        # Check metadata for user_id
        meta = getattr(sub, 'metadata', {})
        # Also check custom_field_data just in case
        if not meta:
            meta = getattr(sub, 'custom_field_data', {})
        
        sub_user_id = str(meta.get("user_id")) if meta else "None"
        print(f"DEBUG: Checking Sub {sub.id} | Status: {sub.status} | Meta User ID: {sub_user_id}")

        # Helper to check if active
        def _is_active(status_obj):
             s = str(status_obj).lower()
             # handle 'active' or 'subscriptionstatus.active'
             return "active" in s and "incomplete" not in s

        if meta and str(meta.get("user_id")) == str(user_id):
            # Check status
            if _is_active(sub.status):
                active_sub = sub
                print(f"DEBUG: MATCH FOUND! Active subscription: {sub.id}")
                break
            else:
                print(f"DEBUG: Match found but status is {sub.status}")

    # 4. Update Database
    print(f"DEBUG: Active Sub: {active_sub}")
    if active_sub:
        # User has active subscription
        user.polar_customer_id = active_sub.customer_id
        # We assume specific plan type based on mapping or just set to PRO for now
        # Ideally we map active_sub.product_id to a local Plan
        print(f"DEBUG: Active Sub Product ID: {active_sub.product_id}")
        print(f"DEBUG: Active plan polor Product ID: {Plan.polar_plan_id}")
        plan_stmt = select(Plan).where(Plan.polar_plan_id == active_sub.product_id)
        plan_res = await session.execute(plan_stmt)
        plan = plan_res.scalar_one_or_none()
        print(f"DEBUG: Found Plan: {plan}")
        
        if plan:
            user.plan_type = plan.plan_type
            
            # Upsert Subscription record
            sub_stmt = select(Subscription).where(Subscription.polar_subscription_id == active_sub.id)
            sub_res = await session.execute(sub_stmt)
            local_sub = sub_res.scalar_one_or_none()
            print(f"DEBUG: Found Local Sub: {local_sub}")
            
            if not local_sub:
                local_sub = Subscription(
                    user_id=user.id,
                    plan_id=plan.id,
                    polar_subscription_id=active_sub.id,
                    status=SubscriptionStatus.ACTIVE,
                    created_at=datetime.utcnow()
                )
                session.add(local_sub)
                print(f"DEBUG: Added Local Sub: {local_sub}")
            else:
                local_sub.status = SubscriptionStatus.ACTIVE
                local_sub.plan_id = plan.id
                local_sub.current_period_end = active_sub.current_period_end
                session.add(local_sub)
                print(f"DEBUG: Updated Local Sub: {local_sub}")

            # Mark other active Polar subscriptions for this user as canceled
            # (Cleanup). EXCLUDE local free subscriptions AND Razorpay
            # subscriptions — Razorpay is a separate gateway that this code
            # path knows nothing about, and wiping rzp_* rows here would
            # silently revoke a paying user's plan.
            cleanup_stmt = update(Subscription).where(
                Subscription.user_id == user.id,
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.polar_subscription_id != active_sub.id,
                ~Subscription.polar_subscription_id.like("free_%"),
                ~Subscription.polar_subscription_id.like("rzp_%"),
            ).values(status=SubscriptionStatus.CANCELED, ended_at=datetime.utcnow())
            await session.execute(cleanup_stmt)
            print(f"DEBUG: Cleaned up other active Polar subscriptions for user {user.id}")
                
    else:
        # No active Polar subscription found.
        # CRITICAL: if the user has an active Razorpay subscription, do NOT
        # downgrade them and do NOT cancel anything — they are paying via a
        # separate gateway that this function has no visibility into.
        if active_rzp_sub:
            print(
                f"DEBUG: No active Polar subscription for user {user.id}, but "
                f"Razorpay subscription {active_rzp_sub.polar_subscription_id} "
                f"is active. Leaving user.plan_type={user.plan_type} unchanged "
                f"and returning without any downgrade."
            )
            await session.commit()
            return False

        # Otherwise, legitimate Polar-side downgrade to FREE.
        if user.plan_type != PlanType.FREE:  # Prevent redundant writes
            user.plan_type = PlanType.FREE
        print(f"DEBUG: Downgraded User: {user}")

        # Mark local PAID Polar subscriptions as canceled if they exist.
        # DO NOT cancel local free subscriptions or Razorpay subscriptions.
        local_subs_stmt = select(Subscription).where(
            Subscription.user_id == user.id,
            Subscription.status == SubscriptionStatus.ACTIVE,
            ~Subscription.polar_subscription_id.like("free_%"),
            ~Subscription.polar_subscription_id.like("rzp_%"),
        )
        print(f"DEBUG: Found Local Paid Polar Subs to potentially cancel: {local_subs_stmt}")
        local_subs_res = await session.execute(local_subs_stmt)
        for local_sub in local_subs_res.scalars():
            local_sub.status = SubscriptionStatus.CANCELED
            local_sub.ended_at = datetime.utcnow()
            session.add(local_sub)
            print(f"DEBUG: Marked Local Paid Polar Sub {local_sub.id} as Canceled")

        # If no active local subscription at all (including free), ensure user is on FREE plan_type
        # This is a safety check. Usually there SHOULD be a free subscription.
        active_sub_stmt = select(Subscription).where(
            Subscription.user_id == user.id,
            Subscription.status == SubscriptionStatus.ACTIVE
        )
        active_res = await session.execute(active_sub_stmt)
        if not active_res.scalars().first():
            print(f"DEBUG: No active local subscription found at all for user {user.id}. Reverting plan_type to FREE.")
            user.plan_type = PlanType.FREE

    session.add(user)
    await session.commit()

    return active_sub is not None


async def calculate_proration(
    session: AsyncSession,
    user_id: str,
    polar_product_id: str
) -> dict:
    """
    Calculate proration amount before upgrading.
    """
    print(f"DEBUG: calculate_proration called with user_id={user_id}, polar_product_id={polar_product_id}")
    
    # Get current subscription with plan and prices loaded
    stmt = select(Subscription).where(
        Subscription.user_id == user_id,
        Subscription.status == SubscriptionStatus.ACTIVE
    ).order_by(Subscription.created_at.desc()).limit(1).options(
        selectinload(Subscription.plan).selectinload(Plan.prices)
    )
    
    result = await session.execute(stmt)
    current_sub = result.scalars().first()
    
    if not current_sub:
        print(f"DEBUG: No active subscription found for user {user_id}")
        return {"can_upgrade": False, "message": "No active subscription"}
    
    print(f"DEBUG: Found current subscription: {current_sub.id}")
    print(f"DEBUG: Current plan: {current_sub.plan.name}")
    print(f"DEBUG: Current period end: {current_sub.current_period_end}")
    
    # Get new plan with prices loaded
    plan_stmt = select(Plan).where(
        Plan.polar_plan_id == polar_product_id
    ).options(selectinload(Plan.prices))
    
    plan_result = await session.execute(plan_stmt)
    new_plan = plan_result.scalars().first()
    
    if not new_plan:
        print(f"DEBUG: Plan with Polar ID {polar_product_id} not found")
        return {"can_upgrade": False, "message": "Plan not found"}
    
    print(f"DEBUG: Found new plan: {new_plan.name}")
    
    # Helper function to get price amount from plan
    def get_plan_price(plan):
        if plan.prices:
            # Assuming the first price is the monthly price
            # You might need to filter by billing_cycle or other criteria
            for price in plan.prices:
                print(f"DEBUG: Price object: {price}")
                print(f"DEBUG: Price attributes: {[attr for attr in dir(price) if not attr.startswith('_')]}")
                
                # Try common price field names
                amount_field = None
                for field in ['amount', 'price', 'monthly_amount', 'monthly_price']:
                    if hasattr(price, field):
                        amount_field = field
                        break
                
                if amount_field:
                    amount = getattr(price, amount_field)
                    print(f"DEBUG: Found price amount: {amount} from field '{amount_field}'")
                    # Convert to float if it's a string
                    if isinstance(amount, str):
                        try:
                            return float(amount)
                        except ValueError:
                            return 0.0
                    return float(amount) if amount else 0.0
        return 0.0
    
    current_price = get_plan_price(current_sub.plan)
    new_price = get_plan_price(new_plan)
    
    print(f"DEBUG: Current price: {current_price}")
    print(f"DEBUG: New price: {new_price}")
    
    if new_price <= current_price:
        return {
            "can_upgrade": False,
            "message": "This appears to be a downgrade or same price plan",
            "is_downgrade": True,
            "current_price": current_price,
            "new_price": new_price
        }
    
    # Calculate days remaining in current billing cycle
    if current_sub.current_period_end:
        now = datetime.now(timezone.utc)
        print(f"DEBUG: Now: {now}")
        print(f"DEBUG: Current period end: {current_sub.current_period_end}")
        
        if current_sub.current_period_end > now:
            # Calculate exact time remaining (in days with decimals for accuracy)
            time_remaining = (current_sub.current_period_end - now)
            days_remaining = time_remaining.total_seconds() / (24 * 3600)  # Convert to days
            
            # Get billing cycle length in days
            # Try to get from subscription metadata or use default
            total_days = 30  # Default monthly billing
            
            # If subscription has metadata with billing cycle, use that
            if current_sub.metadata and 'billing_cycle_days' in current_sub.metadata:
                total_days = current_sub.metadata['billing_cycle_days']
            elif current_sub.plan.billing_cycle:
                # Convert billing cycle to days
                billing_cycle = current_sub.plan.billing_cycle.lower()
                if 'month' in billing_cycle:
                    total_days = 30
                elif 'year' in billing_cycle:
                    total_days = 365
                elif 'week' in billing_cycle:
                    total_days = 7
            
            print(f"DEBUG: Days remaining: {days_remaining}")
            print(f"DEBUG: Total days in billing cycle: {total_days}")
            
            if days_remaining > 0:
                # Calculate prorated amount
                price_difference = new_price - current_price
                
                # Calculate exact prorated amount
                prorated_amount = price_difference * (days_remaining / total_days)
                
                print(f"DEBUG: Price difference: {price_difference}")
                print(f"DEBUG: Prorated amount: {prorated_amount}")
                
                return {
                    "can_upgrade": True,
                    "proration_applicable": True,
                    "current_plan": current_sub.plan.name,
                    "new_plan": new_plan.name,
                    "current_price": current_price,
                    "new_price": new_price,
                    "price_difference": round(price_difference, 2),
                    "days_remaining": int(days_remaining),  # Return integer days
                    "prorated_amount": round(prorated_amount, 2),
                    "will_be_charged_immediately": True,
                    "next_full_billing": current_sub.current_period_end.isoformat() if current_sub.current_period_end else None
                }
    
    # If no current_period_end or period has ended
    return {
        "can_upgrade": True,
        "proration_applicable": False,
        "message": "Will start new billing cycle immediately",
        "current_plan": current_sub.plan.name,
        "new_plan": new_plan.name,
        "current_price": current_price,
        "new_price": new_price
    }



async def upgrade_subscription(
        session: AsyncSession,
        user_id: str,
        new_plan_polar_id: str
    ) -> dict:
        """
        Upgrades a user's subscription to a new plan using Polar's generic update (patch).
        
        Logic:
        1. Find current active subscription.
        2. Find new plan details.
        3. Archive current subscription state to SubscriptionHistory.
        4. Call Polar API to update (patch) the subscription with new price_id.
        5. Update local subscription record to reflect new plan.
        """
        print(f"DEBUG V1: Upgrade requested for user {user_id} to plan {new_plan_polar_id}")
        
        # 1. Get current active subscription
        stmt = select(Subscription).where(
            Subscription.user_id == user_id,
            Subscription.status == SubscriptionStatus.ACTIVE
        ).order_by(Subscription.created_at.desc()).limit(1).options(
            selectinload(Subscription.plan)
        )
        result = await session.execute(stmt)
        current_sub = result.scalars().first()
        
        if not current_sub:
             raise HTTPException(status_code=400, detail="No active subscription found to upgrade.")
             
        # 2. Get new plan details
        plan_stmt = select(Plan).where(Plan.polar_plan_id == new_plan_polar_id).options(selectinload(Plan.prices))
        plan_result = await session.execute(plan_stmt)
        new_plan = plan_result.scalars().first()
        
        if not new_plan:
            raise HTTPException(status_code=404, detail="New plan not found.")
            
        if current_sub.plan_id == new_plan.id:
             return {"success": False, "message": "Already on this plan."}

        # Find new price ID (Polar Price ID)
        new_polar_price_id = None
        if new_plan.prices:
            for price in new_plan.prices:
                if price.polar_price_id:
                    new_polar_price_id = price.polar_price_id
                    break
        
        if not new_polar_price_id:
             # Fallback: check plan metadata or throw error
             # Some setups might store it differently
             raise HTTPException(status_code=400, detail="Price ID for new plan not found.")

        print(f"DEBUG V1: Upgrading from {current_sub.plan.name} to {new_plan.name}")
        
        # 3. Archive to SubscriptionHistory
        # history_entry = SubscriptionHistory(
        #     subscription_id=current_sub.id,
        #     previous_plan_id=current_sub.plan_id,
        #     polar_subscription_id=current_sub.polar_subscription_id,
        #     status=current_sub.status,
        #     user_id=user_id,
        #     created_at=datetime.utcnow()
        # )
        # session.add(history_entry)
        
        # 4. Call Polar API
        def _call_polar_update():
            with get_polar_client() as polar:
                # https://docs.polar.sh/api/v1/subscriptions/update
                # Using 'always_invoice' to trigger immediate charge/proration if configured
                return polar.subscriptions.update(
                    id=current_sub.polar_subscription_id,
                    subscription_update={
                        "product_id": new_plan_polar_id,
                        "proration_behavior": "invoice"
                    }
                )
        
        try:
            polar_updated_sub =await run_in_threadpool(_call_polar_update)
            print(f"DEBUG V1: Polar update successful: {polar_updated_sub.id}")
        except Exception as e:
            await session.rollback()
            print(f"ERROR V1: Polar update failed: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to upgrade subscription with provider: {str(e)}")

        # 5. Update local subscription and user
        current_sub.plan_id = new_plan.id
        current_sub.updated_at = datetime.utcnow()
        
        # Determine plan type for user profile
        user_stmt = select(UserProfile).where(UserProfile.id == user_id)
        user_res = await session.execute(user_stmt)
        user = user_res.scalar_one_or_none()
        
        if user:
            user.plan_type = new_plan.plan_type
            session.add(user)
            
        session.add(current_sub)
        await session.commit()
        
        return {
            "success": True,
            "message": f"Successfully upgraded to {new_plan.name}",
            "new_plan": new_plan.name,
            "plan_type": new_plan.plan_type.value
        }


async def calculate_downgrade_proration(
    session: AsyncSession,
    user_id: str,
    polar_product_id: str
) -> dict:
    """
    Calculate proration/credit amount for downgrading to a lower-tier plan.
    
    Returns:
    - Current plan details
    - New plan details
    - Credit amount (unused portion of current plan)
    - Immediate charge for new plan's prorated period
    - Net amount (could be negative if credit > new charge)
    """
    print(f"DEBUG: calculate_downgrade_proration called with user_id={user_id}, polar_product_id={polar_product_id}")
    
    # Get current subscription with plan and prices loaded
    stmt = select(Subscription).where(
        Subscription.user_id == user_id,
        Subscription.status == SubscriptionStatus.ACTIVE
    ).order_by(Subscription.created_at.desc()).limit(1).options(
        selectinload(Subscription.plan).selectinload(Plan.prices)
    )
    
    result = await session.execute(stmt)
    current_sub = result.scalars().first()
    
    if not current_sub:
        print(f"DEBUG: No active subscription found for user {user_id}")
        return {"error": "No active subscription found"}
    
    print(f"DEBUG: Found current subscription: {current_sub.id}")
    print(f"DEBUG: Current plan: {current_sub.plan.name}")
    
    # Get new plan with prices loaded
    plan_stmt = select(Plan).where(
        Plan.polar_plan_id == polar_product_id
    ).options(selectinload(Plan.prices))
    
    plan_result = await session.execute(plan_stmt)
    new_plan = plan_result.scalars().first()
    
    if not new_plan:
        print(f"DEBUG: Plan with Polar ID {polar_product_id} not found")
        return {"error": "Plan not found"}
    
    print(f"DEBUG: Found new plan: {new_plan.name}")
    
    # Helper function to get price amount from plan
    def get_plan_price(plan):
        if plan.prices:
            for price in plan.prices:
                # Try common price field names
                for field in ['amount', 'price', 'monthly_amount', 'monthly_price']:
                    if hasattr(price, field):
                        amount = getattr(price, field)
                        if amount:
                            if isinstance(amount, str):
                                try:
                                    return float(amount)
                                except ValueError:
                                    continue
                            return float(amount)
        return 0.0
    
    current_price = get_plan_price(current_sub.plan)
    new_price = get_plan_price(new_plan)
    
    print(f"DEBUG: Current price: {current_price}")
    print(f"DEBUG: New price: {new_price}")
    
    # Check if this is actually a downgrade
    if new_price >= current_price:
        return {
            "error": "This appears to be an upgrade or same price plan. Use upgrade endpoint instead.",
            "is_upgrade": True,
            "current_price": current_price,
            "new_price": new_price
        }
    
    # Calculate days remaining in current billing cycle
    if current_sub.current_period_end:
        now = datetime.now(timezone.utc)
        
        if current_sub.current_period_end > now:
            time_remaining = (current_sub.current_period_end - now)
            days_remaining = time_remaining.total_seconds() / (24 * 3600)
            
            # Billing cycle length
            total_days = 30  # Default monthly billing
            
            print(f"DEBUG: Days remaining: {days_remaining}")
            print(f"DEBUG: Total days in billing cycle: {total_days}")
            
            if days_remaining > 0:
                # Calculate credit from unused portion of current plan
                unused_credit = current_price * (days_remaining / total_days)
                
                # Calculate charge for new plan's prorated period
                new_plan_prorated_charge = new_price * (days_remaining / total_days)
                
                # Net amount (negative means user gets credit, positive means charge)
                net_amount = new_plan_prorated_charge - unused_credit
                
                print(f"DEBUG: Unused credit: {unused_credit}")
                print(f"DEBUG: New plan prorated charge: {new_plan_prorated_charge}")
                print(f"DEBUG: Net amount: {net_amount}")
                
                return {
                    "can_downgrade": True,
                    "proration_applicable": True,
                    "current_plan": current_sub.plan.name,
                    "new_plan": new_plan.name,
                    "current_price": current_price,
                    "new_price": new_price,
                    "price_difference": round(new_price - current_price, 2),
                    "days_remaining": int(days_remaining),
                    "unused_credit": round(unused_credit, 2),
                    "new_plan_prorated_charge": round(new_plan_prorated_charge, 2),
                    "net_amount": round(net_amount, 2),
                    "will_receive_credit": net_amount < 0,
                    "credit_or_charge_description": f"You'll receive ${abs(round(net_amount, 2))} credit" if net_amount < 0 else f"You'll be charged ${round(net_amount, 2)}",
                    "next_billing_date": current_sub.current_period_end.isoformat() if current_sub.current_period_end else None,
                    "next_full_billing_amount": new_price
                }
    
    # If no current_period_end or period has ended
    return {
        "can_downgrade": True,
        "proration_applicable": False,
        "message": "Will start new billing cycle immediately at lower price",
        "current_plan": current_sub.plan.name,
        "new_plan": new_plan.name,
        "current_price": current_price,
        "new_price": new_price
    }


async def downgrade_subscription(
    session: AsyncSession,
    user_id: str,
    new_plan_polar_id: str
) -> dict:
    """
    Downgrades a user's subscription to a lower-tier plan using Polar's update API.
    
    Logic:
    1. Find current active subscription
    2. Find new plan details
    3. Verify it's actually a downgrade
    4. Archive current subscription state to SubscriptionHistory
    5. Call Polar API to update the subscription
    6. Update local subscription record to reflect new plan
    """
    print(f"DEBUG: Downgrade requested for user {user_id} to plan {new_plan_polar_id}")
    
    # 1. Get current active subscription
    stmt = select(Subscription).where(
        Subscription.user_id == user_id,
        Subscription.status == SubscriptionStatus.ACTIVE
    ).order_by(Subscription.created_at.desc()).limit(1).options(
        selectinload(Subscription.plan).selectinload(Plan.prices)
    )
    result = await session.execute(stmt)
    current_sub = result.scalars().first()
    
    if not current_sub:
        raise HTTPException(status_code=400, detail="No active subscription found to downgrade.")
    
    # 2. Get new plan details
    plan_stmt = select(Plan).where(Plan.polar_plan_id == new_plan_polar_id).options(
        selectinload(Plan.prices)
    )
    plan_result = await session.execute(plan_stmt)
    new_plan = plan_result.scalars().first()
    
    if not new_plan:
        raise HTTPException(status_code=404, detail="New plan not found.")
    
    if current_sub.plan_id == new_plan.id:
        return {"success": False, "message": "Already on this plan."}
    
    # 3. Verify it's a downgrade (optional but recommended)
    def get_plan_price(plan):
        if plan.prices:
            for price in plan.prices:
                for field in ['amount', 'price', 'monthly_amount', 'monthly_price']:
                    if hasattr(price, field):
                        amount = getattr(price, field)
                        if amount:
                            return float(amount) if not isinstance(amount, str) else float(amount)
        return 0.0
    
    current_price = get_plan_price(current_sub.plan)
    new_price = get_plan_price(new_plan)
    
    if new_price >= current_price:
        raise HTTPException(
            status_code=400, 
            detail="This appears to be an upgrade. Please use the upgrade endpoint instead."
        )
    
    print(f"DEBUG: Downgrading from {current_sub.plan.name} (${current_price}) to {new_plan.name} (${new_price})")
    
    # 4. Archive to SubscriptionHistory
    history_entry = SubscriptionHistory(
        subscription_id=current_sub.id,
        previous_plan_id=current_sub.plan_id,
        polar_subscription_id=current_sub.polar_subscription_id,
        status=current_sub.status,
        user_id=user_id,
        archived_at=datetime.now(timezone.utc)
    )
    session.add(history_entry)
    print(f"DEBUG: Archived subscription history")
    
    # 5. Call Polar API to update subscription
    def _call_polar_downgrade():
        with get_polar_client() as polar:
            # Update subscription with new product
            # Polar will handle proration automatically based on proration_behavior
            return polar.subscriptions.update(
                id=current_sub.polar_subscription_id,
                subscription_update={
                    "product_id": new_plan_polar_id,
                    "proration_behavior": "invoice"  
                }
            )
    
    try:
        polar_updated_sub = await run_in_threadpool(_call_polar_downgrade)
        print(f"DEBUG: Polar downgrade successful: {polar_updated_sub.id}")
    except Exception as e:
        await session.rollback()
        print(f"ERROR: Polar downgrade failed: {e}")
        raise HTTPException(
            status_code=400, 
            detail=f"Failed to downgrade subscription with provider: {str(e)}"
        )
    
    # 6. Update local subscription and user
    current_sub.plan_id = new_plan.id
    current_sub.updated_at = datetime.utcnow()
    
    # Update user profile plan type
    user_stmt = select(UserProfile).where(UserProfile.id == user_id)
    user_res = await session.execute(user_stmt)
    user = user_res.scalar_one_or_none()
    
    if user:
        user.plan_type = new_plan.plan_type
        session.add(user)
    
    session.add(current_sub)
    await session.commit()
    
    return {
        "success": True,
        "message": f"Successfully downgraded to {new_plan.name}",
        "previous_plan": current_sub.plan.name,
        "new_plan": new_plan.name,
        "plan_type": new_plan.plan_type.value,
        "price_change": f"${current_price} → ${new_price}"
    }


async def cancel_user_subscription(
    session: AsyncSession,
    user_id: str,
    subscription_id: str
) -> dict:
    """
    Cancels the user's subscription using the Customer Portal API via a Customer Session.
    """
    print(f"DEBUG: cancel_user_subscription called for user {user_id}")
    
    # 1. Fetch User
    stmt = select(UserProfile).where(UserProfile.id == user_id)
    result = await session.execute(stmt)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # 2. Check for active subscription
    sub_stmt = select(Subscription).where(
        Subscription.user_id == user_id,
        Subscription.id==subscription_id,
        Subscription.status == SubscriptionStatus.ACTIVE
    )
    res = await session.execute(sub_stmt)
    subscription = res.scalar_one_or_none()
    
    if not subscription:
        print(f"DEBUG: No active subscription for user {user_id}")
        raise HTTPException(status_code=400, detail="No active subscription found to cancel")

    if not subscription.polar_subscription_id:
        raise HTTPException(status_code=400, detail="Subscription missing Polar ID cannot be canceled")

    # 3. Check for valid Customer Token
    customer_token = user.customer_token
    token_exp = user.token_exp
    
    # Check expiry
    is_valid = False
    if customer_token and token_exp:
        # Ensure UTC comparison
        now = datetime.now(timezone.utc)
        if token_exp.tzinfo is None:
            token_exp = token_exp.replace(tzinfo=timezone.utc)
        
        if token_exp > now:
            is_valid = True
            print("DEBUG: Using existing valid customer token")
        else:
            print("DEBUG: Customer token expired")
    else:
        print("DEBUG: No customer token found")
        
    if not is_valid:
        # Create new Customer Session
        print("DEBUG: Creating new Customer Session")
        
        if not user.polar_customer_id:
             raise HTTPException(status_code=400, detail="User has no Polar Customer ID linked")
             
        def _create_session():
            with get_polar_client() as polar:
                # Returns CustomerSession
                return polar.customer_sessions.create(
                    request={
                        "customer_id": user.polar_customer_id
                    }
                )
        
        try:
            session_data = await run_in_threadpool(_create_session)
            customer_token = session_data.token
            
            user.customer_token = customer_token
            user.token_exp = session_data.expires_at
            
            session.add(user)
            await session.commit()
            print("DEBUG: New customer session created and saved")
            
        except Exception as e:
            print(f"ERROR: Failed to create customer session: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to establish customer session: {str(e)}")

    # 4. Cancel using Customer Client
    print("DEBUG: Cancelling subscription via Customer Portal")
    
    def _cancel_sub():
        client = get_polar_customer_client(customer_token)
        with client:
            # Cancel subscription
            return client.customer_portal.subscriptions.cancel(
                security=polar_sdk.CustomerPortalSubscriptionsCancelSecurity(
                    customer_session=customer_token,
                ),
                id=subscription.polar_subscription_id)
            
    try:
        # returns Subscription object
        canceled_sub = await run_in_threadpool(_cancel_sub)
        print(f"DEBUG: Cancel successful: {canceled_sub.id}, status: {canceled_sub.status}")
        
        # 5. Update local state
        subscription.cancel_at_period_end = True
        subscription.updated_at = datetime.now(timezone.utc)
        
        session.add(subscription)
        await session.commit()
        
        return {
            "success": True, 
            "message": "Subscription canceled successfully", 
            "data": {
                "cancel_at_period_end": True,
                "period_end": subscription.current_period_end
            }
        }
        
    except Exception as e:
        print(f"ERROR: Cancellation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to cancel subscription: {str(e)}")

