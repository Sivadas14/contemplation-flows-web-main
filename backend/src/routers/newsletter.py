"""
Newsletter subscription — saves email to newsletter_subscribers table via
the Supabase REST API (PostgREST).  Uses only Python standard-library modules
(urllib.request / json / asyncio) — zero additional dependencies.

Endpoints
─────────
GET  /api/newsletter/ping       health check — no DB, no imports beyond stdlib
POST /api/newsletter/subscribe  insert / ignore-duplicate, return JSON
GET  /api/newsletter/test       row count diagnostic
"""

from __future__ import annotations

import asyncio
import json
import logging
import urllib.error
import urllib.request

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from src.settings import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/newsletter", tags=["newsletter"])


# ────────────────────────────── health ──────────────────────────────────────

@router.get("/ping")
async def ping():
    """Zero-dependency liveness check.  Version bump proves new code is live."""
    return {"alive": True, "version": "v4-stdlib"}


# ────────────────────────────── models ──────────────────────────────────────

class SubscribeRequest(BaseModel):
    email: EmailStr


class SubscribeResponse(BaseModel):
    success: bool
    message: str


# ────────────────────────── sync helpers (run in thread) ────────────────────

def _sb_insert(supabase_url: str, api_key: str, email: str) -> str:
    """
    POST to Supabase REST API with upsert semantics:
      ?on_conflict=email + Prefer: resolution=ignore-duplicates

    Returns "new" (201) or "duplicate" (200) or raises RuntimeError.
    """
    url = f"{supabase_url.rstrip('/')}/rest/v1/newsletter_subscribers?on_conflict=email"
    payload = json.dumps({"email": email, "source": "co.in website"}).encode("utf-8")

    req = urllib.request.Request(url, data=payload, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("apikey", api_key)
    req.add_header("Authorization", f"Bearer {api_key}")
    req.add_header("Prefer", "return=minimal,resolution=ignore-duplicates")

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            # 201 = new row; 200 = conflict ignored (duplicate)
            return "new" if resp.status == 201 else "duplicate"
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        # Catch a stray unique-violation just in case
        if e.code == 409 or "23505" in body:
            return "duplicate"
        raise RuntimeError(f"Supabase {e.code}: {body[:300]}")


def _sb_count(supabase_url: str, api_key: str) -> int:
    """Return total rows in newsletter_subscribers via Prefer: count=exact."""
    url = f"{supabase_url.rstrip('/')}/rest/v1/newsletter_subscribers?select=id"
    req = urllib.request.Request(url, method="GET")
    req.add_header("apikey", api_key)
    req.add_header("Authorization", f"Bearer {api_key}")
    req.add_header("Prefer", "count=exact")

    with urllib.request.urlopen(req, timeout=10) as resp:
        # Content-Range: 0-N/TOTAL  or  */TOTAL
        cr = resp.headers.get("Content-Range", "*/0")
        return int(cr.split("/")[-1])


# ────────────────────────────── endpoints ───────────────────────────────────

@router.post("/subscribe", response_model=SubscribeResponse)
async def subscribe(payload: SubscribeRequest):
    """Insert email into newsletter_subscribers (ignores duplicates)."""
    email = str(payload.email).lower().strip()
    logger.info("Newsletter subscribe: %s", email)

    settings = get_settings()
    # Prefer service-role key (bypasses RLS); fall back to anon key
    api_key = settings.supabase_service_role_key or settings.supabase_key

    try:
        result = await asyncio.to_thread(
            _sb_insert, settings.supabase_url, api_key, email
        )
        if result == "duplicate":
            logger.info("Already subscribed: %s", email)
            return SubscribeResponse(success=True, message="Already subscribed.")
        logger.info("New subscriber saved: %s", email)
        return SubscribeResponse(success=True, message="Subscribed successfully.")

    except Exception as exc:
        logger.error("Newsletter subscribe error for %s: %s", email, exc)
        raise HTTPException(
            status_code=500,
            detail="Unable to subscribe. Please try again.",
        )


@router.get("/test")
async def test_newsletter():
    """Diagnostic: return total subscriber count from Supabase."""
    try:
        settings = get_settings()
        api_key = settings.supabase_service_role_key or settings.supabase_key
        count = await asyncio.to_thread(_sb_count, settings.supabase_url, api_key)
        return {"status": "ok", "total_subscribers": count}
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}
