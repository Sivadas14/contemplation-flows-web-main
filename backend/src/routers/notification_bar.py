from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime
from src.db import NotificationBar, get_db_session

router = APIRouter(prefix="/api/notification-bar", tags=["NotificationBar"])

# Single Pydantic schema for all endpoints
class NotificationBarResponse(BaseModel):
    id: int
    message: str
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.post("/", response_model=NotificationBarResponse)
async def create_notification_bar(
    data: NotificationBarResponse,
    db: AsyncSession = Depends(get_db_session),
):
    item = NotificationBar(message=data.message)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.get("/", response_model=list[NotificationBarResponse])
async def list_notification_bar(
    db: AsyncSession = Depends(get_db_session),
):
    result = await db.execute(
        select(NotificationBar).order_by(NotificationBar.created_at.desc())
    )
    return result.scalars().all()

@router.get("/{item_id}", response_model=NotificationBarResponse)
async def get_notification_bar(
    item_id: int,
    db: AsyncSession = Depends(get_db_session),
):
    item = await db.get(NotificationBar, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")
    return item

@router.put("/{item_id}", response_model=NotificationBarResponse)
async def update_notification_bar(
    item_id: int,
    data: NotificationBarResponse,
    db: AsyncSession = Depends(get_db_session),
):
    item = await db.get(NotificationBar, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    item.message = data.message
    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=204)
async def delete_notification_bar(
    item_id: int,
    db: AsyncSession = Depends(get_db_session),
):
    item = await db.get(NotificationBar, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    await db.delete(item)
    await db.commit()