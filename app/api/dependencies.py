from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
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
