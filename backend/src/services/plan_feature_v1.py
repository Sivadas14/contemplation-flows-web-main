from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from src.db import get_db_session, PlanFeatureV1, Feature, Plan
from src.wire import PlanMappingRequestV1

router = APIRouter(prefix="/api/plan-mappings", tags=["Plan Mappings"])


# CREATE/ADD MAPPING
@router.post("/")
async def add_plan_feature_mapping(data: PlanMappingRequestV1, session: AsyncSession = Depends(get_db_session)):
    # 1. Validate plan and feature exist
    plan = await session.get(Plan, data.plan_id)
    feature = await session.get(Feature, data.feature_id)
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")

    # 2. Check for existing mapping
    stmt = select(PlanFeatureV1).where(
        and_(
            PlanFeatureV1.plan_id == data.plan_id,
            PlanFeatureV1.feature_id == data.feature_id
        )
    )
    result = await session.execute(stmt)
    existing = result.scalar_one_or_none()
    
    if existing:
        return {"message": "Mapping already exists", "id": existing.id}

    # 3. Create mapping
    mapping = PlanFeatureV1(plan_id=data.plan_id, feature_id=data.feature_id, order=data.order)
    session.add(mapping)
    try:
        await session.commit()
        await session.refresh(mapping)
        return mapping
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# READ ALL MAPPINGS (Can filter by plan_id)
@router.get("/")
async def get_mappings(plan_id: int | None = None, session: AsyncSession = Depends(get_db_session)):
    stmt = select(PlanFeatureV1).options(selectinload(PlanFeatureV1.feature)).order_by(PlanFeatureV1.order)
    if plan_id:
        stmt = stmt.where(PlanFeatureV1.plan_id == plan_id)
    
    result = await session.execute(stmt)
    return result.scalars().all()


# UPDATE MAPPING (e.g., change feature for a link)
@router.put("/{mapping_id}")
async def update_mapping(mapping_id: int, data: PlanMappingRequestV1, session: AsyncSession = Depends(get_db_session)):
    mapping = await session.get(PlanFeatureV1, mapping_id)
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
    
    # Validate new target
    feature = await session.get(Feature, data.feature_id)
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")

    mapping.plan_id = data.plan_id
    mapping.feature_id = data.feature_id
    mapping.order = data.order
    
    try:
        await session.commit()
        await session.refresh(mapping)
        return mapping
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# DELETE MAPPING
@router.delete("/{mapping_id}")
async def remove_mapping(mapping_id: int, session: AsyncSession = Depends(get_db_session)):
    mapping = await session.get(PlanFeatureV1, mapping_id)
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
    
    await session.delete(mapping)
    await session.commit()
    return {"status": "Mapping removed"}
