"""
Newsletter subscription — Loops integration.

POST /api/newsletter/subscribe
  Accepts an email address and creates/updates the contact in Loops
  (app.loops.so), tagging the source as "co.in website".

Public endpoint — no auth required (it's just an email capture form).
The Loops API key is stored server-side so it is never exposed to the browser.
"""

from __future__ import annotations

import logging
import httpx

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from src.settings import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/newsletter", tags=["newsletter"])

LOOPS_API_URL = "https://app.loops.so/api/v1/contacts/create"


class SubscribeRequest(BaseModel):
    email: EmailStr


class SubscribeResponse(BaseModel):
    success: bool
    message: str


@router.post("/subscribe", response_model=SubscribeResponse)
async def subscribe(payload: SubscribeRequest):
    """
    Add an email to the Loops mailing list.
    Called by the 'Subscribe for wisdom articles' form on the .co.in landing page.
    """
    settings = get_settings()

    if not settings.loops_api_key:
        logger.error("ASAM_LOOPS_API_KEY is not configured")
        raise HTTPException(
            status_code=503,
            detail="Newsletter service is not configured. Please contact info@arunachalasamudra.in."
        )

    headers = {
        "Authorization": f"ApiKey {settings.loops_api_key}",
        "Content-Type": "application/json",
    }

    body = {
        "email": payload.email,
        "subscribed": True,
        "source": "co.in website",
        "userGroup": "Newsletter",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(LOOPS_API_URL, json=body, headers=headers)

        if response.status_code in (200, 201):
            logger.info("Subscribed %s to Loops newsletter", payload.email)
            return SubscribeResponse(success=True, message="Subscribed successfully.")

        # Loops returns 409 when the contact already exists — treat as success
        if response.status_code == 409:
            logger.info("Contact %s already exists in Loops — updating subscription", payload.email)
            return SubscribeResponse(success=True, message="Already subscribed.")

        logger.error("Loops API error %s: %s", response.status_code, response.text)
        raise HTTPException(
            status_code=502,
            detail="Unable to subscribe at this time. Please try again later."
        )

    except httpx.TimeoutException:
        logger.error("Loops API timed out for %s", payload.email)
        raise HTTPException(
            status_code=504,
            detail="Request timed out. Please try again."
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Unexpected error subscribing %s: %s", payload.email, e)
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")
