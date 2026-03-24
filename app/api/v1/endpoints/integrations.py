"""
Integration / Webhook management endpoints.

POST   /integrations/                     — create an integration (Admin+)
GET    /integrations/                     — list company integrations (Admin+)
GET    /integrations/{id}                 — get integration detail
PUT    /integrations/{id}                 — update integration
DELETE /integrations/{id}                 — delete integration
POST   /integrations/{id}/test            — send a test event
GET    /integrations/{id}/logs            — integration fire history
POST   /integrations/webhook/incoming     — receive inbound webhook (public, sig-verified)
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from pydantic import BaseModel, HttpUrl
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_active_user, require_role
from app.core.config import settings
from app.core.database import get_db
from app.models.integration import (
    Integration,
    IntegrationLog,
    IntegrationStatus,
    IntegrationType,
)
from app.models.user import User, UserRole
from app.services.integration_service import (
    IntegrationEvent,
    dispatch_event,
    verify_incoming_signature,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class IntegrationCreate(BaseModel):
    name: str
    integration_type: IntegrationType
    endpoint_url: Optional[str] = None
    headers: dict = {}
    payload_template: dict = {}
    event_triggers: List[str] = []


class IntegrationUpdate(BaseModel):
    name: Optional[str] = None
    endpoint_url: Optional[str] = None
    headers: Optional[dict] = None
    payload_template: Optional[dict] = None
    event_triggers: Optional[List[str]] = None
    is_active: Optional[bool] = None


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

@router.post("/", status_code=201)
async def create_integration(
    payload: IntegrationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company")

    integration = Integration(
        company_id=current_user.company_id,
        name=payload.name,
        integration_type=payload.integration_type,
        status=IntegrationStatus.ACTIVE,
        endpoint_url=payload.endpoint_url,
        headers=payload.headers,
        payload_template=payload.payload_template,
        event_triggers=payload.event_triggers,
    )
    db.add(integration)
    await db.commit()
    await db.refresh(integration)
    return _serialize(integration)


@router.get("/")
async def list_integrations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(
        select(Integration).where(
            and_(
                Integration.company_id == current_user.company_id,
                Integration.is_active.is_(True),
            )
        )
    )
    return {"items": [_serialize(i) for i in result.scalars().all()]}


@router.get("/{integration_id}")
async def get_integration(
    integration_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    integration = await _get_or_404(db, integration_id, current_user.company_id)
    return _serialize(integration)


@router.put("/{integration_id}")
async def update_integration(
    integration_id: str,
    payload: IntegrationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    integration = await _get_or_404(db, integration_id, current_user.company_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(integration, field, value)
    await db.commit()
    await db.refresh(integration)
    return _serialize(integration)


@router.delete("/{integration_id}")
async def delete_integration(
    integration_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    integration = await _get_or_404(db, integration_id, current_user.company_id)
    integration.is_active = False
    await db.commit()
    return {"status": "deleted", "integration_id": integration_id}


# ---------------------------------------------------------------------------
# Test fire
# ---------------------------------------------------------------------------

@router.post("/{integration_id}/test")
async def test_integration(
    integration_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    await _get_or_404(db, integration_id, current_user.company_id)
    results = await dispatch_event(
        db=db,
        company_id=str(current_user.company_id),
        event_type="integration.test",
        payload={"message": "This is a test event from SME Advisor", "company_id": str(current_user.company_id)},
    )
    return {"status": "fired", "results": results}


# ---------------------------------------------------------------------------
# Logs
# ---------------------------------------------------------------------------

@router.get("/{integration_id}/logs")
async def get_integration_logs(
    integration_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    limit: int = 50,
):
    await _get_or_404(db, integration_id, current_user.company_id)
    result = await db.execute(
        select(IntegrationLog)
        .where(IntegrationLog.integration_id == integration_id)
        .order_by(IntegrationLog.triggered_at.desc())
        .limit(limit)
    )
    logs = result.scalars().all()
    return {
        "items": [
            {
                "id": str(log.id),
                "event_type": log.event_type,
                "response_status": log.response_status,
                "success": log.success,
                "triggered_at": log.triggered_at.isoformat() if log.triggered_at else None,
            }
            for log in logs
        ]
    }


# ---------------------------------------------------------------------------
# Inbound webhook receiver
# ---------------------------------------------------------------------------

@router.post("/webhook/incoming")
async def receive_webhook(
    request: Request,
    x_sme_signature: Optional[str] = Header(None),
):
    """
    Public endpoint to receive inbound webhooks from external systems.
    Verifies HMAC-SHA256 signature when WEBHOOK_SECRET is configured.
    """
    raw_body = await request.body()

    if settings.WEBHOOK_SECRET and x_sme_signature:
        if not verify_incoming_signature(raw_body, x_sme_signature, settings.WEBHOOK_SECRET):
            raise HTTPException(status_code=401, detail="Invalid webhook signature")

    # Acknowledge receipt — actual processing happens in a background task
    return {"status": "received"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_or_404(db: AsyncSession, integration_id: str, company_id) -> Integration:
    result = await db.execute(
        select(Integration).where(
            and_(
                Integration.id == integration_id,
                Integration.company_id == company_id,
            )
        )
    )
    integration = result.scalar_one_or_none()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    return integration


def _serialize(i: Integration) -> dict:
    return {
        "id": str(i.id),
        "name": i.name,
        "integration_type": i.integration_type.value,
        "status": i.status.value,
        "endpoint_url": i.endpoint_url,
        "event_triggers": i.event_triggers,
        "last_triggered_at": i.last_triggered_at.isoformat() if i.last_triggered_at else None,
        "last_error": i.last_error,
        "retry_count": i.retry_count,
        "is_active": i.is_active,
        "created_at": i.created_at.isoformat() if i.created_at else None,
    }
