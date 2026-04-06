# src/routes/plan_price.py

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import uuid4

from src.db import get_db_session

from src.wire import PlanPriceCreate
from src.db import PlanPrice
router = APIRouter(prefix="/api/plan-prices", tags=["Plan Prices"])


# CREATE PRICE
@router.post("/")
async def create_price(data: PlanPriceCreate, session: AsyncSession = Depends(get_db_session)):
    try:
        price = PlanPrice( **data.dict())
        session.add(price)
        await session.commit()
        await session.refresh(price)
        return price
    except Exception as e:
        await session.rollback()
        return {"error": str(e)}


# READ ALL
@router.get("/")
async def get_all_prices(session: AsyncSession = Depends(get_db_session)):
    result = await session.execute(select(PlanPrice))
    return result.scalars().all()


# READ ONE
@router.get("/{price_id}")
async def get_price(price_id: int, session: AsyncSession = Depends(get_db_session)):
    result = await session.execute(select(PlanPrice).where(PlanPrice.id == price_id))
    price = result.scalar_one_or_none()
    return price or {"error": "Price not found"}


# UPDATE
@router.put("/{price_id}")
async def update_price(price_id: int, data: PlanPriceCreate, session: AsyncSession = Depends(get_db_session)):
    result = await session.execute(select(PlanPrice).where(PlanPrice.id == price_id))
    price = result.scalar_one_or_none()

    if not price:
        return {"error": "Price not found"}

    for key, value in data.dict().items():
        setattr(price, key, value)

    session.add(price)
    await session.commit()
    await session.refresh(price)
    return price


# DELETE
@router.delete("/{price_id}")
async def delete_price(price_id: int, session: AsyncSession = Depends(get_db_session)):
    result = await session.execute(select(PlanPrice).where(PlanPrice.id == price_id))
    price = result.scalar_one_or_none()

    if not price:
        return {"error": "Price not found"}

    await session.delete(price)
    await session.commit()
    return {"status": "Price deleted"}
