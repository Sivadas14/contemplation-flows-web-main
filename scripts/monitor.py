"""
Arunachala Samudra — Daily Health Monitor
==========================================
Run by GitHub Actions daily. Exits with code 1 if any check fails
(which triggers a GitHub notification email to the repo owner).

Checks:
  1. AWS App Runner (health endpoint + deployed version)
  2. Authentication endpoints (login, OTP, check-email)
  3. Public API endpoints (plans, notification bar, addons)
  4. Frontend SPA pages
  5. Admin API endpoints
  6. Knowledge base (indexed books count + failed books)
  7. Polar payment gateway reachability + webhook endpoint
  8. Razorpay payment gateway reachability + webhook endpoint
  9. Chat API availability
"""

import requests
import sys
from datetime import datetime, timezone

# ─── Config ───────────────────────────────────────────────────────────────────

BASE_URL     = "https://www.arunachalasamudra.co.in"
POLAR_API    = "https://api.polar.sh"
RAZORPAY_API = "https://api.razorpay.com/v1"
TIMEOUT      = 15   # seconds per request

# ─── Helpers ──────────────────────────────────────────────────────────────────

results = []  # (label, ok, detail)

def check(label: str, ok: bool, detail: str = ""):
    icon = "✅" if ok else "❌"
    results.append((label, ok, detail))
    suffix = f"  →  {detail}" if detail else ""
    print(f"  {icon}  {label}{suffix}")

def section(title: str):
    print(f"\n{'─' * 60}")
    print(f"  {title}")
    print(f"{'─' * 60}")

def safe_get(url: str, **kwargs):
    return requests.get(url, timeout=TIMEOUT, **kwargs)

def safe_post(url: str, **kwargs):
    return requests.post(url, timeout=TIMEOUT, **kwargs)

# ─── 1. App Runner Health ─────────────────────────────────────────────────────

section("1 · AWS App Runner — Server Health")
try:
    r = safe_get(f"{BASE_URL}/health")
    data = r.json()
    ok = r.status_code == 200 and data.get("status") == "healthy"
    version = data.get("version", "unknown")[:12]
    ts = data.get("timestamp", "")[:19]
    check("Health endpoint",   ok,         f"status={data.get('status')}  version={version}  ts={ts}")
    check("HTTP 200 response", r.status_code == 200, f"HTTP {r.status_code}")
except Exception as e:
    check("Health endpoint",   False, str(e))
    check("HTTP 200 response", False, "request failed")

# ─── 2. Authentication ────────────────────────────────────────────────────────

section("2 · Authentication")

for label, path, method, payload in [
    ("Check-email endpoint", "/api/auth/check-email",  "POST", {"email": "healthcheck@monitor.test"}),
    ("Send-OTP endpoint",    "/api/auth/send-otp",     "POST", {"email": "healthcheck@monitor.test"}),
    ("Login endpoint",       "/api/auth/login",        "POST", {"email": "healthcheck@monitor.test", "password": "x"}),
    ("Google OAuth start",   "/api/auth/google",       "POST", {"redirect_uri": "https://example.com"}),
]:
    try:
        fn = safe_post if method == "POST" else safe_get
        r = fn(f"{BASE_URL}{path}", json=payload, headers={"Content-Type": "application/json"})
        # 4xx = endpoint alive but validation/auth failed (correct). 5xx = broken.
        check(label, r.status_code < 500, f"HTTP {r.status_code}")
    except Exception as e:
        check(label, False, str(e))

# ─── 3. Public API Endpoints ──────────────────────────────────────────────────

section("3 · Public API Endpoints")

for label, path in [
    ("Plans list",        "/api/plans/"),
    ("Notification bar",  "/api/notification-bar/"),
    ("Add-ons list",      "/api/addon/"),
    ("Features list",     "/api/features/"),
]:
    try:
        r = safe_get(f"{BASE_URL}{path}")
        check(label, r.status_code < 500, f"HTTP {r.status_code}")
    except Exception as e:
        check(label, False, str(e))

# ─── 4. Frontend SPA ──────────────────────────────────────────────────────────

section("4 · Frontend (React SPA)")

for label, path in [
    ("Home page",    "/"),
    ("Sign-in page", "/signin"),
    ("Admin login",  "/admin/login"),
]:
    try:
        r = safe_get(f"{BASE_URL}{path}")
        is_html = "text/html" in r.headers.get("content-type", "")
        check(label, r.status_code == 200 and is_html,
              f"HTTP {r.status_code}  html={is_html}")
    except Exception as e:
        check(label, False, str(e))

# ─── 5. Admin API Endpoints ───────────────────────────────────────────────────

section("5 · Admin API Endpoints")

for label, path in [
    ("Admin source-data list", "/api/admin/source-data/list"),
    ("Admin users list",       "/api/admin/users"),
    ("Admin feedback",         "/api/admin/feedback"),
]:
    try:
        r = safe_get(f"{BASE_URL}{path}")
        # 200 or 401/403 = endpoint alive; 500+ = broken
        note = " (auth required — expected)" if r.status_code in (401, 403) else ""
        check(label, r.status_code < 500, f"HTTP {r.status_code}{note}")
    except Exception as e:
        check(label, False, str(e))

# ─── 6. Knowledge Base ────────────────────────────────────────────────────────

section("6 · Knowledge Base")

try:
    r = safe_get(f"{BASE_URL}/api/admin/source-data/list")
    if r.status_code == 200:
        data = r.json()
        docs = data.get("files") or data.get("source_documents") or []
        indexed    = [d for d in docs if d.get("status") == "completed"]
        processing = [d for d in docs if d.get("status") == "processing"]
        failed     = [d for d in docs if d.get("status") == "failed"]
        check("Books endpoint",
              True,
              f"total={len(docs)}  indexed={len(indexed)}  processing={len(processing)}  failed={len(failed)}")
        if failed:
            for doc in failed:
                name = doc.get("filename", "?").split("/")[-1]
                check(f"  ⚠ Failed book: {name}", False, "status=failed — re-upload needed")
        if processing:
            check("Books still processing",
                  True,   # not an error, just informational
                  f"{len(processing)} book(s) still indexing (check back later)")
    else:
        check("Books endpoint", r.status_code < 500, f"HTTP {r.status_code}")
except Exception as e:
    check("Books endpoint", False, str(e))

# ─── 7. Polar Payment Gateway ─────────────────────────────────────────────────

section("7 · Polar Payment Gateway")

try:
    r = requests.get(f"{POLAR_API}/v1/products",
                     timeout=TIMEOUT,
                     headers={"Accept": "application/json"})
    # 401 = reachable, needs auth key. That's fine — gateway is up.
    note = " (auth required — gateway is up)" if r.status_code == 401 else ""
    check("Polar API reachable", r.status_code < 500, f"HTTP {r.status_code}{note}")
except requests.exceptions.ConnectionError:
    check("Polar API reachable", False, "Connection error — Polar unreachable")
except requests.exceptions.Timeout:
    check("Polar API reachable", False, "Timeout — Polar not responding")
except Exception as e:
    check("Polar API reachable", False, str(e))

try:
    r = safe_post(f"{BASE_URL}/api/subscriptions/webhook",
                  json={},
                  headers={"Content-Type": "application/json"})
    note = " (signature check — expected)" if r.status_code == 400 else ""
    check("Polar webhook endpoint", r.status_code < 500, f"HTTP {r.status_code}{note}")
except Exception as e:
    check("Polar webhook endpoint", False, str(e))

# ─── 8. Razorpay Payment Gateway ──────────────────────────────────────────────

section("8 · Razorpay Payment Gateway")

try:
    r = requests.get(f"{RAZORPAY_API}/payments",
                     timeout=TIMEOUT,
                     headers={"Accept": "application/json"})
    note = " (auth required — gateway is up)" if r.status_code == 401 else ""
    check("Razorpay API reachable", r.status_code < 500, f"HTTP {r.status_code}{note}")
except requests.exceptions.ConnectionError:
    check("Razorpay API reachable", False, "Connection error — Razorpay unreachable")
except requests.exceptions.Timeout:
    check("Razorpay API reachable", False, "Timeout — Razorpay not responding")
except Exception as e:
    check("Razorpay API reachable", False, str(e))

try:
    r = safe_post(f"{BASE_URL}/api/subscriptions/razorpay-webhook",
                  json={},
                  headers={"Content-Type": "application/json"})
    note = " (signature check — expected)" if r.status_code == 400 else ""
    check("Razorpay webhook endpoint", r.status_code < 500, f"HTTP {r.status_code}{note}")
except Exception as e:
    check("Razorpay webhook endpoint", False, str(e))

# ─── 9. Chat API ──────────────────────────────────────────────────────────────

section("9 · Chat API")

try:
    r = safe_get(f"{BASE_URL}/api/chat")
    note = " (auth required — expected)" if r.status_code in (401, 403) else ""
    check("Chat endpoint", r.status_code < 500, f"HTTP {r.status_code}{note}")
except Exception as e:
    check("Chat endpoint", False, str(e))

try:
    r = safe_post(f"{BASE_URL}/api/chat",
                  json={},
                  headers={"Content-Type": "application/json"})
    check("Chat create conversation", r.status_code < 500, f"HTTP {r.status_code}")
except Exception as e:
    check("Chat create conversation", False, str(e))

# ─── Summary ──────────────────────────────────────────────────────────────────

total  = len(results)
passed = sum(1 for _, ok, _ in results if ok)
failed = total - passed
now    = datetime.now(timezone.utc).strftime("%d %b %Y %H:%M UTC")

print(f"\n{'═' * 60}")
print(f"  SUMMARY  —  {now}")
print(f"{'═' * 60}")
print(f"  Passed : {passed}/{total}")

if failed:
    print(f"  Failed : {failed}/{total}")
    print(f"\n  ⚠  Issues requiring attention:")
    for label, ok, detail in results:
        if not ok:
            print(f"    • {label}" + (f": {detail}" if detail else ""))
    sys.exit(1)
else:
    print(f"  All systems operational ✓")
    sys.exit(0)
