from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db_session, Feature
from src.wire import FeatureCreate

router = APIRouter(prefix="/api/features", tags=["Features"])


# CREATE
@router.post("/")
async def create_feature(data: FeatureCreate, session: AsyncSession = Depends(get_db_session)):
    try:
        feature = Feature(feature_text=data.feature_text)
        session.add(feature)
        await session.commit()
        await session.refresh(feature)
        return feature
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# READ ALL
@router.get("/")
async def get_features(session: AsyncSession = Depends(get_db_session)):
    result = await session.execute(select(Feature))
    return result.scalars().all()


# READ ONE
@router.get("/{feature_id}")
async def get_feature(feature_id: int, session: AsyncSession = Depends(get_db_session)):
    result = await session.execute(select(Feature).where(Feature.id == feature_id))
    feature = result.scalar_one_or_none()
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
    return feature


# UPDATE
@router.put("/{feature_id}")
async def update_feature(feature_id: int, data: FeatureCreate, session: AsyncSession = Depends(get_db_session)):
    result = await session.execute(select(Feature).where(Feature.id == feature_id))
    feature = result.scalar_one_or_none()

    if not feature:
         raise HTTPException(status_code=404, detail="Feature not found")

    feature.feature_text = data.feature_text

    session.add(feature)
    await session.commit()
    await session.refresh(feature)
    return feature


# DELETE
@router.delete("/{feature_id}")
async def delete_feature(feature_id: int, session: AsyncSession = Depends(get_db_session)):
    result = await session.execute(select(Feature).where(Feature.id == feature_id))
    feature = result.scalar_one_or_none()

    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")

    await session.delete(feature)
    await session.commit()
    return {"status": "Feature deleted"}
