"""
Document Comments endpoints.

GET    /documents/{doc_id}/comments        — list comments for a document
POST   /documents/{doc_id}/comments        — add a comment (optionally reply to another)
PUT    /documents/{doc_id}/comments/{id}   — edit a comment (owner only)
DELETE /documents/{doc_id}/comments/{id}   — delete a comment (owner or admin)
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_active_user
from app.core.database import get_db
from app.models.document import Document
from app.models.document_comment import DocumentComment
from app.models.user import User, UserRole

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[str] = None


class CommentUpdate(BaseModel):
    content: str


def _serialize(c: DocumentComment, user_name: str = "Unknown") -> dict:
    return {
        "id": str(c.id),
        "document_id": str(c.document_id),
        "user_id": str(c.user_id) if c.user_id else None,
        "user_name": user_name,
        "parent_id": str(c.parent_id) if c.parent_id else None,
        "content": c.content,
        "is_edited": c.is_edited,
        "created_at": c.created_at,
        "updated_at": c.updated_at,
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/{doc_id}/comments",
    summary="List comments on a document",
    description="Returns all comments for a document, newest first. Replies are included inline.",
)
async def list_comments(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await _assert_doc_access(doc_id, current_user, db)

    result = await db.execute(
        select(DocumentComment)
        .where(DocumentComment.document_id == doc_id)
        .order_by(DocumentComment.created_at)
    )
    comments = result.scalars().all()

    # Fetch user names in batch
    user_ids = list({str(c.user_id) for c in comments if c.user_id})
    users_map: dict = {}
    if user_ids:
        u_result = await db.execute(select(User).where(User.id.in_(user_ids)))
        for u in u_result.scalars().all():
            users_map[str(u.id)] = u.full_name

    return [_serialize(c, users_map.get(str(c.user_id), "Unknown")) for c in comments]


@router.post(
    "/{doc_id}/comments",
    status_code=status.HTTP_201_CREATED,
    summary="Add a comment to a document",
    description="Adds a new comment or reply to an existing comment thread on a document.",
)
async def create_comment(
    doc_id: str,
    payload: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await _assert_doc_access(doc_id, current_user, db)

    if payload.parent_id:
        p_result = await db.execute(
            select(DocumentComment).where(
                DocumentComment.id == payload.parent_id,
                DocumentComment.document_id == doc_id,
            )
        )
        if not p_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Parent comment not found")

    comment = DocumentComment(
        document_id=doc_id,
        user_id=current_user.id,
        parent_id=payload.parent_id,
        content=payload.content.strip(),
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return _serialize(comment, current_user.full_name)


@router.put(
    "/{doc_id}/comments/{comment_id}",
    summary="Edit a comment",
    description="Updates the content of a comment. Only the original author can edit.",
)
async def update_comment(
    doc_id: str,
    comment_id: str,
    payload: CommentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    comment = await _get_comment(comment_id, doc_id, db)
    if str(comment.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="You can only edit your own comments")

    comment.content = payload.content.strip()
    comment.is_edited = True
    comment.updated_at = datetime.utcnow()
    await db.commit()
    return _serialize(comment, current_user.full_name)


@router.delete(
    "/{doc_id}/comments/{comment_id}",
    summary="Delete a comment",
    description="Deletes a comment. Authors can delete their own; admins can delete any.",
)
async def delete_comment(
    doc_id: str,
    comment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    comment = await _get_comment(comment_id, doc_id, db)
    is_owner = str(comment.user_id) == str(current_user.id)
    is_admin = current_user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN)
    if not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="Not allowed to delete this comment")

    await db.delete(comment)
    await db.commit()
    return {"status": "deleted"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _assert_doc_access(doc_id: str, user: User, db: AsyncSession) -> Document:
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc or str(doc.company_id) != str(user.company_id):
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


async def _get_comment(comment_id: str, doc_id: str, db: AsyncSession) -> DocumentComment:
    result = await db.execute(
        select(DocumentComment).where(
            DocumentComment.id == comment_id,
            DocumentComment.document_id == doc_id,
        )
    )
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Comment not found")
    return c
