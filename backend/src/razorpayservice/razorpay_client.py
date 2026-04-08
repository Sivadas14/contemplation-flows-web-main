"""
Razorpay client factory.

Returns a configured razorpay.Client using env-provided credentials.
Validates that credentials are ASCII-only before use — Razorpay API keys
are always ASCII, and the requests library encodes Basic-Auth as latin-1.
If a non-ASCII character is found, the error message tells the operator
to re-enter the credentials from the Razorpay dashboard.
"""

import razorpay
from src.settings import get_settings


def _require_ascii(value: str, name: str) -> None:
    """Raise a clear ValueError if value contains non-ASCII characters."""
    try:
        value.encode("ascii")
    except UnicodeEncodeError as exc:
        bad_char = value[exc.start]
        raise ValueError(
            f"The {name} environment variable contains a non-ASCII character "
            f"(U+{ord(bad_char):04X} at position {exc.start}). "
            f"Razorpay keys must be plain ASCII. "
            f"Please re-enter the value from the Razorpay dashboard — "
            f"do not copy-paste from a rich text editor (some characters "
            f"look identical to ASCII letters but are not, e.g. Cyrillic X vs Latin X)."
        ) from exc


def get_razorpay_client() -> razorpay.Client:
    """
    Create and return a Razorpay client with configured credentials.
    Raises ValueError with a clear message if credentials are missing or contain
    non-ASCII characters.
    """
    settings = get_settings()
    key_id = settings.razorpay_key_id or ""
    key_secret = settings.razorpay_key_secret or ""

    if not key_id or not key_secret:
        raise ValueError(
            "Razorpay credentials are not configured. "
            "Set ASAM_RAZORPAY_KEY_ID and ASAM_RAZORPAY_KEY_SECRET in the environment."
        )

    # Must be ASCII — requests encodes Basic-Auth credentials as latin-1.
    _require_ascii(key_id, "ASAM_RAZORPAY_KEY_ID")
    _require_ascii(key_secret, "ASAM_RAZORPAY_KEY_SECRET")

    return razorpay.Client(auth=(key_id, key_secret))


def is_razorpay_enabled() -> bool:
    """Return True only when both Razorpay credentials are present."""
    settings = get_settings()
    return bool(settings.razorpay_key_id and settings.razorpay_key_secret)
