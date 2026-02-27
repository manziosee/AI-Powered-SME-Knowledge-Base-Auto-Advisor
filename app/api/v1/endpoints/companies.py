from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
import uuid
from app.core.database import get_db
from app.api.dependencies import get_current_active_user, require_role
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.document import Document
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse

router = APIRouter()


@router.post("/", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    company_data: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN]))
):
    company = Company(
        name=company_data.name,
        industry=company_data.industry,
        country=company_data.country,
        language=company_data.language,
        tax_id=company_data.tax_id,
        address=company_data.address,
        phone=company_data.phone,
        email=company_data.email
    )
    
    db.add(company)
    await db.commit()
    await db.refresh(company)
    return company


@router.get("/", response_model=List[CompanyResponse])
async def list_companies(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN]))
):
    result = await db.execute(
        select(Company).offset(skip).limit(limit).order_by(Company.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        if current_user.company_id != company_id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return company


@router.patch("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: uuid.UUID,
    update_data: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ADMIN]))
):
    if current_user.role == UserRole.ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(company, field, value)
    
    await db.commit()
    await db.refresh(company)
    return company


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(
    company_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN]))
):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    await db.delete(company)
    await db.commit()


@router.get("/{company_id}/stats")
async def get_company_stats(
    company_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        if current_user.company_id != company_id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Total users
    total_users = await db.execute(
        select(func.count(User.id)).where(User.company_id == company_id)
    )
    
    # Total documents
    total_docs = await db.execute(
        select(func.count(Document.id)).where(Document.company_id == company_id)
    )
    
    return {
        "company_id": str(company_id),
        "total_users": total_users.scalar() or 0,
        "total_documents": total_docs.scalar() or 0
    }
