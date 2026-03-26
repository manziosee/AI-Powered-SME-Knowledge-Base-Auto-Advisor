"""
Smoke tests — fast, no live DB/Redis required.

Imports are at module level so SQLAlchemy only registers each model
class once per pytest session (avoids the double-registration error).
"""

# ── Module-level imports ───────────────────────────────────────────────────────
from app.core.config import settings
from app.api.v1.endpoints.search import _extract_excerpt
from app.api.v1.endpoints.insights import _score_to_grade, _get_recommendations
from app.models.document import DocumentStatus, DocumentType
from app.models.knowledge_entry import KnowledgeType, RiskLevel


# ── Config ────────────────────────────────────────────────────────────────────

def test_settings_loads():
    assert settings.APP_NAME == "SME Knowledge Base Auto Advisor"
    assert settings.API_V1_PREFIX == "/api/v1"


def test_settings_environment():
    assert isinstance(settings.ENVIRONMENT, str)


def test_allowed_extensions_parsed():
    exts = settings.allowed_extensions_list
    assert isinstance(exts, list)
    assert ".pdf" in exts


# ── Search helper ─────────────────────────────────────────────────────────────

def test_extract_excerpt_mid_text():
    text = "Hello world. This document covers VAT compliance for SMEs in detail."
    result = _extract_excerpt(text, "VAT", context=40)
    assert "VAT" in result


def test_extract_excerpt_not_found():
    text = "Nothing relevant here."
    result = _extract_excerpt(text, "GDPR", context=40)
    assert result == text


def test_extract_excerpt_empty():
    assert _extract_excerpt("", "query") == ""


def test_extract_excerpt_adds_ellipsis():
    text = "A" * 300
    result = _extract_excerpt(text, "A", context=50)
    assert len(result) < len(text)


# ── Insights helpers ──────────────────────────────────────────────────────────

def test_score_to_grade_a():
    assert _score_to_grade(95) == "A"
    assert _score_to_grade(90) == "A"


def test_score_to_grade_b():
    assert _score_to_grade(82) == "B"
    assert _score_to_grade(80) == "B"


def test_score_to_grade_lower():
    assert _score_to_grade(71) == "C"
    assert _score_to_grade(63) == "D"
    assert _score_to_grade(40) == "F"


def test_get_recommendations_returns_list():
    components = [
        {"label": "Doc Coverage", "status": "critical", "detail": "0 docs"},
        {"label": "Processing",   "status": "warning",  "detail": "50%"},
    ]
    recs = _get_recommendations(50, components)
    assert isinstance(recs, list)
    assert len(recs) > 0
    assert all("priority" in r and "action" in r for r in recs)


def test_recommendations_capped_at_five():
    components = [{"label": f"C{i}", "status": "critical", "detail": "x"} for i in range(10)]
    recs = _get_recommendations(20, components)
    assert len(recs) <= 5


def test_recommendations_empty_for_healthy():
    recs = _get_recommendations(95, [{"label": "A", "status": "good", "detail": "ok"}])
    assert isinstance(recs, list)


# ── Document model enums ───────────────────────────────────────────────────────

def test_document_status_values():
    assert DocumentStatus.PROCESSED == "processed"
    assert DocumentStatus.UPLOADED  == "uploaded"
    assert DocumentStatus.FAILED    == "failed"
    assert DocumentStatus.PROCESSING == "processing"


def test_document_type_values():
    assert DocumentType.CONTRACT     == "contract"
    assert DocumentType.INVOICE      == "invoice"
    assert DocumentType.POLICY       == "policy"
    assert DocumentType.COMPLIANCE   == "compliance"


# ── Knowledge entry enums ─────────────────────────────────────────────────────

def test_knowledge_type_values():
    assert KnowledgeType.OBLIGATION     == "obligation"
    assert KnowledgeType.RECOMMENDATION == "recommendation"
    assert KnowledgeType.DEADLINE       == "deadline"
    assert KnowledgeType.RISK           == "risk"


def test_risk_level_values():
    assert RiskLevel.LOW      == "low"
    assert RiskLevel.MEDIUM   == "medium"
    assert RiskLevel.HIGH     == "high"
    assert RiskLevel.CRITICAL == "critical"
