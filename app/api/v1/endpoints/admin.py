"""
Admin / Super Admin endpoints.

GET  /admin/stats              — system-wide stats (Super Admin)
GET  /admin/users              — all users across companies (Super Admin)
PUT  /admin/users/{id}/status  — activate/deactivate user (Super Admin)
GET  /admin/audit-logs         — audit trail (Super Admin)
GET  /admin/compliance-rules   — list compliance rules (Admin+)
POST /admin/compliance-rules   — create rule (Super Admin)
PUT  /admin/compliance-rules/{id} — update rule (Super Admin)
DELETE /admin/compliance-rules/{id} — delete rule (Super Admin)
POST /admin/compliance-rules/seed — seed default country rules (Super Admin)
GET  /admin/ml/status          — ML model training status (Admin+)
POST /admin/ml/train-risk-scorer — trigger risk scorer retraining (Admin+)
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_active_user, require_role
from app.core.config import settings
from app.core.database import get_db
from app.models.audit_log import AuditLog
from app.models.company import Company
from app.models.compliance_rule import ComplianceRule, RuleCategory, RuleSeverity
from app.models.document import Document
from app.models.knowledge_entry import KnowledgeEntry, RiskLevel
from app.models.user import User, UserRole
from app.services.compliance_service import seed_default_rules
from app.services.ml_service import PredictiveRiskScorer

router = APIRouter()

# Module-level scorer (kept in memory; in production use Redis or model registry)
_risk_scorer = PredictiveRiskScorer()


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class ComplianceRuleCreate(BaseModel):
    country_code: str
    language_code: str = "en"
    category: str
    severity: str = "warning"
    title: str
    description: str
    legal_reference: Optional[str] = None
    deadline_pattern: Optional[str] = None
    affected_industries: list = []
    keywords: list = []
    action_required: Optional[str] = None
    penalty_description: Optional[str] = None


class ComplianceRuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    is_active: Optional[bool] = None
    keywords: Optional[list] = None
    action_required: Optional[str] = None
    penalty_description: Optional[str] = None


class UserStatusUpdate(BaseModel):
    is_active: bool


class MLTrainingRequest(BaseModel):
    # list of {"text": "...", "label": "low|medium|high|critical"}
    # Optional — when omitted we auto-build from existing knowledge entries for the company
    training_data: Optional[list] = None


# ---------------------------------------------------------------------------
# System stats
# ---------------------------------------------------------------------------

@router.get("/stats")
async def system_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
):
    companies = await db.execute(select(func.count(Company.id)))
    users = await db.execute(select(func.count(User.id)))
    docs = await db.execute(select(func.count(Document.id)))
    entries = await db.execute(select(func.count(KnowledgeEntry.id)))
    active_users = await db.execute(
        select(func.count(User.id)).where(User.is_active.is_(True))
    )

    return {
        "companies": companies.scalar() or 0,
        "users": {
            "total": users.scalar() or 0,
            "active": active_users.scalar() or 0,
        },
        "documents": docs.scalar() or 0,
        "knowledge_entries": entries.scalar() or 0,
        "ml": {
            "risk_scorer_trained": _risk_scorer.is_trained,
            "trained_at": _risk_scorer.trained_at.isoformat() if _risk_scorer.trained_at else None,
            "training_stats": _risk_scorer.training_stats,
        },
    }


# ---------------------------------------------------------------------------
# User management
# ---------------------------------------------------------------------------

@router.get("/users")
async def list_all_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    company_id: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
):
    filters = []
    if company_id:
        filters.append(User.company_id == company_id)
    if is_active is not None:
        filters.append(User.is_active.is_(is_active))

    q = select(User)
    if filters:
        q = q.where(and_(*filters))

    result = await db.execute(q.order_by(User.created_at.desc()).limit(limit).offset(offset))
    users = result.scalars().all()

    count_q = select(func.count(User.id))
    if filters:
        count_q = count_q.where(and_(*filters))
    count = await db.execute(count_q)

    return {
        "items": [_serialize_user(u) for u in users],
        "total": count.scalar() or 0,
    }


@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    payload: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = payload.is_active
    await db.commit()
    return {"status": "updated", "user_id": user_id, "is_active": payload.is_active}


# ---------------------------------------------------------------------------
# Audit logs
# ---------------------------------------------------------------------------

@router.get("/audit-logs")
async def get_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    user_id: Optional[str] = Query(None),
):
    filters = []
    if user_id:
        filters.append(AuditLog.user_id == user_id)

    q = select(AuditLog)
    if filters:
        q = q.where(and_(*filters))

    result = await db.execute(q.order_by(AuditLog.created_at.desc()).limit(limit).offset(offset))
    logs = result.scalars().all()

    return {
        "items": [
            {
                "id": str(log.id),
                "user_id": str(log.user_id),
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": str(log.resource_id) if log.resource_id else None,
                "details": log.details,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ],
        "total": len(logs),
    }


# ---------------------------------------------------------------------------
# Compliance rules management
# ---------------------------------------------------------------------------

@router.get("/compliance-rules")
async def list_compliance_rules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    country_code: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    filters = [ComplianceRule.is_active.is_(True)]
    if country_code:
        filters.append(ComplianceRule.country_code == country_code.upper())
    if category:
        cat_map = {e.value: e for e in RuleCategory}
        cat = cat_map.get(category.lower())
        if cat:
            filters.append(ComplianceRule.category == cat)

    result = await db.execute(
        select(ComplianceRule)
        .where(and_(*filters))
        .order_by(ComplianceRule.country_code, ComplianceRule.category)
        .limit(limit)
        .offset(offset)
    )
    rules = result.scalars().all()
    return {"items": [_serialize_rule(r) for r in rules], "total": len(rules)}


@router.post("/compliance-rules", status_code=201)
async def create_compliance_rule(
    payload: ComplianceRuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
):
    cat_map = {e.value: e for e in RuleCategory}
    sev_map = {e.value: e for e in RuleSeverity}

    rule = ComplianceRule(
        country_code=payload.country_code.upper(),
        language_code=payload.language_code,
        category=cat_map.get(payload.category.lower(), RuleCategory.OTHER),
        severity=sev_map.get(payload.severity.lower(), RuleSeverity.WARNING),
        title=payload.title,
        description=payload.description,
        legal_reference=payload.legal_reference,
        deadline_pattern=payload.deadline_pattern,
        affected_industries=payload.affected_industries,
        keywords=payload.keywords,
        action_required=payload.action_required,
        penalty_description=payload.penalty_description,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return _serialize_rule(rule)


@router.put("/compliance-rules/{rule_id}")
async def update_compliance_rule(
    rule_id: str,
    payload: ComplianceRuleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
):
    result = await db.execute(select(ComplianceRule).where(ComplianceRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    sev_map = {e.value: e for e in RuleSeverity}
    for field, value in payload.model_dump(exclude_none=True).items():
        if field == "severity":
            value = sev_map.get(value.lower(), RuleSeverity.WARNING)
        setattr(rule, field, value)

    await db.commit()
    await db.refresh(rule)
    return _serialize_rule(rule)


@router.delete("/compliance-rules/{rule_id}")
async def delete_compliance_rule(
    rule_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
):
    result = await db.execute(select(ComplianceRule).where(ComplianceRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    rule.is_active = False
    await db.commit()
    return {"status": "deactivated", "rule_id": rule_id}


@router.post("/compliance-rules/seed")
async def seed_compliance_rules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
):
    count = await seed_default_rules(db)
    return {"status": "ok", "rules_inserted": count}


# ---------------------------------------------------------------------------
# ML model management
# ---------------------------------------------------------------------------

@router.get("/ml/status")
async def ml_status(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return {
        "risk_scorer": {
            "is_trained": _risk_scorer.is_trained,
            "method": "logistic_regression",
            "trained_at": _risk_scorer.trained_at.isoformat() if _risk_scorer.trained_at else None,
            "stats": _risk_scorer.training_stats,
        }
    }


@router.post("/ml/train-risk-scorer")
async def train_risk_scorer(
    payload: MLTrainingRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """
    Train the predictive risk scorer with labelled data.
    If no payload.training_data is provided, build a dataset from existing
    KnowledgeEntry records with risk_level set for the current company.
    """
    training_data = payload.training_data or []

    # Auto-build training data from knowledge entries when none provided
    if not training_data:
        result = await db.execute(
            select(KnowledgeEntry.content, KnowledgeEntry.risk_level)
            .where(
                and_(
                    KnowledgeEntry.company_id == current_user.company_id,
                    KnowledgeEntry.risk_level.is_not(None),
                )
            )
            .limit(2000)
        )
        rows = result.fetchall()
        training_data = [
            {"text": r.content, "label": r.risk_level.value if hasattr(r.risk_level, "value") else r.risk_level}
            for r in rows if r.content
        ]

    if len(training_data) < 4:
        raise HTTPException(
            status_code=400,
            detail="Need at least 4 labelled samples to train. Provide training_data or add risk-labelled knowledge entries.",
        )

    try:
        stats = _risk_scorer.train(
            texts=[d["text"] for d in training_data],
            labels=[d["label"] for d in training_data],
        )
        return {"status": "trained", "stats": stats}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Training failed: {exc}")


@router.post("/ml/predict-risk")
async def predict_risk(
    text: str,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    result = _risk_scorer.score_with_explanation(text)
    return result


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _serialize_user(u: User) -> dict:
    return {
        "id": str(u.id),
        "email": u.email,
        "full_name": u.full_name,
        "role": u.role.value,
        "company_id": str(u.company_id) if u.company_id else None,
        "is_active": u.is_active,
        "is_verified": u.is_verified,
        "created_at": u.created_at.isoformat() if u.created_at else None,
        "last_login": u.last_login.isoformat() if u.last_login else None,
    }


def _serialize_rule(r: ComplianceRule) -> dict:
    return {
        "id": str(r.id),
        "country_code": r.country_code,
        "language_code": r.language_code,
        "category": r.category.value,
        "severity": r.severity.value,
        "title": r.title,
        "description": r.description,
        "legal_reference": r.legal_reference,
        "deadline_pattern": r.deadline_pattern,
        "affected_industries": r.affected_industries,
        "keywords": r.keywords,
        "action_required": r.action_required,
        "penalty_description": r.penalty_description,
        "is_active": r.is_active,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


# ---------------------------------------------------------------------------
# LLM configuration status
# ---------------------------------------------------------------------------

@router.get("/llm/status")
async def llm_status(
    current_user: User = Depends(require_role(UserRole.MANAGER)),
):
    """
    Quick status endpoint to let the UI show which LLM backend is active
    and whether credentials are missing.
    """
    groq_key = bool(settings.GROQ_API_KEY)
    openai_key = bool(settings.OPENAI_API_KEY)

    primary = None
    if groq_key:
        primary = "groq"
    elif openai_key:
        primary = "openai"

    return {
        "configured": primary is not None,
        "primary": primary,
        "groq": {
            "has_key": groq_key,
            "model": settings.GROQ_MODEL,
        },
        "openai": {
            "has_key": openai_key,
            "model": settings.OPENAI_MODEL,
        },
    }
