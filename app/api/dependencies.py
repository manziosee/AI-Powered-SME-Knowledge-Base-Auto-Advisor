import hashlib
from datetime import datetime
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole

security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    # ── 1. Try X-API-Key header ──────────────────────────────────────────────
    api_key_raw = request.headers.get("X-API-Key")
    if api_key_raw:
        key_hash = hashlib.sha256(api_key_raw.encode()).hexdigest()
        from app.models.api_key import ApiKey
        result = await db.execute(
            select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.is_active == True)  # noqa: E712
        )
        api_key = result.scalar_one_or_none()
        if api_key:
            if api_key.expires_at and api_key.expires_at < datetime.utcnow():
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="API key expired")
            # Update last_used_at (best-effort)
            api_key.last_used_at = datetime.utcnow()
            await db.commit()
            # Load the owner
            user_result = await db.execute(select(User).where(User.id == api_key.user_id))
            user = user_result.scalar_one_or_none()
            if user and user.is_active:
                return user
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")

    # ── 2. Fall back to Bearer JWT ──────────────────────────────────────────
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated — provide Authorization: Bearer <token> or X-API-Key header",
        )

    token = credentials.credentials
    payload = decode_token(token)

    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


_ROLE_HIERARCHY = {
    UserRole.EMPLOYEE: 0,
    UserRole.MANAGER: 1,
    UserRole.ADMIN: 2,
    UserRole.SUPER_ADMIN: 3,
}


def require_role(minimum_role: UserRole):
    """
    Role hierarchy guard.  Passing UserRole.MANAGER means MANAGER, ADMIN,
    and SUPER_ADMIN are all allowed (higher roles inherit lower permissions).
    """
    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        user_level = _ROLE_HIERARCHY.get(current_user.role, -1)
        required_level = _ROLE_HIERARCHY.get(minimum_role, 999)
        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {minimum_role.value} role or higher",
            )
        return current_user
    return role_checker
