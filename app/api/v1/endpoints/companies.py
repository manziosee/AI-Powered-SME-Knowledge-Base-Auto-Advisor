"""
Company management endpoints.

GET    /companies/me              — get current user's company
PUT    /companies/me              — update company profile
GET    /companies/me/users        — list company users (Admin+)
POST   /companies/me/users/{id}/role — update a user's role (Admin+)
DELETE /companies/me/users/{id}   — remove user from company (Admin+)
GET    /companies/                — list all companies (Super Admin only)
POST   /companies/                — create company (Super Admin only)
DELETE /companies/{id}            — delete company (Super Admin only)
"""

from typing import Optional

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
# Pydantic schemas (inline to keep file self-contained)
# ---------------------------------------------------------------------------

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    language: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


class CompanyCreate(BaseModel):
    name: str
    country: str
    industry: Optional[str] = None
    language: str = "en"
    tax_id: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


class RoleUpdate(BaseModel):
    role: UserRole


# ---------------------------------------------------------------------------
# Current company
# ---------------------------------------------------------------------------

@router.get("/me")
async def get_my_company(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not current_user.company_id:
        # Super admin — no company affiliation
        return {"id": None, "name": "System Administrator", "country": "", "industry": "", "is_active": True}
    result = await db.execute(select(Company).where(Company.id == current_user.company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return _serialize_company(company)


@router.put("/me")
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

@router.get("/me/users")
async def list_company_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.MANAGER)),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
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


@router.patch("/me/users/{user_id}/role")
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

    # Prevent self-demotion
    if str(user.id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    # Only SUPER_ADMIN can assign SUPER_ADMIN role
    if payload.role == UserRole.SUPER_ADMIN and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can assign Super Admin role")

    user.role = payload.role
    await db.commit()
    return {"status": "updated", "user_id": user_id, "new_role": payload.role}


@router.delete("/me/users/{user_id}")
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

@router.get("/")
async def list_all_companies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None),
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


@router.post("/", status_code=201)
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


@router.delete("/{company_id}")
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
