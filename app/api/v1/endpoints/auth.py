"""
Authentication endpoints.

POST /auth/register        — create account (password strength enforced)
POST /auth/login           — login with email + password, returns JWT pair
POST /auth/refresh         — rotate refresh token (old token blacklisted)
POST /auth/logout          — blacklist refresh token in Redis
POST /auth/forgot-password — request password reset (always 200, no email leak)
POST /auth/reset-password  — set new password with Redis-backed token
GET  /auth/me              — current user profile + company
PUT  /auth/me              — update name / email
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
    validate_password_strength,
)
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserResponse, Token

router = APIRouter()

RESET_TOKEN_TTL = 3600           # 1 hour
REFRESH_BLACKLIST_PREFIX = "blacklist:refresh:"
RESET_TOKEN_PREFIX = "reset:"

# Account lockout after N consecutive failed logins
LOGIN_FAIL_PREFIX = "login_fail:"
LOGIN_LOCK_PREFIX = "login_lock:"
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_SECONDS = 15 * 60       # 15 minutes


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
    token: str = Field(..., description="Reset token received via email")
    new_password: str = Field(..., min_length=8, description="New password (min 8 chars, must contain letter + digit)")


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., description="Current account password")
    new_password: str = Field(..., min_length=8, description="New password (min 8 chars, must contain letter + digit)")


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    language: Optional[str] = None
    email: Optional[str] = None


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new account",
    description=(
        "Create a new user account.\n\n"
        "**`account_type=company` (default):** Creates a company and assigns the registering user as `super_admin`. "
        "Requires `company_name`. Company name must be unique.\n\n"
        "**`account_type=individual`:** Creates a personal account with `individual` role and no company. "
        "Limited to personal document management and AI queries.\n\n"
        "Password must be \u22658 characters with at least one letter and one digit."
    ),
)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    from app.models.user import AccountType, DEFAULT_PERMISSIONS

    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Enforce password strength
    try:
        validate_password_strength(user_data.password)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Determine account type
    acct_type_str = (user_data.account_type or "company").lower()
    is_individual = acct_type_str == "individual"

    # Determine role
    if is_individual:
        # Individual users get the individual role — no company
        role_value = UserRole.INDIVIDUAL.value
        company_id = None
        account_type = AccountType.INDIVIDUAL
    else:
        # Company registration — first user becomes super_admin
        role_value = UserRole.SUPER_ADMIN.value
        account_type = AccountType.COMPANY
        company_id = user_data.company_id
        if not company_id and user_data.company_name:
            from app.models.company import Company
            # Check company name uniqueness
            existing_co = await db.execute(select(Company).where(Company.name == user_data.company_name))
            if existing_co.scalar_one_or_none():
                raise HTTPException(status_code=400, detail=f"A company named '{user_data.company_name}' already exists. Use a different name or ask your administrator to add you.")
            company = Company(
                name=user_data.company_name,
                country=user_data.country or "US",
                industry=user_data.industry,
            )
            db.add(company)
            await db.flush()
            company_id = company.id

    # Assign default permissions based on role
    permissions = DEFAULT_PERMISSIONS.get(role_value, [])

    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=role_value,
        account_type=account_type,
        permissions=permissions,
        company_id=company_id,
    )
    try:
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration failed: {exc}")


# ---------------------------------------------------------------------------
# Login — credentials in JSON body (never query params)
# ---------------------------------------------------------------------------

@router.post(
    "/login",
    response_model=Token,
    summary="Login and get JWT tokens",
    description="Authenticate with email and password. Returns access token (30 min) and refresh token (7 days). Account locks after 5 failed attempts for 15 minutes.",
)
async def login(payload: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    redis = None
    try:
        redis = await get_redis()
    except Exception:
        pass

    # Check account lockout before touching the DB
    if redis:
        try:
            lock_key = f"{LOGIN_LOCK_PREFIX}{payload.email}"
            locked = await redis.get(lock_key)
            if locked:
                ttl = await redis.ttl(lock_key)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Account temporarily locked due to too many failed attempts. "
                           f"Try again in {ttl // 60 + 1} minute(s).",
                    headers={"Retry-After": str(ttl)},
                )
        except HTTPException:
            raise
        except Exception:
            redis = None  # Redis unavailable — skip lockout check

    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        # Increment failure counter in Redis
        if redis and user:
            fail_key = f"{LOGIN_FAIL_PREFIX}{payload.email}"
            count = await redis.incr(fail_key)
            await redis.expire(fail_key, LOCKOUT_SECONDS)
            if count >= MAX_LOGIN_ATTEMPTS:
                await redis.setex(f"{LOGIN_LOCK_PREFIX}{payload.email}", LOCKOUT_SECONDS, "1")
                await redis.delete(fail_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    # 2FA check — if enabled, require TOTP before issuing tokens
    if user.otp_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "2fa_required", "user_id": str(user.id)},
            headers={"X-2FA-Required": "true"},
        )

    # Successful login — clear any failure counter
    if redis:
        await redis.delete(f"{LOGIN_FAIL_PREFIX}{payload.email}")

    user.last_login = datetime.utcnow()
    await db.commit()

    access_token  = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # Record session for session management
    try:
        from app.models.user_session import UserSession
        from app.core.security import decode_token as _decode
        jti = _decode(refresh_token).get("jti") or secrets.token_hex(16)
        ua  = request.headers.get("user-agent", "")
        from app.api.v1.endpoints.sessions import _parse_device
        session = UserSession(
            user_id=user.id,
            refresh_token_jti=jti,
            ip_address=request.client.host if request.client else None,
            user_agent=ua[:512],
            device_hint=_parse_device(ua),
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        db.add(session)
        await db.commit()
    except Exception:
        pass  # non-fatal — session tracking is best-effort

    return Token(access_token=access_token, refresh_token=refresh_token)


# ---------------------------------------------------------------------------
# Refresh token
# ---------------------------------------------------------------------------

@router.post(
    "/refresh",
    response_model=Token,
    summary="Rotate refresh token",
    description="Exchange a valid refresh token for a new access+refresh token pair. The old refresh token is immediately blacklisted in Redis.",
)
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

@router.post("/logout", summary="Logout and blacklist refresh token", description="Invalidates the provided refresh token. The access token expires naturally after 30 minutes.")
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

@router.post(
    "/forgot-password",
    summary="Request password reset",
    description="Sends a password reset link. Always returns 200 to prevent email enumeration. In development, the token is returned directly.",
)
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

        # Send password reset email
        try:
            from app.services.email_service import send_password_reset_email
            frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
            await send_password_reset_email(
                user_email=user.email,
                user_name=user.full_name,
                reset_token=reset_token,
                frontend_url=frontend_url,
            )
        except Exception:
            pass  # non-fatal — token still valid

        # In development return token directly for testing
        if settings.ENVIRONMENT == "development":
            return {"status": "ok", "reset_token": reset_token, "note": "dev-only: remove in production"}

    return {"status": "ok", "message": "If the email is registered, a reset link has been sent"}


@router.post(
    "/reset-password",
    summary="Reset password with token",
    description="Set a new password using the token from the forgot-password flow. Token is single-use and expires after 1 hour.",
)
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

    try:
        validate_password_strength(payload.new_password)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    user.hashed_password = get_password_hash(payload.new_password)
    await db.commit()
    await redis.delete(f"{RESET_TOKEN_PREFIX}{payload.token}")

    return {"status": "ok", "message": "Password updated successfully"}


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

@router.get("/me", response_model=UserResponse, summary="Get current user profile", description="Returns the authenticated user's profile including company name.")
async def get_me(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    company_name = None
    if current_user.company_id:
        from app.models.company import Company
        result = await db.execute(select(Company).where(Company.id == current_user.company_id))
        company = result.scalar_one_or_none()
        company_name = company.name if company else None
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "account_type": current_user.account_type.value if hasattr(current_user.account_type, "value") else (current_user.account_type or "company"),
        "permissions": current_user.permissions or [],
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "company_id": str(current_user.company_id) if current_user.company_id else None,
        "company": {"name": company_name} if company_name else None,
        "created_at": current_user.created_at,
        "last_login": current_user.last_login,
    }


@router.put("/me", summary="Update profile", description="Update full name and/or email address. Email uniqueness is enforced.")
async def update_profile(
    payload: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.email is not None:
        # Check email not taken by another user
        existing = await db.execute(select(User).where(User.email == payload.email))
        other = existing.scalar_one_or_none()
        if other and str(other.id) != str(current_user.id):
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = payload.email
    await db.commit()
    await db.refresh(current_user)
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
    }


@router.put("/me/password", summary="Change password", description="Change password. Requires the current password for verification. New password must meet strength requirements.")
async def change_password(
    payload: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    try:
        validate_password_strength(payload.new_password)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    current_user.hashed_password = get_password_hash(payload.new_password)
    await db.commit()
    return {"status": "ok", "message": "Password changed successfully"}


# ---------------------------------------------------------------------------
# Data Export (GDPR Compliance)
# ---------------------------------------------------------------------------

class ExportDataRequest(BaseModel):
    """Types of data to include in export"""
    include_profile: bool = True
    include_documents: bool = False
    include_conversations: bool = False
    include_activity_log: bool = False


@router.post("/me/export-data", summary="Export user data (GDPR)", description="Request a data export. Returns a download URL after processing.")
async def request_data_export(
    payload: ExportDataRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    GDPR-compliant endpoint to export all user data.
    Returns a download URL after processing (async task).
    """
    from app.models.task import BackgroundTask, TaskStatus
    import uuid
    
    # Create export task
    task_id = str(uuid.uuid4())
    task = BackgroundTask(
        task_id=task_id,
        task_name="export_user_data",
        status=TaskStatus.PENDING,
        priority="normal",
        company_id=current_user.company_id,
        user_id=current_user.id,
        input_data=payload.model_dump(),
    )
    db.add(task)
    await db.commit()
    
    # TODO: Queue Celery task to process export
    # For now, return task info
    
    return {
        "task_id": task_id,
        "status": "pending",
        "message": "Data export has been queued. Use /tasks/{task_id} to check status.",
        "download_url": None,
    }


@router.get("/me/export-data/{task_id}", summary="Check export status or download", description="Check status of data export task and get download URL when ready.")
async def get_data_export(
    task_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the status and download URL of a data export task."""
    from app.models.task import BackgroundTask
    from sqlalchemy import select
    
    result = await db.execute(
        select(BackgroundTask).where(
            BackgroundTask.task_id == task_id,
            BackgroundTask.user_id == current_user.id
        )
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Export task not found")
    
    download_url = None
    if task.status == TaskStatus.COMPLETED and task.result_data:
        download_url = task.result_data.get("download_url")
    
    return {
        "task_id": task.task_id,
        "status": task.status.value,
        "progress": task.progress,
        "message": task.progress_message,
        "download_url": download_url,
        "created_at": task.created_at,
        "completed_at": task.completed_at,
    }
