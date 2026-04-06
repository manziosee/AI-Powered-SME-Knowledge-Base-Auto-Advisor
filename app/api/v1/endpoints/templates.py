"""
Document Templates endpoints.

GET    /templates/              — list templates (filterable by category/country/industry)
GET    /templates/{id}          — get template detail
POST   /templates/              — create a company-specific or platform template (admin)
PUT    /templates/{id}          — update template (admin or creator)
DELETE /templates/{id}          — delete template (admin or creator)
POST   /templates/{id}/use      — generate a new document from a template (AI fills placeholders)
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_active_user
from app.core.database import get_db
from app.models.template import Template, TemplateCategory
from app.models.user import User, UserRole

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: TemplateCategory = TemplateCategory.OTHER
    country_code: Optional[str] = None
    industry: Optional[str] = None
    content: str
    fields: List[dict] = []
    tags: List[str] = []
    is_public: bool = True


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    fields: Optional[List[dict]] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None
    is_active: Optional[bool] = None


class TemplateUseRequest(BaseModel):
    field_values: dict = {}    # {"party_name": "ACME Ltd", "date": "2026-04-05"}


def _serialize(t: Template) -> dict:
    return {
        "id": str(t.id),
        "name": t.name,
        "description": t.description,
        "category": str(t.category),
        "country_code": t.country_code,
        "industry": t.industry,
        "content": t.content,
        "fields": t.fields or [],
        "tags": t.tags or [],
        "is_public": t.is_public,
        "usage_count": t.usage_count,
        "created_at": t.created_at,
        "updated_at": t.updated_at,
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/",
    summary="List document templates",
    description=(
        "Returns templates available to the current user — platform-wide public templates "
        "plus company-specific ones. Filter by category, country, or industry."
    ),
)
async def list_templates(
    category: Optional[str] = Query(None),
    country_code: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    filters = [
        Template.is_active == True,  # noqa: E712
        or_(
            Template.is_public == True,  # noqa: E712
            Template.company_id == current_user.company_id,
        ),
    ]
    if category:
        filters.append(Template.category == category)
    if country_code:
        filters.append(or_(Template.country_code == country_code, Template.country_code == None))  # noqa: E711
    if industry:
        filters.append(or_(Template.industry == industry, Template.industry == None))  # noqa: E711
    if search:
        filters.append(Template.name.ilike(f"%{search}%"))

    result = await db.execute(
        select(Template).where(and_(*filters)).order_by(Template.usage_count.desc())
    )
    return [_serialize(t) for t in result.scalars().all()]


@router.get("/{template_id}", summary="Get template detail")
async def get_template(
    template_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    t = await _get_accessible(template_id, current_user, db)
    return _serialize(t)


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Create a document template",
    description="Creates a new template. Admins can create public platform templates; others create private company templates.",
)
async def create_template(
    payload: TemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    is_platform_admin = current_user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN)
    t = Template(
        name=payload.name,
        description=payload.description,
        category=payload.category,
        country_code=payload.country_code,
        industry=payload.industry,
        content=payload.content,
        fields=payload.fields,
        tags=payload.tags,
        is_public=payload.is_public if is_platform_admin else False,
        company_id=None if (is_platform_admin and payload.is_public) else current_user.company_id,
        created_by=current_user.id,
    )
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return _serialize(t)


@router.put("/{template_id}", summary="Update a template")
async def update_template(
    template_id: str,
    payload: TemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    t = await _get_editable(template_id, current_user, db)
    if payload.name is not None:
        t.name = payload.name
    if payload.description is not None:
        t.description = payload.description
    if payload.content is not None:
        t.content = payload.content
    if payload.fields is not None:
        t.fields = payload.fields
    if payload.tags is not None:
        t.tags = payload.tags
    if payload.is_public is not None:
        t.is_public = payload.is_public
    if payload.is_active is not None:
        t.is_active = payload.is_active
    t.updated_at = datetime.utcnow()
    await db.commit()
    return _serialize(t)


@router.delete("/{template_id}", summary="Delete a template")
async def delete_template(
    template_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    t = await _get_editable(template_id, current_user, db)
    t.is_active = False
    await db.commit()
    return {"status": "deleted"}


@router.post(
    "/{template_id}/use",
    summary="Generate document from template",
    description=(
        "Fills template placeholders with provided field values and returns the rendered document "
        "content. AI can optionally fill missing fields based on company context."
    ),
)
async def use_template(
    template_id: str,
    payload: TemplateUseRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    t = await _get_accessible(template_id, current_user, db)

    # Simple placeholder substitution: {{field_key}} → value
    rendered = t.content
    for key, value in payload.field_values.items():
        rendered = rendered.replace(f"{{{{{key}}}}}", str(value))

    # Increment usage count
    t.usage_count = (t.usage_count or 0) + 1
    await db.commit()

    return {
        "template_id": template_id,
        "template_name": t.name,
        "rendered_content": rendered,
        "unfilled_fields": [
            f["key"] for f in (t.fields or [])
            if f.get("key") and f["key"] not in payload.field_values
        ],
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_accessible(template_id: str, user: User, db: AsyncSession) -> Template:
    result = await db.execute(
        select(Template).where(
            Template.id == template_id,
            Template.is_active == True,  # noqa: E712
            or_(Template.is_public == True, Template.company_id == user.company_id),  # noqa: E712
        )
    )
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    return t


async def _get_editable(template_id: str, user: User, db: AsyncSession) -> Template:
    result = await db.execute(select(Template).where(Template.id == template_id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    is_creator = str(t.created_by) == str(user.id)
    is_admin = user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN)
    if not (is_creator or is_admin):
        raise HTTPException(status_code=403, detail="Not allowed to edit this template")
    return t
