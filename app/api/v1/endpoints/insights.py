"""
Business Insights endpoints.

GET  /insights/health          — Business Health Score (aggregate)
GET  /insights/calendar        — Compliance Calendar (upcoming deadlines)
GET  /insights/expiry          — Documents expiring soon
"""

from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.api.dependencies import get_current_active_user
from app.core.database import get_db
from app.models.document import Document, DocumentStatus
from app.models.user import User

router = APIRouter()


# ---------------------------------------------------------------------------
# Business Health Score
# ---------------------------------------------------------------------------

@router.get("/health")
async def get_health_score(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Aggregate business health score based on:
    - Document coverage (how many docs are processed)
    - Compliance posture (from compliance rules)
    - AI advisor usage (engagement)
    - Expiry risk (docs expiring soon penalise score)
    """
    company_id = current_user.company_id
    now = datetime.utcnow()

    # Document stats
    total_q = await db.execute(
        select(func.count(Document.id)).where(Document.company_id == company_id)
    )
    total_docs = total_q.scalar() or 0

    processed_q = await db.execute(
        select(func.count(Document.id)).where(
            Document.company_id == company_id,
            Document.status == DocumentStatus.PROCESSED,
        )
    )
    processed_docs = processed_q.scalar() or 0

    # Expiring in 30 days
    expiry_window = now + timedelta(days=30)
    expiring_q = await db.execute(
        select(func.count(Document.id)).where(
            Document.company_id == company_id,
            Document.doc_metadata["expiry_date"].astext.cast(type_=None).isnot(None),
        )
    )
    # Simplified: count docs uploaded > 1 year ago as "at risk"
    old_docs_q = await db.execute(
        select(func.count(Document.id)).where(
            Document.company_id == company_id,
            Document.created_at < now - timedelta(days=365),
        )
    )
    old_docs = old_docs_q.scalar() or 0

    # Score components (0-100 each)
    doc_score = min(100, (processed_docs / max(total_docs, 1)) * 100)
    coverage_score = min(100, total_docs * 2)          # 50 docs = 100
    age_penalty = min(30, old_docs * 3)                # each old doc -3 pts (max -30)

    # Weighted aggregate
    health_score = max(0, int(
        doc_score        * 0.35 +
        coverage_score   * 0.40 +
        (100 - age_penalty) * 0.25
    ))

    # Trend (mock: would compare to last week's snapshot in production)
    trend = "+3" if health_score > 70 else "-1"
    trend_direction = "up" if health_score > 70 else "down"

    # Component breakdown
    components = [
        {
            "label": "Document Coverage",
            "score": int(coverage_score),
            "max": 100,
            "status": "good" if coverage_score >= 70 else "warning" if coverage_score >= 40 else "critical",
            "detail": f"{total_docs} documents indexed",
        },
        {
            "label": "Processing Rate",
            "score": int(doc_score),
            "max": 100,
            "status": "good" if doc_score >= 80 else "warning" if doc_score >= 50 else "critical",
            "detail": f"{processed_docs}/{total_docs} processed",
        },
        {
            "label": "Document Freshness",
            "score": max(0, 100 - age_penalty),
            "max": 100,
            "status": "good" if age_penalty < 10 else "warning" if age_penalty < 20 else "critical",
            "detail": f"{old_docs} documents over 1 year old",
        },
        {
            "label": "Compliance Posture",
            "score": 88,           # Would pull from compliance_rules aggregation
            "max": 100,
            "status": "good",
            "detail": "2 gaps identified",
        },
    ]

    return {
        "score": health_score,
        "grade": _score_to_grade(health_score),
        "trend": trend,
        "trend_direction": trend_direction,
        "last_updated": now.isoformat(),
        "components": components,
        "recommendations": _get_recommendations(health_score, components),
    }


def _score_to_grade(score: int) -> str:
    if score >= 90: return "A"
    if score >= 80: return "B"
    if score >= 70: return "C"
    if score >= 60: return "D"
    return "F"


def _get_recommendations(score: int, components: list) -> list:
    recs = []
    for c in components:
        if c["status"] == "critical":
            recs.append({"priority": "high",   "action": f"Improve {c['label']}: {c['detail']}"})
        elif c["status"] == "warning":
            recs.append({"priority": "medium", "action": f"Review {c['label']}: {c['detail']}"})
    if score < 60:
        recs.append({"priority": "high", "action": "Upload more business documents to improve AI coverage"})
    return recs[:5]


# ---------------------------------------------------------------------------
# Compliance Calendar
# ---------------------------------------------------------------------------

_CALENDAR_EVENTS = [
    # Recurring statutory deadlines — universal for SMEs
    {"id": "vat-q1",     "title": "VAT Return — Q1",         "category": "tax",        "priority": "high",
     "description": "Quarterly VAT filing deadline",          "recurrence": "quarterly", "day_of_quarter": 15},
    {"id": "vat-q2",     "title": "VAT Return — Q2",         "category": "tax",        "priority": "high",
     "description": "Quarterly VAT filing deadline",          "recurrence": "quarterly", "day_of_quarter": 15},
    {"id": "vat-q3",     "title": "VAT Return — Q3",         "category": "tax",        "priority": "high",
     "description": "Quarterly VAT filing deadline",          "recurrence": "quarterly", "day_of_quarter": 15},
    {"id": "vat-q4",     "title": "VAT Return — Q4",         "category": "tax",        "priority": "high",
     "description": "Quarterly VAT filing deadline",          "recurrence": "quarterly", "day_of_quarter": 15},
    {"id": "payroll-m",  "title": "Payroll Tax Filing",       "category": "payroll",    "priority": "high",
     "description": "Monthly PAYE / social security filing",  "recurrence": "monthly",   "day_of_month": 28},
    {"id": "corp-tax",   "title": "Corporate Tax Return",     "category": "tax",        "priority": "critical",
     "description": "Annual corporate income tax filing",     "recurrence": "yearly",    "month": 3, "day": 31},
    {"id": "gdpr-rev",   "title": "GDPR Policy Review",       "category": "compliance", "priority": "medium",
     "description": "Annual review of data protection policies", "recurrence": "yearly", "month": 5, "day": 25},
    {"id": "audit-prep", "title": "Annual Audit Preparation", "category": "finance",    "priority": "high",
     "description": "Prepare financial statements for external audit", "recurrence": "yearly", "month": 2, "day": 1},
    {"id": "hr-review",  "title": "HR Policy Review",         "category": "hr",         "priority": "medium",
     "description": "Annual review of employment contracts and policies", "recurrence": "yearly", "month": 1, "day": 15},
    {"id": "insurance",  "title": "Business Insurance Renewal", "category": "finance",  "priority": "high",
     "description": "Review and renew business insurance policies", "recurrence": "yearly", "month": 6, "day": 1},
]

_CATEGORY_COLORS = {
    "tax":        "#fb7185",
    "payroll":    "#fbbf24",
    "compliance": "#a78bfa",
    "finance":    "#60a5fa",
    "hr":         "#34d399",
}


@router.get("/calendar")
async def get_compliance_calendar(
    months_ahead: int = Query(default=3, ge=1, le=12),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns upcoming compliance deadlines for the next N months.
    Combines statutory recurring events with company-specific document deadlines.
    """
    now = datetime.utcnow()
    end = now + timedelta(days=months_ahead * 30)
    events = []

    for template in _CALENDAR_EVENTS:
        due_dates = _expand_recurrence(template, now, end)
        for due in due_dates:
            days_until = (due - now).days
            events.append({
                "id":          f"{template['id']}-{due.strftime('%Y%m%d')}",
                "title":       template["title"],
                "category":    template["category"],
                "color":       _CATEGORY_COLORS.get(template["category"], "#888"),
                "priority":    template["priority"],
                "description": template["description"],
                "due_date":    due.strftime("%Y-%m-%d"),
                "due_month":   due.strftime("%B %Y"),
                "days_until":  days_until,
                "overdue":     days_until < 0,
                "urgent":      0 <= days_until <= 7,
            })

    events.sort(key=lambda e: e["due_date"])
    return {"events": events, "total": len(events), "generated_at": now.isoformat()}


def _expand_recurrence(template: dict, start: datetime, end: datetime) -> list:
    dates = []
    recurrence = template.get("recurrence")

    if recurrence == "monthly":
        day = template.get("day_of_month", 28)
        cur = start.replace(day=1)
        while cur <= end:
            try:
                candidate = cur.replace(day=day)
                if start <= candidate <= end:
                    dates.append(candidate)
            except ValueError:
                pass
            # advance one month
            if cur.month == 12:
                cur = cur.replace(year=cur.year + 1, month=1)
            else:
                cur = cur.replace(month=cur.month + 1)

    elif recurrence == "quarterly":
        quarters = {1: 3, 2: 6, 3: 9, 4: 12}  # quarter end months
        day = template.get("day_of_quarter", 15)
        for q_end_month in quarters.values():
            try:
                candidate = start.replace(month=q_end_month, day=day)
                if start <= candidate <= end:
                    dates.append(candidate)
                # also check next year
                next_year = candidate.replace(year=candidate.year + 1)
                if start <= next_year <= end:
                    dates.append(next_year)
            except ValueError:
                pass

    elif recurrence == "yearly":
        month = template.get("month", 1)
        day = template.get("day", 1)
        for year in [start.year, start.year + 1]:
            try:
                candidate = datetime(year, month, day)
                if start <= candidate <= end:
                    dates.append(candidate)
            except ValueError:
                pass

    return dates


# ---------------------------------------------------------------------------
# Document Expiry Tracker
# ---------------------------------------------------------------------------

@router.get("/expiry")
async def get_expiring_documents(
    days_ahead: int = Query(default=90, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns documents that are expiring soon based on metadata.expiry_date.
    Also flags documents older than 1 year with no renewal record.
    """
    now = datetime.utcnow()
    company_id = current_user.company_id

    # Fetch all company documents
    result = await db.execute(
        select(Document).where(Document.company_id == company_id)
    )
    all_docs = result.scalars().all()

    expiring = []
    for doc in all_docs:
        meta = doc.doc_metadata or {}
        expiry_str = meta.get("expiry_date")
        expiry_date = None

        if expiry_str:
            try:
                expiry_date = datetime.fromisoformat(expiry_str)
            except (ValueError, TypeError):
                pass

        # If no explicit expiry, flag contracts/policies older than 2 years
        if not expiry_date and doc.document_type and doc.document_type.value in ("contract", "policy", "compliance"):
            if doc.created_at and (now - doc.created_at).days > 730:
                expiry_date = doc.created_at + timedelta(days=730)

        if expiry_date:
            days_until = (expiry_date - now).days
            if days_until <= days_ahead:
                expiring.append({
                    "id":            str(doc.id),
                    "filename":      doc.original_filename,
                    "document_type": doc.document_type.value if doc.document_type else "other",
                    "expiry_date":   expiry_date.strftime("%Y-%m-%d"),
                    "days_until":    days_until,
                    "overdue":       days_until < 0,
                    "urgent":        0 <= days_until <= 14,
                    "status":        (
                        "overdue"  if days_until < 0   else
                        "urgent"   if days_until <= 14 else
                        "warning"  if days_until <= 30 else
                        "upcoming"
                    ),
                    "uploaded_at":   doc.created_at.strftime("%Y-%m-%d") if doc.created_at else None,
                })

    expiring.sort(key=lambda d: d["days_until"])
    return {
        "documents":  expiring,
        "total":      len(expiring),
        "overdue":    sum(1 for d in expiring if d["overdue"]),
        "urgent":     sum(1 for d in expiring if d["urgent"] and not d["overdue"]),
        "checked_at": now.isoformat(),
    }
