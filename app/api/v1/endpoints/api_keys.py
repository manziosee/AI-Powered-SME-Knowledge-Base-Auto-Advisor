"""
API Key management endpoints.

POST   /auth/api-keys           — create a new API key (raw key shown once)
GET    /auth/api-keys           — list all API keys for the current user
DELETE /auth/api-keys/{key_id}  — revoke an API key
"""

import hashlib
import secrets
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_active_user
from app.core.database import get_db
from app.models.api_key import ApiKey
from app.models.user import User

router = APIRouter()

_SCOPES = {"read", "write", "admin"}


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ApiKeyCreate(BaseModel):
    name: str
    scopes: List[str] = ["read"]
    expires_days: Optional[int] = None   # None = never expires


class ApiKeyCreatedResponse(BaseModel):
    id: str
    name: str
    key: str          # raw key — shown ONCE, never stored
    key_prefix: str
    scopes: List[str]
    expires_at: Optional[datetime]
    created_at: datetime


class ApiKeyListItem(BaseModel):
    id: str
    name: str
    key_prefix: str
    scopes: List[str]
    is_active: bool
    last_used_at: Optional[datetime]
    expires_at: Optional[datetime]
    created_at: datetime


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/",
    response_model=ApiKeyCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create API key",
    description=(
        "Creates a new API key. The raw key is returned **once** and never stored — "
        "save it immediately. Keys are prefixed `sk_` and can have scopes: `read`, `write`, `admin`."
    ),
)
async def create_api_key(
    payload: ApiKeyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    invalid_scopes = set(payload.scopes) - _SCOPES
    if invalid_scopes:
        raise HTTPException(status_code=400, detail=f"Invalid scopes: {invalid_scopes}. Allowed: {_SCOPES}")

    raw_key = "sk_" + secrets.token_urlsafe(40)
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    key_prefix = raw_key[:10]

    expires_at = None
    if payload.expires_days:
        from datetime import timedelta
        expires_at = datetime.utcnow() + timedelta(days=payload.expires_days)

    api_key = ApiKey(
        user_id=current_user.id,
        name=payload.name,
        key_hash=key_hash,
        key_prefix=key_prefix,
        scopes=payload.scopes,
        expires_at=expires_at,
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)

    return ApiKeyCreatedResponse(
        id=str(api_key.id),
        name=api_key.name,
        key=raw_key,
        key_prefix=key_prefix,
        scopes=api_key.scopes,
        expires_at=api_key.expires_at,
        created_at=api_key.created_at,
    )


@router.get(
    "/",
    summary="List API keys",
    description="Returns all API keys for the current user. The raw key is never returned after creation.",
)
async def list_api_keys(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(ApiKey).where(ApiKey.user_id == current_user.id).order_by(ApiKey.created_at.desc())
    )
    keys = result.scalars().all()
    return [
        ApiKeyListItem(
            id=str(k.id),
            name=k.name,
            key_prefix=k.key_prefix,
            scopes=k.scopes or [],
            is_active=k.is_active,
            last_used_at=k.last_used_at,
            expires_at=k.expires_at,
            created_at=k.created_at,
        )
        for k in keys
    ]


@router.delete(
    "/{key_id}",
    summary="Revoke API key",
    description="Permanently deactivates an API key. This cannot be undone.",
)
async def revoke_api_key(
    key_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == current_user.id)
    )
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")

    key.is_active = False
    await db.commit()
    return {"status": "revoked"}
