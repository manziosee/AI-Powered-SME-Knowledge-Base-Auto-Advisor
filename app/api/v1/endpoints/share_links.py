"""
Document Share Links endpoints.

POST /share-links/                    — create a share link for a document
GET  /share-links/                    — list share links created by current user
GET  /share-links/{token}             — public: resolve share link (no auth needed)
DELETE /share-links/{link_id}         — revoke a share link
POST /share-links/{token}/view        — public: record a view (+ validate password)
"""

import hashlib
import secrets
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_active_user
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password
from app.models.document import Document
from app.models.share_link import ShareLink
from app.models.user import User

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ShareLinkCreate(BaseModel):
    document_id: str
    password: Optional[str] = None
    expires_hours: Optional[int] = None   # None = no expiry
    max_views: Optional[int] = None


class ShareLinkResponse(BaseModel):
    id: str
    token: str
    document_id: str
    expires_at: Optional[datetime]
    max_views: Optional[int]
    view_count: int
    is_active: bool
    created_at: datetime
    share_url: str


class ShareViewRequest(BaseModel):
    password: Optional[str] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/",
    response_model=ShareLinkResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a share link for a document",
    description=(
        "Creates a time-limited, optionally password-protected share link for a document. "
        "The recipient can view document metadata without needing an account."
    ),
)
async def create_share_link(
    payload: ShareLinkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Verify document belongs to user's company
    result = await db.execute(select(Document).where(Document.id == payload.document_id))
    doc = result.scalar_one_or_none()
    if not doc or str(doc.company_id) != str(current_user.company_id):
        raise HTTPException(status_code=404, detail="Document not found")

    token = secrets.token_urlsafe(32)
    expires_at = None
    if payload.expires_hours:
        from datetime import timedelta
        expires_at = datetime.utcnow() + timedelta(hours=payload.expires_hours)

    link = ShareLink(
        document_id=doc.id,
        created_by=current_user.id,
        token=token,
        password_hash=get_password_hash(payload.password) if payload.password else None,
        expires_at=expires_at,
        max_views=payload.max_views,
    )
    db.add(link)
    await db.commit()
    await db.refresh(link)

    return {
        "id": str(link.id),
        "token": link.token,
        "document_id": str(link.document_id),
        "expires_at": link.expires_at,
        "max_views": link.max_views,
        "view_count": link.view_count,
        "is_active": link.is_active,
        "created_at": link.created_at,
        "share_url": f"/share/{link.token}",
    }


@router.get(
    "/",
    summary="List share links you created",
    description="Returns all share links created by the current user for their company's documents.",
)
async def list_share_links(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(ShareLink).where(ShareLink.created_by == current_user.id).order_by(ShareLink.created_at.desc())
    )
    links = result.scalars().all()
    return [
        {
            "id": str(l.id),
            "token": l.token,
            "document_id": str(l.document_id),
            "expires_at": l.expires_at,
            "max_views": l.max_views,
            "view_count": l.view_count,
            "is_active": l.is_active,
            "created_at": l.created_at,
            "share_url": f"/share/{l.token}",
        }
        for l in links
    ]


@router.get(
    "/{token}",
    summary="Resolve a share link (public)",
    description=(
        "Resolves a share token and returns document metadata. "
        "No authentication required. Returns 401 if the link is password-protected "
        "(use POST /share-links/{token}/view to unlock)."
    ),
)
async def resolve_share_link(token: str, db: AsyncSession = Depends(get_db)):
    link = await _get_valid_link(token, db)

    if link.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This link is password-protected. POST to /share-links/{token}/view with the password.",
        )

    return await _build_share_response(link, db)


@router.post(
    "/{token}/view",
    summary="Access a password-protected share link (public)",
    description="Unlocks a password-protected share link. Increments the view counter.",
)
async def view_share_link(token: str, payload: ShareViewRequest, db: AsyncSession = Depends(get_db)):
    link = await _get_valid_link(token, db)

    if link.password_hash:
        if not payload.password or not verify_password(payload.password, link.password_hash):
            raise HTTPException(status_code=403, detail="Incorrect password")

    link.view_count += 1
    await db.commit()
    return await _build_share_response(link, db)


@router.delete(
    "/{link_id}",
    summary="Revoke a share link",
    description="Immediately deactivates a share link. The token becomes invalid.",
)
async def revoke_share_link(
    link_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(ShareLink).where(ShareLink.id == link_id))
    link = result.scalar_one_or_none()
    if not link or str(link.created_by) != str(current_user.id):
        raise HTTPException(status_code=404, detail="Share link not found")

    link.is_active = False
    await db.commit()
    return {"status": "revoked"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_valid_link(token: str, db: AsyncSession) -> ShareLink:
    result = await db.execute(select(ShareLink).where(ShareLink.token == token))
    link = result.scalar_one_or_none()

    if not link or not link.is_active:
        raise HTTPException(status_code=404, detail="Share link not found or revoked")
    if link.expires_at and link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Share link has expired")
    if link.max_views and link.view_count >= link.max_views:
        raise HTTPException(status_code=410, detail="Share link view limit reached")

    return link


async def _build_share_response(link: ShareLink, db: AsyncSession) -> dict:
    result = await db.execute(select(Document).where(Document.id == link.document_id))
    doc = result.scalar_one_or_none()
    return {
        "token": link.token,
        "expires_at": link.expires_at,
        "view_count": link.view_count,
        "document": {
            "id": str(doc.id),
            "original_filename": doc.original_filename,
            "document_type": str(doc.document_type),
            "summary": doc.summary,
            "created_at": doc.created_at,
        } if doc else None,
    }
