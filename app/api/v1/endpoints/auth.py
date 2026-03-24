"""
Authentication endpoints.

POST /auth/register        — create account
POST /auth/login           — login with email + password (JSON body)
POST /auth/refresh         — exchange refresh token for new access token
POST /auth/logout          — invalidate refresh token (blacklist in Redis)
POST /auth/forgot-password — request password reset email
POST /auth/reset-password  — set new password with reset token
GET  /auth/me              — get current user profile
PUT  /auth/me              — update profile (name, language)
PUT  /auth/me/password     — change password (requires current password)
"""

import secrets
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.dependencies import get_current_active_user
from app.core.config import settings
from app.core.database import get_db
from app.core.redis import get_redis
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserResponse, Token

router = APIRouter()

RESET_TOKEN_TTL = 3600          # 1 hour
REFRESH_BLACKLIST_PREFIX = "blacklist:refresh:"
RESET_TOKEN_PREFIX = "reset:"


# ---------------------------------------------------------------------------
# Schemas (inline — avoids touching existing schemas/ files)
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    language: Optional[str] = None


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        company_id=user_data.company_id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Login — credentials in JSON body (never query params)
# ---------------------------------------------------------------------------

@router.post("/login", response_model=Token)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    user.last_login = datetime.utcnow()
    await db.commit()

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return Token(access_token=access_token, refresh_token=refresh_token)


# ---------------------------------------------------------------------------
# Refresh token
# ---------------------------------------------------------------------------

@router.post("/refresh", response_model=Token)
async def refresh_token(
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    redis = await get_redis()

    # Check blacklist
    if redis:
        blacklisted = await redis.get(f"{REFRESH_BLACKLIST_PREFIX}{payload.refresh_token}")
        if blacklisted:
            raise HTTPException(status_code=401, detail="Refresh token has been revoked")

    token_data = decode_token(payload.refresh_token)
    if token_data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id = token_data.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    # Blacklist the used refresh token
    if redis:
        exp = token_data.get("exp", 0)
        ttl = max(int(exp - datetime.utcnow().timestamp()), 1)
        await redis.setex(f"{REFRESH_BLACKLIST_PREFIX}{payload.refresh_token}", ttl, "1")

    new_access = create_access_token(data={"sub": str(user.id)})
    new_refresh = create_refresh_token(data={"sub": str(user.id)})

    return Token(access_token=new_access, refresh_token=new_refresh)


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------

@router.post("/logout")
async def logout(
    payload: RefreshRequest,
    current_user: User = Depends(get_current_active_user),
):
    redis = await get_redis()
    if redis:
        token_data = decode_token(payload.refresh_token)
        exp = token_data.get("exp", 0)
        ttl = max(int(exp - datetime.utcnow().timestamp()), 1)
        await redis.setex(f"{REFRESH_BLACKLIST_PREFIX}{payload.refresh_token}", ttl, "1")
    return {"status": "logged out"}


# ---------------------------------------------------------------------------
# Forgot / Reset password
# ---------------------------------------------------------------------------

@router.post("/forgot-password")
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a password-reset token and (in production) email it to the user.
    Always returns 200 so as not to leak whether the email exists.
    """
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if user and user.is_active:
        redis = await get_redis()
        reset_token = secrets.token_urlsafe(32)

        if redis:
            await redis.setex(
                f"{RESET_TOKEN_PREFIX}{reset_token}",
                RESET_TOKEN_TTL,
                str(user.id),
            )

        # TODO: send email via SMTP service
        # In development the token is returned directly; remove in production
        if settings.ENVIRONMENT == "development":
            return {"status": "ok", "reset_token": reset_token, "note": "dev-only: remove in production"}

    return {"status": "ok", "message": "If the email is registered, a reset link has been sent"}


@router.post("/reset-password")
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    redis = await get_redis()
    if not redis:
        raise HTTPException(status_code=503, detail="Password reset unavailable (Redis not connected)")

    user_id = await redis.get(f"{RESET_TOKEN_PREFIX}{payload.token}")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = get_password_hash(payload.new_password)
    await db.commit()
    await redis.delete(f"{RESET_TOKEN_PREFIX}{payload.token}")

    return {"status": "ok", "message": "Password updated successfully"}


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.put("/me")
async def update_profile(
    payload: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
    }


@router.put("/me/password")
async def change_password(
    payload: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.hashed_password = get_password_hash(payload.new_password)
    await db.commit()
    return {"status": "ok", "message": "Password changed successfully"}
