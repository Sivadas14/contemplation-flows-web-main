"""
Newsletter subscription — stores emails in the newsletter_subscribers table
via the Supabase admin client (bypasses RLS, no ORM model required).

POST /api/newsletter/subscribe  — saves email to database
GET  /api/newsletter/ping       — zero-dependency health check
GET  /api/newsletter/test       — returns subscriber count (diagnostic)
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from src.settings import get_settings, get_supabase_admin_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/newsletter", tags=["newsletter"])


@router.get("/ping")
async def ping():
    """Zero-dependency check — confirms this version of the code is running."""
    return {"alive": True, "version": "supabase-v2"}


class SubscribeRequest(BaseModel):
    email: EmailStr


class SubscribeResponse(BaseModel):
    success: bool
    message: str


@router.post("/subscribe", response_model=SubscribeResponse)
async def subscribe(payload: SubscribeRequest):
    """Save subscriber email to the newsletter_subscribers table via Supabase."""
    email = str(payload.email).lower().strip()
    logger.info("Newsletter subscribe request: %s", email)

    settings = get_settings()
    supabase = get_supabase_admin_client(settings_instance=settings)

    try:
        supabase.table("newsletter_subscribers").insert(
            {"email": email, "source": "co.in website"}
        ).execute()
        logger.info("Saved new subscriber: %s", email)
        return SubscribeResponse(success=True, message="Subscribed successfully.")

    except Exception as e:
        error_str = str(e).lower()
        # Postgres unique-constraint violation codes / keywords
        if any(k in error_str for k in ("duplicate", "unique", "23505")):
            logger.info("Duplicate subscriber (already exists): %s", email)
            return SubscribeResponse(success=True, message="Already subscribed.")

        logger.error("Error saving subscriber %s: %s", email, e)
        raise HTTPException(
            status_code=500,
            detail="Unable to subscribe. Please try again.",
        )


@router.get("/test")
async def test_newsletter():
    """Diagnostic: returns total subscriber count via Supabase."""
    try:
        settings = get_settings()
        supabase = get_supabase_admin_client(settings_instance=settings)
        result = supabase.table("newsletter_subscribers").select("id", count="exact").execute()
        count = result.count if result.count is not None else len(result.data)
        return {"status": "ok", "total_subscribers": count}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
