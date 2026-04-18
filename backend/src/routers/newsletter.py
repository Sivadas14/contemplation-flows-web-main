"""
Newsletter subscription — Loops integration.

POST /api/newsletter/subscribe  — adds email to Loops
GET  /api/newsletter/test       — diagnostic: tests the Loops API key live
"""

from __future__ import annotations

import logging
import httpx

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from src.settings import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/newsletter", tags=["newsletter"])

# Loops newsletter-form endpoint — public, no auth needed, uses Form ID
LOOPS_FORM_ID = "34c57503fff70c6e2f3423db78b59606"
LOOPS_FORM_URL = f"https://app.loops.so/api/newsletter-form/{LOOPS_FORM_ID}"


class SubscribeRequest(BaseModel):
    email: EmailStr


class SubscribeResponse(BaseModel):
    success: bool
    message: str


@router.post("/subscribe", response_model=SubscribeResponse)
async def subscribe(payload: SubscribeRequest):
    """Submit email to Loops via the public newsletter-form endpoint (no API key needed)."""
    logger.info("Subscribing %s to Loops via form endpoint", payload.email)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                LOOPS_FORM_URL,
                data={"email": str(payload.email)},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

        logger.info("Loops response status=%s body=%s", resp.status_code, resp.text[:300])

        data = resp.json()
        if data.get("success"):
            return SubscribeResponse(success=True, message="Subscribed successfully.")

        # Duplicate or already subscribed — still a success from user's perspective
        msg = (data.get("message") or "").lower()
        if any(w in msg for w in ("already", "exist", "duplicate", "subscribed")):
            return SubscribeResponse(success=True, message="Already subscribed.")

        logger.error("Loops form error %s: %s", resp.status_code, resp.text)
        raise HTTPException(status_code=502, detail=data.get("message", "Unable to subscribe. Please try again."))

    except httpx.TimeoutException:
        logger.error("Loops API timed out")
        raise HTTPException(status_code=504, detail="Request timed out. Please try again.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Unexpected error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test")
async def test_loops():
    """Diagnostic: submits a probe email to Loops and returns the raw response."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                LOOPS_FORM_URL,
                data={"email": "probe@arunachalasamudra.co.in"},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
        return {
            "form_id": LOOPS_FORM_ID,
            "loops_status": resp.status_code,
            "loops_body": resp.json(),
        }
    except Exception as e:
        return {"error": str(e)}
