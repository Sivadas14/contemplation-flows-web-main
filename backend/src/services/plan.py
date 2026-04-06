from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from src.db import get_db_session, Plan, PlanPrice, PlanFeature 
from src.wire import PlanCreate
import logging

router = APIRouter(prefix="/api/plans", tags=["Plans"])


async def get_plan_with_relationships(plan_id: int, session: AsyncSession) -> Plan | None:
    """
    Helper function to fetch a single Plan with its related Prices and Features eagerly loaded.
    """
    stmt = select(Plan).where(Plan.id == plan_id).options(
        selectinload(Plan.prices),
        selectinload(Plan.features)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()

@router.post("/")
async def create_plan(data: PlanCreate, session: AsyncSession = Depends(get_db_session)):
    plan = None  # Prevent UnboundLocalError

    try:
        # ----------------------------------------
        # 1. Extract nested lists
        # ----------------------------------------
        plan_prices_data = [p.dict() for p in data.prices] if data.prices else []
        plan_features_data = [f.dict() for f in data.features] if data.features else []

        # ----------------------------------------
        # 2. Check for duplicate feature_text
        # ----------------------------------------
        feature_texts = [f["feature_text"] for f in plan_features_data]
        if len(feature_texts) != len(set(feature_texts)):
            return {"error": "Duplicate feature_text found in plan_features."}

        # ----------------------------------------
        # 3. Prepare top-level plan fields
        # ----------------------------------------
        plan_data_for_db = data.dict(exclude={"prices", "features"})

        # ----------------------------------------
        # 4. Create Plan and commit to get ID
        # ----------------------------------------
        plan = Plan(**plan_data_for_db)
        session.add(plan)
        await session.commit()
        await session.refresh(plan)
        plan_id = plan.id

        # ----------------------------------------
        # 5. Integrate with POLAR
        # ----------------------------------------
        from fastapi.concurrency import run_in_threadpool
        from src.polarservice.polar_plans import (
            create_polar_product,
            create_polar_product_by_amount_free
        )

        if data.is_free:
            # FREE PLAN
            polar_res = await run_in_threadpool(
                create_polar_product_by_amount_free,
                plan_name=plan.name,
                description=plan.description,
                billing_cycle=plan.billing_cycle,
            )

        else:
            # PAID PLAN
            polar_res = await run_in_threadpool(
                create_polar_product,
                plan_name=plan.name,
                description=plan.description,
                billing_cycle=plan.billing_cycle,
                prices=plan_prices_data,
            )

        # Save Polar plan ID
        plan.polar_plan_id = polar_res.id

        # ----------------------------------------
        # 6. Attach polar price IDs
        # ----------------------------------------
        for i, polar_price in enumerate(polar_res.prices):
            if i < len(plan_prices_data):
                plan_prices_data[i]["polar_price_id"] = polar_price.id

        # ----------------------------------------
        # 7. Now create PlanPrice *once* with plan_id
        # ----------------------------------------
        for price_data in plan_prices_data:
            price_data.pop("id", None)        # clean user input
            price_data["plan_id"] = plan_id   # assign FK
            session.add(PlanPrice(**price_data))

        # ----------------------------------------
        # 8. Create PlanFeatures
        # ----------------------------------------
        for feature_data in plan_features_data:
            feature_data.pop("id", None)
            feature_data["plan_id"] = plan_id
            session.add(PlanFeature(**feature_data))

        # ----------------------------------------
        # 9. Final commit
        # ----------------------------------------
        await session.commit()

        # ----------------------------------------
        # 10. Return complete plan with relationships
        # ----------------------------------------
        return await get_plan_with_relationships(plan_id, session)

    except Exception as e:
        await session.rollback()
        logging.exception("Error occurred; rolling back")

        try:
            plan_id = getattr(plan, "id", None)
            if plan_id:
                await session.execute(delete(Plan).where(Plan.id == plan_id))
                await session.commit()
        except:
            pass

        return {"error": str(e)}




# READ ALL - GET ALL PLANS WITH NESTED DATA
@router.get("/")
async def get_plans(session: AsyncSession = Depends(get_db_session)):
    stmt = select(Plan).options(
        selectinload(Plan.prices),
        selectinload(Plan.features)
    )
    result = await session.execute(stmt)
    plans = result.scalars().unique().all()
    return plans


# READ ONE - GET ONE PLAN WITH NESTED DATA
@router.get("/{plan_id}")
async def get_plan(plan_id: int, session: AsyncSession = Depends(get_db_session)):
    plan = await get_plan_with_relationships(plan_id, session)
    return plan or {"error": "Plan not found"}

# UPDATE PLAN - Complete with Polar Integration
@router.put("/{plan_id}")
async def update_plan(plan_id: int, data: PlanCreate, session: AsyncSession = Depends(get_db_session)):
    try:
        # ----------------------------------------
        # 1. Fetch existing plan
        # ----------------------------------------
        result = await session.execute(select(Plan).where(Plan.id == plan_id))
        plan = result.scalar_one_or_none()

        if not plan:
            return {"error": "Plan not found"}

        # ----------------------------------------
        # 2. Extract nested lists
        # ----------------------------------------
        plan_prices_data = [p.dict() for p in data.prices] if data.prices else []
        plan_features_data = [f.dict() for f in data.features] if data.features else []

        # ----------------------------------------
        # 3. Check for duplicate feature_text
        # ----------------------------------------
        feature_texts = [f["feature_text"] for f in plan_features_data]
        if len(feature_texts) != len(set(feature_texts)):
            return {"error": "Duplicate feature_text found in plan_features."}

        # ----------------------------------------
        # 4. Prepare top-level plan fields
        # ----------------------------------------
        plan_data_for_db = data.dict(exclude={"prices", "features"})

        # ----------------------------------------
        # 5. Update scalar fields of Plan
        # ----------------------------------------
        for key, value in plan_data_for_db.items():
            setattr(plan, key, value)
        
        session.add(plan)
        await session.commit()
        await session.refresh(plan)

        # ----------------------------------------
        # 6. Integrate with POLAR - Update Product
        # ----------------------------------------
        from fastapi.concurrency import run_in_threadpool
        from src.polarservice.polar_plans import (
            update_polar_product,
            update_polar_product_by_amount_free
        )

        if data.is_free:
            # FREE PLAN
            polar_res = await run_in_threadpool(
                update_polar_product_by_amount_free,
                polar_product_id=plan.polar_plan_id,
                plan_name=plan.name,
                description=plan.description,
                billing_cycle=plan.billing_cycle,
            )
        else:
            # PAID PLAN
            polar_res = await run_in_threadpool(
                update_polar_product,
                polar_product_id=plan.polar_plan_id,
                plan_name=plan.name,
                description=plan.description,
                billing_cycle=plan.billing_cycle,
                prices=plan_prices_data,
            )

        # ----------------------------------------
        # 7. Attach polar price IDs
        # ----------------------------------------
        for i, polar_price in enumerate(polar_res.prices):
            if i < len(plan_prices_data):
                plan_prices_data[i]["polar_price_id"] = polar_price.id

        # ----------------------------------------
        # 8. Handle PlanPrices - Smart Update/Create/Delete
        # ----------------------------------------
        existing_prices_result = await session.execute(
            select(PlanPrice).where(PlanPrice.plan_id == plan_id)
        )
        existing_prices = {p.id: p for p in existing_prices_result.scalars().all()}
        
        incoming_price_ids = set()
        
        for price_data in plan_prices_data:
            price_id = price_data.get("id")
            
            if price_id and price_id in existing_prices:
                # Update existing price
                incoming_price_ids.add(price_id)
                price_obj = existing_prices[price_id]
                price_data.pop("id")
                price_data["plan_id"] = plan_id
                
                for key, value in price_data.items():
                    setattr(price_obj, key, value)
                session.add(price_obj)
            else:
                # Create new price
                price_data.pop("id", None)
                price_data["plan_id"] = plan_id
                session.add(PlanPrice(**price_data))
        
        # Delete prices not in incoming data
        prices_to_delete = set(existing_prices.keys()) - incoming_price_ids
        for price_id_to_delete in prices_to_delete:
            await session.delete(existing_prices[price_id_to_delete])

        # ----------------------------------------
        # 9. Handle PlanFeatures - Smart Update/Create/Delete
        # ----------------------------------------
        existing_features_result = await session.execute(
            select(PlanFeature).where(PlanFeature.plan_id == plan_id)
        )
        existing_features = {f.id: f for f in existing_features_result.scalars().all()}
        
        incoming_feature_ids = set()
        
        for feature_data in plan_features_data:
            feature_id = feature_data.get("id")
            
            if feature_id and feature_id in existing_features:
                # Update existing feature
                incoming_feature_ids.add(feature_id)
                feature_obj = existing_features[feature_id]
                feature_data.pop("id")
                feature_data["plan_id"] = plan_id
                
                for key, value in feature_data.items():
                    setattr(feature_obj, key, value)
                session.add(feature_obj)
            else:
                # Create new feature
                feature_data.pop("id", None)
                feature_data["plan_id"] = plan_id
                session.add(PlanFeature(**feature_data))
        
        # Delete features not in incoming data
        features_to_delete = set(existing_features.keys()) - incoming_feature_ids
        for feature_id_to_delete in features_to_delete:
            await session.delete(existing_features[feature_id_to_delete])
        
        # ----------------------------------------
        # 10. Final commit
        # ----------------------------------------
        await session.commit()
        
        # ----------------------------------------
        # 11. Return complete updated plan with relationships
        # ----------------------------------------
        return await get_plan_with_relationships(plan_id, session)
    
    except Exception as e:
        await session.rollback()
        logging.exception("Error occurred during update; rolling back")
        return {"error": str(e)}


# DELETE PLAN
@router.delete("/{plan_id}")
async def delete_plan(plan_id: int, session: AsyncSession = Depends(get_db_session)):
    result = await session.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()

    if not plan:
        return {"error": "Plan not found"}

    # Cascade delete will handle prices and features
    await session.delete(plan)
    await session.commit()
    return {"status": "Plan deleted", "plan_id": plan_id}