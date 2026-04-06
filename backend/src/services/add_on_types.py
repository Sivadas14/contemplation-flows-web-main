from fastapi import APIRouter, Depends, HTTPException
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.db import get_db_session, AddonType
from src.wire import AddonTypeIn, AddonTypeOut

router = APIRouter(prefix="/api/addon", tags=["Addon Types"])


# CREATE
@router.post("/", response_model=AddonTypeOut)
async def create_addon_type(
    data: AddonTypeIn,
    session: AsyncSession = Depends(get_db_session)
):
    try:
        addon = AddonType(**data.dict())
        session.add(addon)
        await session.commit()
        await session.refresh(addon)
        return addon
    except Exception as e:
        await session.rollback()
        raise HTTPException(400, str(e))


# READ ALL
@router.get("/")
async def get_addon_types(session: AsyncSession = Depends(get_db_session)):
    import time
    start_time = time.time()
    
    # logging.info("Starting get_addon_types")
    
    result = await session.execute(select(AddonType))
    query_done_time = time.time()
    
    data = result.scalars().all()
    end_time = time.time()
    
    print(f"Query execution took: {query_done_time - start_time:.4f}s")
    print(f"Result fetching took: {end_time - query_done_time:.4f}s")
    print(f"Total function execution took: {end_time - start_time:.4f}s")
    
    return data


# READ ONE
@router.get("/{addon_id}", response_model=AddonTypeOut)
async def get_addon_type(addon_id: int, session: AsyncSession = Depends(get_db_session)):
    result = await session.execute(
        select(AddonType).where(AddonType.id == addon_id)
    )
    addon = result.scalar_one_or_none()

    if not addon:
        raise HTTPException(404, "Addon not found")
    return addon


# UPDATE
@router.put("/{addon_id}", response_model=AddonTypeOut)
async def update_addon_type(
    addon_id: int,
    data: AddonTypeIn,
    session: AsyncSession = Depends(get_db_session),
):
    result = await session.execute(
        select(AddonType).where(AddonType.id == addon_id)
    )
    addon = result.scalar_one_or_none()

    if not addon:
        raise HTTPException(404, "Addon not found")

    for k, v in data.dict().items():
        setattr(addon, k, v)

    session.add(addon)
    await session.commit()
    await session.refresh(addon)
    return addon


# DELETE
@router.delete("/{addon_id}")
async def delete_addon_type(addon_id: int, session: AsyncSession = Depends(get_db_session)):
    result = await session.execute(
        select(AddonType).where(AddonType.id == addon_id)
    )
    addon = result.scalar_one_or_none()

    if not addon:
        raise HTTPException(404, "Addon not found")

    await session.delete(addon)
    await session.commit()

    return {"status": "Addon deleted"}
