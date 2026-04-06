"""
Company management endpoints.

POST   /companies/me/invite        — invite user by email (Admin+)
GET    /companies/invite/{token}   — validate invite token (public)
GET    /companies/me               — get current user's company
PUT    /companies/me               — update company profile (Admin+)
GET    /companies/me/users         — list company users (Manager+)
PATCH  /companies/me/users/{id}/role — update a user's role (Admin+)
DELETE /companies/me/users/{id}    — remove user from company (Admin+)
GET    /companies/                 — list all companies (Super Admin)
POST   /companies/                 — create company (Super Admin)
DELETE /companies/{id}             — delete company (Super Admin)
"""

from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_active_user, require_role
from app.core.database import get_db
from app.models.company import Company
from app.models.user import User, UserRole

router = APIRouter()


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class CompanyUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Company display name")
    industry: Optional[str] = Field(None, description="Industry sector")
    country: Optional[str] = Field(None, description="ISO country code or full name")
    language: Optional[str] = Field(None, description="Preferred language code (e.g. 'en')")
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


class CompanyCreate(BaseModel):
    name: str = Field(..., description="Company name — must be unique")
    country: str = Field(..., description="ISO country code or full name")
    industry: Optional[str] = None
    language: str = Field("en", description="Preferred language code")
    tax_id: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


class RoleUpdate(BaseModel):
    role: UserRole = Field(..., description="New role to assign")


class InviteRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address of the person to invite")
    role: str = Field("employee", description="Role to assign: employee | manager | admin")


# ---------------------------------------------------------------------------
# Invite flow
# ---------------------------------------------------------------------------

@router.post(
    "/me/invite",
    summary="Invite a user to your company",
    description=(
        "Send an email invitation to join your company. Generates a 7-day Redis-backed token "
        "and emails a registration link to the recipient. The link pre-fills their email and "
        "assigns the specified role on registration.\n\n"
        "**Requires:** `admin` role or higher.\n\n"
        "**Dev mode:** returns `invite_token` directly in the response for testing."
    ),
    tags=["Companies"],
)
async def invite_user(
    payload: InviteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    import secrets
    from app.core.config import settings
    from app.core.redis import get_redis

    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="No company associated with your account")

    existing = await db.execute(select(User).where(User.email == payload.email))
    existing_user = existing.scalar_one_or_none()
    if existing_user and existing_user.company_id == current_user.company_id:
        raise HTTPException(status_code=400, detail="User is already a member of this company")

    invite_token = secrets.token_urlsafe(32)
    redis = await get_redis()
    if redis:
        import json
        await redis.setex(
            f"invite:{invite_token}",
            7 * 24 * 3600,
            json.dumps({
                "email": payload.email,
                "company_id": str(current_user.company_id),
                "role": payload.role,
                "invited_by": str(current_user.id),
            }),
        )

    try:
        from app.services.email_service import send_email
        co_result = await db.execute(select(Company).where(Company.id == current_user.company_id))
        company = co_result.scalar_one_or_none()
        company_name = company.name if company else "your company"
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
        invite_url = f"{frontend_url}/register?invite={invite_token}"
        await send_email(
            to=payload.email,
            subject=f"You've been invited to join {company_name} on AdvisorAI",
            body_text=(
                f"Hi,\n\n"
                f"{current_user.full_name} has invited you to join {company_name} on AdvisorAI.\n\n"
                f"Click the link below to accept and set your password (valid for 7 days):\n"
                f"{invite_url}\n\n"
                f"If you didn't expect this, ignore this email.\n\nAdvisorAI Team"
            ),
            body_html=(
                f"<h2>You're invited to {company_name}</h2>"
                f"<p><strong>{current_user.full_name}</strong> has invited you to join "
                f"<strong>{company_name}</strong> on AdvisorAI.</p>"
                f"<p><a href='{invite_url}' style='background:#7c3aed;color:#fff;padding:10px 20px;"
                f"text-decoration:none;border-radius:6px;display:inline-block;'>Accept Invitation</a></p>"
                f"<p style='color:#888;font-size:12px;'>Link expires in 7 days.</p>"
            ),
        )
    except Exception:
        pass  # non-fatal — token still valid even if email fails

    return {
        "status": "invited",
        "email": payload.email,
        "role": payload.role,
        **(
            {"invite_token": invite_token, "note": "dev-only — remove in production"}
            if getattr(settings, "ENVIRONMENT", "development") == "development"
            else {}
        ),
    }


@router.get(
    "/invite/{token}",
    summary="Validate an invite token",
    description=(
        "Public endpoint — no authentication required.\n\n"
        "Validates a company invite token and returns the pre-filled email, company name, "
        "and role. Use this on the registration page when `?invite=<token>` is present in the URL.\n\n"
        "Returns `404` if the token is invalid or expired (7-day TTL)."
    ),
    tags=["Companies"],
)
async def get_invite_info(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    from app.core.redis import get_redis
    import json

    redis = await get_redis()
    if not redis:
        raise HTTPException(status_code=503, detail="Service unavailable — Redis not connected")

    raw = await redis.get(f"invite:{token}")
    if not raw:
        raise HTTPException(status_code=404, detail="Invite link is invalid or has expired")

    data = json.loads(raw)
    result = await db.execute(select(Company).where(Company.id == data["company_id"]))
    company = result.scalar_one_or_none()

    return {
        "email": data["email"],
        "company_name": company.name if company else "Unknown",
        "role": data["role"],
        "valid": True,
    }


# ---------------------------------------------------------------------------
# Current company
# ---------------------------------------------------------------------------

@router.get(
    "/me",
    summary="Get current user's company",
    description="Returns the company profile for the authenticated user. Individual users (no company) receive a placeholder response.",
    tags=["Companies"],
)
async def get_my_company(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not current_user.company_id:
        return {"id": None, "name": "System Administrator", "country": "", "industry": "", "is_active": True}
    result = await db.execute(select(Company).where(Company.id == current_user.company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return _serialize_company(company)


@router.put(
    "/me",
    summary="Update company profile",
    description="Update name, industry, country, language, address, phone, or email for the current user's company. Requires `admin` role or higher.",
    tags=["Companies"],
)
async def update_my_company(
    payload: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(select(Company).where(Company.id == current_user.company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(company, field, value)

    await db.commit()
    await db.refresh(company)
    return _serialize_company(company)


# ---------------------------------------------------------------------------
# Company users
# ---------------------------------------------------------------------------

@router.get(
    "/me/users",
    summary="List company users",
    description="Returns all users belonging to the current user's company. Requires `manager` role or higher.",
    tags=["Companies"],
)
async def list_company_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.MANAGER)),
    limit: int = Query(100, ge=1, le=500, description="Max results to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
):
    result = await db.execute(
        select(User)
        .where(User.company_id == current_user.company_id)
        .order_by(User.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    users = result.scalars().all()
    count = await db.execute(
        select(func.count(User.id)).where(User.company_id == current_user.company_id)
    )
    return {
        "items": [_serialize_user(u) for u in users],
        "total": count.scalar() or 0,
    }


@router.patch(
    "/me/users/{user_id}/role",
    summary="Update a company user's role",
    description=(
        "Change the role of a user within your company.\n\n"
        "- Cannot change your own role\n"
        "- Only `super_admin` can assign the `super_admin` role\n"
        "- Requires `admin` role or higher"
    ),
    tags=["Companies"],
)
async def update_user_role(
    user_id: str,
    payload: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.company_id == current_user.company_id,
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if str(user.id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    if payload.role == UserRole.SUPER_ADMIN and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can assign Super Admin role")

    user.role = payload.role
    await db.commit()
    return {"status": "updated", "user_id": user_id, "new_role": payload.role}


@router.delete(
    "/me/users/{user_id}",
    summary="Remove a user from the company",
    description=(
        "Detaches the user from the company and deactivates their account. "
        "Cannot remove yourself. Requires `admin` role or higher."
    ),
    tags=["Companies"],
)
async def remove_user_from_company(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.company_id == current_user.company_id,
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if str(user.id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="Cannot remove yourself")

    user.company_id = None
    user.is_active = False
    await db.commit()
    return {"status": "removed", "user_id": user_id}


# ---------------------------------------------------------------------------
# Super Admin — all companies
# ---------------------------------------------------------------------------

@router.get(
    "/",
    summary="List all companies (Super Admin)",
    description="Returns all companies in the system with optional name search. Requires `super_admin` role.",
    tags=["Companies"],
)
async def list_all_companies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None, description="Filter by company name (case-insensitive)"),
):
    filters = []
    if search:
        filters.append(Company.name.ilike(f"%{search}%"))

    from sqlalchemy import and_
    query = select(Company)
    if filters:
        query = query.where(and_(*filters))

    result = await db.execute(query.order_by(Company.created_at.desc()).limit(limit).offset(offset))
    companies = result.scalars().all()

    count_q = select(func.count(Company.id))
    if filters:
        count_q = count_q.where(and_(*filters))
    count = await db.execute(count_q)

    return {
        "items": [_serialize_company(c) for c in companies],
        "total": count.scalar() or 0,
    }


@router.post(
    "/",
    status_code=201,
    summary="Create a company (Super Admin)",
    description="Create a new company record. Requires `super_admin` role.",
    tags=["Companies"],
)
async def create_company(
    payload: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
):
    company = Company(**payload.model_dump())
    db.add(company)
    await db.commit()
    await db.refresh(company)
    return _serialize_company(company)


@router.delete(
    "/{company_id}",
    summary="Delete a company (Super Admin)",
    description="Permanently deletes a company and all associated data. Requires `super_admin` role.",
    tags=["Companies"],
)
async def delete_company(
    company_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    await db.delete(company)
    await db.commit()
    return {"status": "deleted", "company_id": company_id}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _serialize_company(c: Company) -> dict:
    return {
        "id": str(c.id),
        "name": c.name,
        "industry": c.industry,
        "country": c.country,
        "language": c.language,
        "tax_id": c.tax_id,
        "address": c.address,
        "phone": c.phone,
        "email": c.email,
        "is_active": c.is_active,
        "compliance_score": c.compliance_score,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


def _serialize_user(u: User) -> dict:
    return {
        "id": str(u.id),
        "email": u.email,
        "full_name": u.full_name,
        "role": u.role.value,
        "is_active": u.is_active,
        "is_verified": u.is_verified,
        "last_login": u.last_login.isoformat() if u.last_login else None,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }
