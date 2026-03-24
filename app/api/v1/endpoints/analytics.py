"""
Analytics & Reporting endpoints.

GET  /analytics/overview          — dashboard KPI summary
GET  /analytics/compliance-score  — compliance gap analysis with AI recommendations
GET  /analytics/risk-distribution — knowledge entries by risk level
GET  /analytics/document-types    — breakdown by document type
POST /analytics/export            — generate PDF or Excel report (async, returns report ID)
GET  /analytics/reports/{id}      — poll report status + download URL
"""

import json
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, and_, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_active_user, require_role
from app.core.database import get_db
from app.models.compliance_rule import RuleCategory
from app.models.document import Document, DocumentStatus, DocumentType
from app.models.knowledge_entry import KnowledgeEntry, KnowledgeType, RiskLevel
from app.models.notification import Notification
from app.models.report import Report, ReportFormat, ReportStatus, ReportType
from app.models.user import User, UserRole
from app.services.compliance_service import compute_compliance_gaps, get_rules_for_company
from app.services.report_service import generate_excel_report, generate_pdf_report
import io

router = APIRouter()


# ---------------------------------------------------------------------------
# Overview
# ---------------------------------------------------------------------------

@router.get("/overview")
async def get_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company")

    cid = current_user.company_id

    # Document counts
    doc_counts = await db.execute(
        select(Document.status, func.count(Document.id))
        .where(Document.company_id == cid)
        .group_by(Document.status)
    )
    doc_stats = {str(s): c for s, c in doc_counts.all()}

    # Knowledge entry counts
    ke_counts = await db.execute(
        select(KnowledgeEntry.knowledge_type, func.count(KnowledgeEntry.id))
        .where(and_(KnowledgeEntry.company_id == cid, KnowledgeEntry.is_active.is_(True)))
        .group_by(KnowledgeEntry.knowledge_type)
    )
    ke_stats = {str(t): c for t, c in ke_counts.all()}

    # Unread notifications
    unread = await db.execute(
        select(func.count(Notification.id))
        .where(and_(Notification.user_id == current_user.id, Notification.is_read.is_(False)))
    )
    unread_count = unread.scalar() or 0

    # Upcoming deadlines within 30 days
    now = datetime.utcnow()
    upcoming = await db.execute(
        select(func.count(KnowledgeEntry.id))
        .where(
            and_(
                KnowledgeEntry.company_id == cid,
                KnowledgeEntry.is_active.is_(True),
                KnowledgeEntry.deadline.isnot(None),
                KnowledgeEntry.deadline >= now,
                KnowledgeEntry.deadline <= now + timedelta(days=30),
            )
        )
    )
    upcoming_deadlines = upcoming.scalar() or 0

    # Critical risks
    critical = await db.execute(
        select(func.count(KnowledgeEntry.id))
        .where(
            and_(
                KnowledgeEntry.company_id == cid,
                KnowledgeEntry.is_active.is_(True),
                KnowledgeEntry.risk_level == RiskLevel.CRITICAL,
            )
        )
    )
    critical_count = critical.scalar() or 0

    total_docs = sum(doc_stats.values())
    processed_docs = doc_stats.get("processed", 0)
    processing_rate = round((processed_docs / total_docs * 100) if total_docs else 0, 1)

    return {
        "documents": {
            "total": total_docs,
            "processed": processed_docs,
            "processing": doc_stats.get("processing", 0),
            "uploaded": doc_stats.get("uploaded", 0),
            "failed": doc_stats.get("failed", 0),
            "processing_rate_pct": processing_rate,
        },
        "knowledge_entries": {
            "total": sum(ke_stats.values()),
            "by_type": ke_stats,
        },
        "alerts": {
            "unread_notifications": unread_count,
            "upcoming_deadlines_30d": upcoming_deadlines,
            "critical_risks": critical_count,
        },
        "generated_at": datetime.utcnow().isoformat(),
    }


# ---------------------------------------------------------------------------
# Compliance score + gap analysis
# ---------------------------------------------------------------------------

@router.get("/compliance-score")
async def get_compliance_score(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    category: Optional[str] = Query(None, description="Filter by rule category"),
):
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company")

    # Load company
    from app.models.company import Company
    company_result = await db.execute(
        select(Company).where(Company.id == current_user.company_id)
    )
    company = company_result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Load all knowledge titles for matching
    ke_result = await db.execute(
        select(KnowledgeEntry.title, KnowledgeEntry.content)
        .where(and_(KnowledgeEntry.company_id == company.id, KnowledgeEntry.is_active.is_(True)))
    )
    knowledge_texts = [f"{r.title} {r.content}" for r in ke_result.all()]

    gap_report = await compute_compliance_gaps(
        db=db,
        company_id=str(company.id),
        country_code=company.country or "US",
        industry=company.industry,
        knowledge_titles=knowledge_texts,
    )

    # Update stored compliance score
    company.compliance_score = gap_report["coverage_percentage"]
    await db.commit()

    return {
        "compliance_score": gap_report["coverage_percentage"],
        "country": company.country,
        **gap_report,
    }


# ---------------------------------------------------------------------------
# Risk distribution
# ---------------------------------------------------------------------------

@router.get("/risk-distribution")
async def get_risk_distribution(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company")

    result = await db.execute(
        select(KnowledgeEntry.risk_level, func.count(KnowledgeEntry.id))
        .where(
            and_(
                KnowledgeEntry.company_id == current_user.company_id,
                KnowledgeEntry.is_active.is_(True),
                KnowledgeEntry.risk_level.isnot(None),
            )
        )
        .group_by(KnowledgeEntry.risk_level)
    )
    distribution = {str(level): count for level, count in result.all()}
    total = sum(distribution.values()) or 1

    return {
        "distribution": distribution,
        "percentages": {k: round(v / total * 100, 1) for k, v in distribution.items()},
        "total": total,
    }


# ---------------------------------------------------------------------------
# Document type breakdown
# ---------------------------------------------------------------------------

@router.get("/document-types")
async def get_document_type_breakdown(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company")

    result = await db.execute(
        select(Document.document_type, func.count(Document.id))
        .where(Document.company_id == current_user.company_id)
        .group_by(Document.document_type)
    )
    return {"breakdown": {str(dtype): count for dtype, count in result.all()}}


# ---------------------------------------------------------------------------
# Report export (PDF / Excel)
# ---------------------------------------------------------------------------

@router.post("/export")
async def export_report(
    report_type: ReportType,
    report_format: ReportFormat,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Synchronously generate and stream a PDF or Excel report."""
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company")

    from app.models.company import Company
    company_result = await db.execute(
        select(Company).where(Company.id == current_user.company_id)
    )
    company = company_result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Build report data
    report_data = await _build_report_data(db, current_user.company_id, report_type)

    try:
        if report_format == ReportFormat.PDF:
            content = generate_pdf_report(report_data, company.name, report_type.value)
            media_type = "application/pdf"
            filename = f"{report_type.value}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
        elif report_format == ReportFormat.EXCEL:
            content = generate_excel_report(report_data, company.name, report_type.value)
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            filename = f"{report_type.value}_{datetime.utcnow().strftime('%Y%m%d')}.xlsx"
        else:
            return report_data
    except ImportError as e:
        raise HTTPException(status_code=501, detail=str(e))

    return StreamingResponse(
        io.BytesIO(content),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

async def _build_report_data(db: AsyncSession, company_id, report_type: ReportType):
    """Gather data for report generation."""
    data = {}

    # Summary block
    doc_count = await db.execute(
        select(func.count(Document.id)).where(Document.company_id == company_id)
    )
    ke_count = await db.execute(
        select(func.count(KnowledgeEntry.id))
        .where(and_(KnowledgeEntry.company_id == company_id, KnowledgeEntry.is_active.is_(True)))
    )
    data["summary"] = {
        "total_documents": doc_count.scalar() or 0,
        "total_knowledge_entries": ke_count.scalar() or 0,
        "report_type": report_type.value,
        "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
    }

    if report_type in (ReportType.DOCUMENT_SUMMARY, ReportType.FULL_DASHBOARD):
        docs_result = await db.execute(
            select(
                Document.original_filename,
                Document.document_type,
                Document.status,
                Document.file_size,
                Document.created_at,
            )
            .where(Document.company_id == company_id)
            .order_by(Document.created_at.desc())
            .limit(500)
        )
        data["documents"] = [
            {
                "filename": r.original_filename,
                "type": str(r.document_type),
                "status": str(r.status),
                "size_kb": round((r.file_size or 0) / 1024, 1),
                "uploaded": r.created_at.strftime("%Y-%m-%d") if r.created_at else "",
            }
            for r in docs_result.all()
        ]

    if report_type in (ReportType.RISK_DISTRIBUTION, ReportType.FULL_DASHBOARD, ReportType.KNOWLEDGE_AUDIT):
        ke_result = await db.execute(
            select(
                KnowledgeEntry.title,
                KnowledgeEntry.knowledge_type,
                KnowledgeEntry.risk_level,
                KnowledgeEntry.deadline,
                KnowledgeEntry.created_at,
            )
            .where(and_(KnowledgeEntry.company_id == company_id, KnowledgeEntry.is_active.is_(True)))
            .order_by(KnowledgeEntry.risk_level.desc())
            .limit(1000)
        )
        data["knowledge_entries"] = [
            {
                "title": r.title,
                "type": str(r.knowledge_type),
                "risk_level": str(r.risk_level),
                "deadline": r.deadline.strftime("%Y-%m-%d") if r.deadline else "N/A",
                "created": r.created_at.strftime("%Y-%m-%d") if r.created_at else "",
            }
            for r in ke_result.all()
        ]

    return data
