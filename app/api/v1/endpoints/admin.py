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

@router.get(
    "/stats",
    summary="System-wide statistics",
    description="Returns total counts for companies, users (total + active), documents, and knowledge entries. Also includes ML model training status. Requires `admin` role.",
)
async def system_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    n_companies   = (await db.execute(select(func.count(Company.id)))).scalar() or 0
    n_users       = (await db.execute(select(func.count(User.id)))).scalar() or 0
    n_active      = (await db.execute(select(func.count(User.id)).where(User.is_active.is_(True)))).scalar() or 0
    n_docs        = (await db.execute(select(func.count(Document.id)))).scalar() or 0
    n_entries     = (await db.execute(select(func.count(KnowledgeEntry.id)))).scalar() or 0

    return {
        "companies": n_companies,
        "users": {"total": n_users, "active": n_active},
        "documents": n_docs,
        "knowledge_entries": n_entries,
        # legacy flat keys
        "total_users": n_users,
        "total_documents": n_docs,
        "total_companies": n_companies,
        "ai_queries_total": 0,
        "ml": {
            "risk_scorer_trained": _risk_scorer.is_trained,
            "trained_at": _risk_scorer.trained_at.isoformat() if _risk_scorer.trained_at else None,
            "training_stats": _risk_scorer.training_stats,
        },
    }


# ---------------------------------------------------------------------------
# User management
# ---------------------------------------------------------------------------

@router.get(
    "/users",
    summary="List all users (Super Admin)",
    description="Returns all users across all companies with optional filters for `company_id` and `is_active`. Includes `permissions` and `account_type` fields.",
)
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


@router.put(
    "/users/{user_id}/status",
    summary="Activate or deactivate a user",
    description="Toggle a user's `is_active` flag. Deactivated users cannot log in. Requires `super_admin`.",
)
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

@router.get(
    "/audit-logs",
    summary="Get audit logs",
    description=(
        "Returns the audit trail for all mutations in the system. Filterable by `user_id`.\n\n"
        "Each entry includes: `action`, `resource_type`, `resource_id`, `details` (JSON), `ip_address`, `created_at`.\n\n"
        "Permission changes are logged with `action=update_permissions` and include `added`/`removed` permission lists."
    ),
)
async def get_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    user_id: Optional[str] = Query(None),
):
    try:
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
                    "user_id": str(log.user_id) if log.user_id else None,
                    "action": log.action,
                    "resource_type": log.resource_type,
                    "resource_id": str(log.resource_id) if log.resource_id else None,
                    "details": log.details if isinstance(log.details, str) else str(log.details or ""),
                    "ip_address": log.ip_address,
                    "created_at": log.created_at.isoformat() if log.created_at else None,
                }
                for log in logs
            ],
            "total": len(logs),
        }
    except Exception:
        # Table may not exist yet — return empty gracefully
        return {"items": [], "total": 0}


# ---------------------------------------------------------------------------
# Compliance rules management
# ---------------------------------------------------------------------------

@router.get(
    "/compliance-rules",
    summary="List compliance rules",
    description="Returns active compliance rules filterable by `country_code` and `category`. Requires `admin` role.",
)
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


@router.post(
    "/compliance-rules",
    status_code=201,
    summary="Create a compliance rule",
    description="Add a new compliance rule for a country. Requires `super_admin`.",
)
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


@router.put(
    "/compliance-rules/{rule_id}",
    summary="Update a compliance rule",
    description="Update title, description, severity, keywords, or action_required for a rule. Requires `super_admin`.",
)
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


@router.delete(
    "/compliance-rules/{rule_id}",
    summary="Deactivate a compliance rule",
    description="Soft-deletes a compliance rule by setting `is_active=False`. Requires `super_admin`.",
)
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


@router.post(
    "/compliance-rules/seed",
    summary="Seed default compliance rules",
    description="Seeds the database with built-in country-specific compliance rules (RW, KE, NG, ZA, FR, US, EU/GDPR). Idempotent — safe to run multiple times. Requires `super_admin`.",
)
async def seed_compliance_rules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
):
    count = await seed_default_rules(db)
    return {"status": "ok", "rules_inserted": count}


# ---------------------------------------------------------------------------
# ML model management
# ---------------------------------------------------------------------------

@router.get(
    "/ml/status",
    summary="ML model training status",
    description="Returns training status and stats for the risk scorer model. Accessible to `admin`/`super_admin` roles or users with `can_view_ai_training` permission.",
)
async def ml_status(
    current_user: User = Depends(get_current_active_user),
):
    role_val = current_user.role.value if hasattr(current_user.role, "value") else current_user.role
    if role_val not in ("admin", "super_admin") and not current_user.has_permission("can_view_ai_training"):
        raise HTTPException(status_code=403, detail="Access denied. Requires admin role or 'can_view_ai_training' permission.")
    return {
        "risk_scorer": {
            "is_trained": _risk_scorer.is_trained,
            "method": "logistic_regression",
            "trained_at": _risk_scorer.trained_at.isoformat() if _risk_scorer.trained_at else None,
            "stats": _risk_scorer.training_stats,
        }
    }


@router.post(
    "/ml/train-risk-scorer",
    summary="Train the risk scorer model",
    description=(
        "Trigger retraining of the TF-IDF + Logistic Regression risk scorer.\n\n"
        "- Provide `training_data` as `[{\"text\": \"...\", \"label\": \"low|medium|high|critical\"}]`\n"
        "- If omitted, auto-builds from labelled knowledge entries in your company's knowledge base\n"
        "- Minimum 4 labelled samples required\n\n"
        "Accessible to `admin`/`super_admin` roles or users with `can_train_model` permission."
    ),
)
async def train_risk_scorer(
    payload: MLTrainingRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Train the predictive risk scorer.
    Requires either admin role OR can_train_model permission.
    """
    from app.models.user import _ROLE_HIERARCHY_VALUES
    role_val = current_user.role.value if hasattr(current_user.role, "value") else current_user.role
    is_admin = role_val in ("admin", "super_admin")
    has_perm = current_user.has_permission("can_train_model")
    if not is_admin and not has_perm:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Requires admin role or 'can_train_model' permission.",
        )
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


class PredictRiskRequest(BaseModel):
    text: str


@router.post(
    "/ml/predict-risk",
    summary="Predict risk level for text",
    description="Run the trained risk scorer on a text snippet. Returns `risk_level` (low/medium/high/critical) and `confidence`. Requires `admin` role or `can_view_ai_training` permission.",
)
async def predict_risk(
    payload: PredictRiskRequest,
    current_user: User = Depends(get_current_active_user),
):
    role_val = current_user.role.value if hasattr(current_user.role, "value") else current_user.role
    if role_val not in ("admin", "super_admin") and not current_user.has_permission("can_view_ai_training"):
        raise HTTPException(status_code=403, detail="Access denied.")
    result = _risk_scorer.score_with_explanation(payload.text)
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
        "account_type": u.account_type.value if hasattr(u.account_type, "value") else (u.account_type or "company"),
        "permissions": u.permissions or [],
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
# Company management
# ---------------------------------------------------------------------------

@router.get(
    "/companies",
    summary="List all companies with stats (Super Admin)",
    description="Returns all companies with user count and document count. Requires `super_admin`.",
)
async def list_all_companies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    result = await db.execute(
        select(Company).order_by(Company.created_at.desc()).limit(limit).offset(offset)
    )
    companies = result.scalars().all()

    items = []
    for company in companies:
        user_count_q = select(func.count(User.id)).where(User.company_id == company.id)
        user_count = (await db.execute(user_count_q)).scalar() or 0

        doc_count_q = select(func.count(Document.id)).where(Document.company_id == company.id)
        doc_count = (await db.execute(doc_count_q)).scalar() or 0

        items.append({
            "id": str(company.id),
            "name": company.name,
            "country": company.country,
            "industry": company.industry if hasattr(company, "industry") else None,
            "is_active": company.is_active,
            "created_at": company.created_at.isoformat() if company.created_at else None,
            "user_count": user_count,
            "document_count": doc_count,
        })

    total_q = await db.execute(select(func.count(Company.id)))
    total = total_q.scalar() or 0

    return {"items": items, "total": total}


# ---------------------------------------------------------------------------
# Extended user management
# ---------------------------------------------------------------------------

class UserRoleUpdate(BaseModel):
    role: str


class UserPermissionsUpdate(BaseModel):
    permissions: list[str]


class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str
    role: str
    company_id: Optional[str] = None


@router.get(
    "/users/{user_id}/permissions",
    summary="Get a user's permissions",
    description="Returns the user's current permission list and the full list of all available permissions. Requires `admin` role.",
)
async def get_user_permissions(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    from app.models.user import ALL_PERMISSIONS
    return {
        "user_id": str(user.id),
        "permissions": user.permissions or [],
        "all_permissions": ALL_PERMISSIONS,
    }


@router.put(
    "/users/{user_id}/permissions",
    summary="Update a user's permissions",
    description=(
        "Replace a user's permission set. Only valid permission keys are accepted — invalid ones are silently dropped.\n\n"
        "**Available permissions:** `can_view_ai_training`, `can_train_model`, `can_view_documents`, "
        "`can_upload_documents`, `can_receive_alerts`, `can_manage_users`, `can_view_analytics`, "
        "`can_view_compliance`, `can_manage_company`\n\n"
        "Every change is written to the audit log with old/new/added/removed permission lists."
    ),
)
async def update_user_permissions(
    user_id: str,
    payload: UserPermissionsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    from app.models.user import ALL_PERMISSIONS
    from app.models.audit_log import AuditLog
    valid = [p for p in payload.permissions if p in ALL_PERMISSIONS]
    old_perms = list(user.permissions or [])
    user.permissions = valid
    await db.commit()
    await db.refresh(user)
    # Audit log
    try:
        log = AuditLog(
            user_id=current_user.id,
            action="update_permissions",
            resource_type="user",
            resource_id=str(user.id),
            details={
                "target_user_email": user.email,
                "old_permissions": old_perms,
                "new_permissions": valid,
                "added": [p for p in valid if p not in old_perms],
                "removed": [p for p in old_perms if p not in valid],
            },
        )
        db.add(log)
        await db.commit()
    except Exception:
        pass
    return {"user_id": str(user.id), "permissions": user.permissions}


@router.put(
    "/users/{user_id}/role",
    summary="Update a user's role",
    description="Change a user's role. Valid values: `employee`, `manager`, `admin`, `super_admin`, `individual`. Requires `super_admin`.",
)
async def update_user_role(
    user_id: str,
    payload: UserRoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    role_map = {e.value: e for e in UserRole}
    new_role = role_map.get(payload.role.lower())
    if not new_role:
        raise HTTPException(status_code=400, detail=f"Invalid role: {payload.role}")

    user.role = new_role
    await db.commit()
    await db.refresh(user)
    return _serialize_user(user)


@router.post(
    "/users",
    status_code=201,
    summary="Create a user (Super Admin)",
    description="Create a new user and optionally assign them to a company. The password is set directly — use the invite flow for email-based onboarding.",
)
async def create_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
):
    from app.core.security import get_password_hash

    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already exists")

    role_map = {e.value: e for e in UserRole}
    role = role_map.get(payload.role.lower(), UserRole.EMPLOYEE)

    new_user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=role,
        company_id=payload.company_id,
        is_active=True,
        is_verified=True,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return _serialize_user(new_user)


@router.delete(
    "/users/{user_id}",
    summary="Delete a user (Super Admin)",
    description="Permanently deletes a user. Cannot delete yourself. Requires `super_admin`.",
)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
):
    if str(current_user.id) == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(user)
    await db.commit()
    return {"status": "deleted", "user_id": user_id}


# ---------------------------------------------------------------------------
# Health alerts
# ---------------------------------------------------------------------------

@router.get(
    "/health-alerts",
    summary="System health alerts",
    description="Returns alerts for companies with no documents, low compliance scores (<50%), or no active users. Requires `admin` role.",
)
async def health_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(select(Company).where(Company.is_active.is_(True)))
    companies = result.scalars().all()

    alerts = []
    for company in companies:
        doc_count_q = select(func.count(Document.id)).where(Document.company_id == company.id)
        doc_count = (await db.execute(doc_count_q)).scalar() or 0

        user_count_q = select(func.count(User.id)).where(
            and_(User.company_id == company.id, User.is_active.is_(True))
        )
        active_user_count = (await db.execute(user_count_q)).scalar() or 0

        compliance_score = getattr(company, "compliance_score", None) or 0.0

        if doc_count == 0:
            alerts.append({
                "company_id": str(company.id),
                "company_name": company.name,
                "alert_type": "no_documents",
                "severity": "critical",
                "detail": "Company has no documents uploaded",
            })

        if compliance_score < 50:
            alerts.append({
                "company_id": str(company.id),
                "company_name": company.name,
                "alert_type": "low_compliance_score",
                "severity": "critical" if compliance_score < 25 else "warning",
                "detail": f"Compliance score is {compliance_score:.1f}% (below 50%)",
            })

        if active_user_count == 0:
            alerts.append({
                "company_id": str(company.id),
                "company_name": company.name,
                "alert_type": "no_active_users",
                "severity": "warning",
                "detail": "Company has no active users",
            })

    return {"alerts": alerts}


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
