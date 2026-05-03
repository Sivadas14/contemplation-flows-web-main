"""Translation system module — adds multilingual support for static page content
and dispatches AI chat to language-appropriate providers.

Module layout:
    src/translation/
    ├── __init__.py            (this file — exposes routers + constants)
    ├── gateway.py             (POST /api/translate)
    ├── providers.py           (Sarvam Mayura + Azure + Google clients)
    ├── page_resolver.py       (GET /api/page/{slug}?lang=xx)
    └── models.py              (SQLAlchemy ORM rows for translation tables)

Apply alongside `src/ai/providers.py` which adds Sarvam-30B for Indic chat.
"""

INDIC_LANGS = {"hi", "ta", "te", "bn", "ml", "kn", "mr", "gu", "pa", "or", "ur"}
# Phase 1 expanded: original 9 + 7 added (de, nl, sv, da, no, fi, zh-CN)
# All 7 new languages route to Azure Translator (Sarvam covers Indic only).
# Note: Azure-specific language code mapping (e.g. "no" -> "nb", "zh-CN" -> "zh-Hans")
# is handled in providers.py::_azure_lang(), so we keep system codes consistent
# with what the .in GTranslate widget uses.
PHASE_1_LANGS = {
    "en",
    # Indian
    "hi", "ta", "te", "bn", "ml",
    # Western Europe
    "es", "fr", "de", "nl",
    # Scandinavian + Finnish
    "sv", "da", "no", "fi",
    # Middle East
    "ar",
    # East Asia
    "zh-CN",
}

from src.translation.gateway import router as translation_router
from src.translation.page_resolver import router as page_router

__all__ = ["translation_router", "page_router", "INDIC_LANGS", "PHASE_1_LANGS"]
