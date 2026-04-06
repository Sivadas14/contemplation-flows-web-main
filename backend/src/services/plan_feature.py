# src/routes/plan_feature.py

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import uuid4

from src.db import get_db_session
from src.db import PlanFeature
from src.wire import PlanFeatureCreate
router = APIRouter(prefix="/api/plan-features", tags=["Plan Features"])


# CREATE
@router.post("/")
async def create_feature(data: PlanFeatureCreate, session: AsyncSession = Depends(get_db_session)):
    try:
        feature = PlanFeature( **data.dict())
        session.add(feature)
        await session.commit()
        await session.refresh(feature)
        return feature
    except Exception as e:
        await session.rollback()
        return {"error": str(e)}


# READ ALL
@router.get("/")
async def get_features(session: AsyncSession = Depends(get_db_session)):
    result = await session.execute(select(PlanFeature).order_by(PlanFeature.order))
    return result.scalars().all()


# READ ONE
@router.get("/{feature_id}")
async def get_feature(feature_id: int, session: AsyncSession = Depends(get_db_session)):
    result = await session.execute(select(PlanFeature).where(PlanFeature.id == feature_id))
    feature = result.scalar_one_or_none()
    return feature or {"error": "Feature not found"}


# UPDATE
@router.put("/{feature_id}")
async def update_feature(feature_id: int, data: PlanFeatureCreate, session: AsyncSession = Depends(get_db_session)):
    result = await session.execute(select(PlanFeature).where(PlanFeature.id == feature_id))
    feature = result.scalar_one_or_none()

    if not feature:
        return {"error": "Feature not found"}

    for key, value in data.dict().items():
        setattr(feature, key, value)

    session.add(feature)
    await session.commit()
    await session.refresh(feature)
    return feature


# DELETE
@router.delete("/{feature_id}")
async def delete_feature(feature_id: int, session: AsyncSession = Depends(get_db_session)):
    result = await session.execute(select(PlanFeature).where(PlanFeature.id == feature_id))
    feature = result.scalar_one_or_none()

    if not feature:
        return {"error": "Feature not found"}

    await session.delete(feature)
    await session.commit()
    return {"status": "Feature deleted"}
