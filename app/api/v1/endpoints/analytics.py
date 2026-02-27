from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta
from typing import Dict, Any
from app.core.database import get_db
from app.api.dependencies import get_current_active_user
from app.models.user import User
from app.models.document import Document, DocumentStatus, DocumentType
from app.models.knowledge_entry import KnowledgeEntry, KnowledgeType, RiskLevel
from app.models.notification import Notification

router = APIRouter()


@router.get("/overview")
async def get_analytics_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    company_id = current_user.company_id
    
    # Total documents
    total_docs = await db.execute(
        select(func.count(Document.id)).where(Document.company_id == company_id)
    )
    
    # Processed documents
    processed_docs = await db.execute(
        select(func.count(Document.id)).where(
            and_(Document.company_id == company_id, Document.status == DocumentStatus.PROCESSED)
        )
    )
    
    # Total knowledge entries
    total_knowledge = await db.execute(
        select(func.count(KnowledgeEntry.id)).where(KnowledgeEntry.company_id == company_id)
    )
    
    # Unread notifications
    unread_notifications = await db.execute(
        select(func.count(Notification.id)).where(
            and_(Notification.user_id == current_user.id, Notification.is_read == False)
        )
    )
    
    return {
        "total_documents": total_docs.scalar() or 0,
        "processed_documents": processed_docs.scalar() or 0,
        "total_knowledge_entries": total_knowledge.scalar() or 0,
        "unread_notifications": unread_notifications.scalar() or 0,
        "processing_rate": round((processed_docs.scalar() or 0) / max(total_docs.scalar() or 1, 1) * 100, 2)
    }


@router.get("/compliance-score")
async def get_compliance_score(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    company_id = current_user.company_id
    
    # Total obligations
    total_obligations = await db.execute(
        select(func.count(KnowledgeEntry.id)).where(
            and_(
                KnowledgeEntry.company_id == company_id,
                KnowledgeEntry.knowledge_type == KnowledgeType.OBLIGATION
            )
        )
    )
    
    # Upcoming deadlines (next 30 days)
    deadline_threshold = datetime.utcnow() + timedelta(days=30)
    upcoming_deadlines = await db.execute(
        select(func.count(KnowledgeEntry.id)).where(
            and_(
                KnowledgeEntry.company_id == company_id,
                KnowledgeEntry.knowledge_type == KnowledgeType.DEADLINE,
                KnowledgeEntry.deadline <= deadline_threshold,
                KnowledgeEntry.deadline >= datetime.utcnow()
            )
        )
    )
    
    # Overdue deadlines
    overdue_deadlines = await db.execute(
        select(func.count(KnowledgeEntry.id)).where(
            and_(
                KnowledgeEntry.company_id == company_id,
                KnowledgeEntry.knowledge_type == KnowledgeType.DEADLINE,
                KnowledgeEntry.deadline < datetime.utcnow()
            )
        )
    )
    
    total = total_obligations.scalar() or 0
    overdue = overdue_deadlines.scalar() or 0
    compliance_score = max(0, 100 - (overdue * 10))
    
    return {
        "compliance_score": compliance_score,
        "total_obligations": total,
        "upcoming_deadlines": upcoming_deadlines.scalar() or 0,
        "overdue_deadlines": overdue,
        "status": "excellent" if compliance_score >= 90 else "good" if compliance_score >= 70 else "needs_attention"
    }


@router.get("/risk-summary")
async def get_risk_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    company_id = current_user.company_id
    
    # Risk counts by level
    critical_risks = await db.execute(
        select(func.count(KnowledgeEntry.id)).where(
            and_(
                KnowledgeEntry.company_id == company_id,
                KnowledgeEntry.knowledge_type == KnowledgeType.RISK,
                KnowledgeEntry.risk_level == RiskLevel.CRITICAL
            )
        )
    )
    
    high_risks = await db.execute(
        select(func.count(KnowledgeEntry.id)).where(
            and_(
                KnowledgeEntry.company_id == company_id,
                KnowledgeEntry.knowledge_type == KnowledgeType.RISK,
                KnowledgeEntry.risk_level == RiskLevel.HIGH
            )
        )
    )
    
    medium_risks = await db.execute(
        select(func.count(KnowledgeEntry.id)).where(
            and_(
                KnowledgeEntry.company_id == company_id,
                KnowledgeEntry.knowledge_type == KnowledgeType.RISK,
                KnowledgeEntry.risk_level == RiskLevel.MEDIUM
            )
        )
    )
    
    low_risks = await db.execute(
        select(func.count(KnowledgeEntry.id)).where(
            and_(
                KnowledgeEntry.company_id == company_id,
                KnowledgeEntry.knowledge_type == KnowledgeType.RISK,
                KnowledgeEntry.risk_level == RiskLevel.LOW
            )
        )
    )
    
    return {
        "critical": critical_risks.scalar() or 0,
        "high": high_risks.scalar() or 0,
        "medium": medium_risks.scalar() or 0,
        "low": low_risks.scalar() or 0,
        "total_risks": sum([
            critical_risks.scalar() or 0,
            high_risks.scalar() or 0,
            medium_risks.scalar() or 0,
            low_risks.scalar() or 0
        ])
    }


@router.get("/document-stats")
async def get_document_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    company_id = current_user.company_id
    
    # Documents by type
    doc_types = {}
    for doc_type in DocumentType:
        count = await db.execute(
            select(func.count(Document.id)).where(
                and_(Document.company_id == company_id, Document.document_type == doc_type)
            )
        )
        doc_types[doc_type.value] = count.scalar() or 0
    
    # Recent uploads (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_uploads = await db.execute(
        select(func.count(Document.id)).where(
            and_(Document.company_id == company_id, Document.created_at >= week_ago)
        )
    )
    
    return {
        "by_type": doc_types,
        "recent_uploads": recent_uploads.scalar() or 0,
        "total": sum(doc_types.values())
    }
