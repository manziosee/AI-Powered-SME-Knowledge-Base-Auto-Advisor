"""
Notifications endpoints.

GET    /notifications/             — list user's notifications (paginated)
PATCH  /notifications/{id}/read    — mark single notification as read
POST   /notifications/read-all     — mark all as read
DELETE /notifications/{id}         — delete a notification
GET    /notifications/unread-count — quick badge count
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, and_, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_active_user
from app.core.database import get_db
from app.models.notification import Notification
from app.models.user import User

router = APIRouter()


@router.get("/")
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    filters = [Notification.user_id == current_user.id]
    if unread_only:
        filters.append(Notification.is_read.is_(False))

    result = await db.execute(
        select(Notification)
        .where(and_(*filters))
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    notifications = result.scalars().all()

    count_result = await db.execute(
        select(func.count(Notification.id)).where(and_(*filters))
    )
    total = count_result.scalar() or 0

    return {
        "items": [_serialize(n) for n in notifications],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/unread-count")
async def unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(func.count(Notification.id))
        .where(and_(Notification.user_id == current_user.id, Notification.is_read.is_(False)))
    )
    return {"unread_count": result.scalar() or 0}


@router.patch("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Notification).where(
            and_(
                Notification.id == notification_id,
                Notification.user_id == current_user.id,
            )
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    await db.commit()
    return {"status": "ok", "id": notification_id}


@router.post("/read-all")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await db.execute(
        update(Notification)
        .where(
            and_(Notification.user_id == current_user.id, Notification.is_read.is_(False))
        )
        .values(is_read=True)
    )
    await db.commit()
    return {"status": "ok"}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Notification).where(
            and_(
                Notification.id == notification_id,
                Notification.user_id == current_user.id,
            )
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    await db.delete(notification)
    await db.commit()
    return {"status": "deleted"}


def _serialize(n: Notification) -> dict:
    return {
        "id": str(n.id),
        "title": n.title,
        "message": n.message,
        "notification_type": str(n.notification_type),
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat() if n.created_at else None,
    }
