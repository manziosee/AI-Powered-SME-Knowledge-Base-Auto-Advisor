"""
Session management endpoints.

GET    /auth/sessions           — list active sessions for current user
DELETE /auth/sessions/{id}      — revoke a specific session (force logout)
DELETE /auth/sessions           — revoke all sessions except current
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_active_user
from app.core.database import get_db
from app.core.redis import get_redis
from app.models.user import User
from app.models.user_session import UserSession

router = APIRouter()

REFRESH_BLACKLIST_PREFIX = "blacklist:refresh:"


def _parse_device(user_agent: Optional[str]) -> str:
    if not user_agent:
        return "Unknown device"
    ua = user_agent.lower()
    browser = "Unknown browser"
    os_hint = "Unknown OS"
    for b in ("chrome", "firefox", "safari", "edge", "opera"):
        if b in ua:
            browser = b.capitalize()
            break
    for o in ("windows", "mac os", "linux", "android", "iphone", "ipad"):
        if o in ua:
            os_hint = o.title()
            break
    return f"{browser} / {os_hint}"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/",
    summary="List active sessions",
    description="Returns all active login sessions for the current user across all devices.",
)
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(UserSession).where(
            UserSession.user_id == current_user.id,
            UserSession.is_active == True,  # noqa: E712
        ).order_by(UserSession.last_seen_at.desc())
    )
    sessions = result.scalars().all()
    return [
        {
            "id": str(s.id),
            "ip_address": s.ip_address,
            "device_hint": s.device_hint or _parse_device(s.user_agent),
            "created_at": s.created_at,
            "last_seen_at": s.last_seen_at,
            "expires_at": s.expires_at,
        }
        for s in sessions
    ]


@router.delete(
    "/{session_id}",
    summary="Revoke a session",
    description="Force-logs out a specific session (e.g., a device you no longer use). The refresh token for that session is immediately blacklisted.",
)
async def revoke_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(UserSession).where(
            UserSession.id == session_id,
            UserSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.is_active = False

    # Blacklist the refresh token in Redis
    redis = await get_redis()
    if redis and session.refresh_token_jti:
        ttl = 60 * 60 * 24 * 7  # 7 days
        await redis.setex(f"{REFRESH_BLACKLIST_PREFIX}{session.refresh_token_jti}", ttl, "1")

    await db.commit()
    return {"status": "revoked"}


@router.delete(
    "/",
    summary="Revoke all other sessions",
    description="Logs out all sessions except the current one. Useful after a suspected compromise.",
)
async def revoke_all_sessions(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(UserSession).where(
            UserSession.user_id == current_user.id,
            UserSession.is_active == True,  # noqa: E712
        )
    )
    sessions = result.scalars().all()

    redis = await get_redis()
    revoked = 0
    for s in sessions:
        s.is_active = False
        revoked += 1
        if redis and s.refresh_token_jti:
            await redis.setex(f"{REFRESH_BLACKLIST_PREFIX}{s.refresh_token_jti}", 60 * 60 * 24 * 7, "1")

    await db.commit()
    return {"status": "ok", "sessions_revoked": revoked}
