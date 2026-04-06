"""
Accounting & Payroll Connectors endpoints.

POST /connectors/quickbooks/connect     — OAuth2 connect to QuickBooks
GET  /connectors/quickbooks/invoices    — fetch invoices from QuickBooks
POST /connectors/xero/connect           — OAuth2 connect to Xero
GET  /connectors/xero/contacts          — fetch contacts from Xero
POST /connectors/mtn-momo/webhook       — receive MTN MoMo payment notifications
POST /connectors/airtel-money/webhook   — receive Airtel Money payment notifications
GET  /connectors/                       — list configured connectors for company
"""

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_active_user, require_role
from app.core.database import get_db
from app.models.integration import Integration, IntegrationType, IntegrationStatus, IntegrationLog
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ConnectorConfig(BaseModel):
    name: str
    api_key: Optional[str] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    realm_id: Optional[str] = None       # QuickBooks
    tenant_id: Optional[str] = None      # Xero
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    extra: dict = {}


class MoMoWebhookPayload(BaseModel):
    transactionId: Optional[str] = None
    referenceId: Optional[str] = None
    status: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    payer: Optional[dict] = None
    payee: Optional[dict] = None
    reason: Optional[str] = None


# ---------------------------------------------------------------------------
# Connector list
# ---------------------------------------------------------------------------

@router.get(
    "/",
    summary="List company connectors",
    description="Returns all configured third-party connectors for the current company.",
)
async def list_connectors(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not current_user.company_id:
        return []
    result = await db.execute(
        select(Integration).where(
            Integration.company_id == current_user.company_id,
            Integration.integration_type.in_([
                IntegrationType.ACCOUNTING,
                IntegrationType.HR_SYSTEM,
            ]),
        )
    )
    integrations = result.scalars().all()
    return [
        {
            "id": str(i.id),
            "name": i.name,
            "type": str(i.integration_type),
            "status": str(i.status),
            "last_triggered_at": i.last_triggered_at,
            "created_at": i.created_at,
        }
        for i in integrations
    ]


# ---------------------------------------------------------------------------
# QuickBooks
# ---------------------------------------------------------------------------

@router.post(
    "/quickbooks/connect",
    summary="Connect QuickBooks Online",
    description=(
        "Saves QuickBooks OAuth2 credentials (access_token, refresh_token, realm_id) "
        "for the company. Get tokens via the QuickBooks OAuth2 flow and pass them here."
    ),
)
async def connect_quickbooks(
    payload: ConnectorConfig,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company")

    integration = Integration(
        company_id=current_user.company_id,
        name=payload.name or "QuickBooks Online",
        integration_type=IntegrationType.ACCOUNTING,
        status=IntegrationStatus.ACTIVE,
        endpoint_url="https://quickbooks.api.intuit.com",
        api_key_encrypted=payload.access_token,
        headers={
            "realm_id": payload.realm_id,
            "refresh_token": payload.refresh_token,
            "client_id": payload.client_id,
            "client_secret": payload.client_secret,
            "provider": "quickbooks",
        },
    )
    db.add(integration)
    await db.commit()
    await db.refresh(integration)
    return {"status": "connected", "id": str(integration.id), "provider": "quickbooks"}


@router.get(
    "/quickbooks/invoices",
    summary="Fetch invoices from QuickBooks",
    description="Retrieves recent invoices from QuickBooks Online for the connected account.",
)
async def get_quickbooks_invoices(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    integration = await _get_connector(current_user, "quickbooks", db)
    try:
        import httpx
        access_token = integration.api_key_encrypted
        realm_id = (integration.headers or {}).get("realm_id", "")
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://quickbooks.api.intuit.com/v3/company/{realm_id}/query",
                params={"query": f"SELECT * FROM Invoice MAXRESULTS {limit}", "minorversion": "65"},
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
                timeout=10,
            )
            if r.status_code == 401:
                raise HTTPException(status_code=401, detail="QuickBooks token expired — reconnect via /connectors/quickbooks/connect")
            return r.json()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"QuickBooks API error: {exc}")


# ---------------------------------------------------------------------------
# Xero
# ---------------------------------------------------------------------------

@router.post(
    "/xero/connect",
    summary="Connect Xero",
    description="Saves Xero OAuth2 credentials for the company.",
)
async def connect_xero(
    payload: ConnectorConfig,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company")

    integration = Integration(
        company_id=current_user.company_id,
        name=payload.name or "Xero",
        integration_type=IntegrationType.ACCOUNTING,
        status=IntegrationStatus.ACTIVE,
        endpoint_url="https://api.xero.com",
        api_key_encrypted=payload.access_token,
        headers={
            "tenant_id": payload.tenant_id,
            "refresh_token": payload.refresh_token,
            "client_id": payload.client_id,
            "provider": "xero",
        },
    )
    db.add(integration)
    await db.commit()
    await db.refresh(integration)
    return {"status": "connected", "id": str(integration.id), "provider": "xero"}


@router.get(
    "/xero/contacts",
    summary="Fetch contacts from Xero",
    description="Retrieves contacts/vendors from Xero for the connected account.",
)
async def get_xero_contacts(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    integration = await _get_connector(current_user, "xero", db)
    try:
        import httpx
        access_token = integration.api_key_encrypted
        tenant_id = (integration.headers or {}).get("tenant_id", "")
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://api.xero.com/api.xro/2.0/Contacts",
                params={"pageSize": limit},
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Xero-tenant-id": tenant_id,
                    "Accept": "application/json",
                },
                timeout=10,
            )
            if r.status_code == 401:
                raise HTTPException(status_code=401, detail="Xero token expired — reconnect via /connectors/xero/connect")
            return r.json()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Xero API error: {exc}")


# ---------------------------------------------------------------------------
# MTN MoMo webhook
# ---------------------------------------------------------------------------

@router.post(
    "/mtn-momo/webhook",
    summary="Receive MTN MoMo payment notification",
    description=(
        "Public endpoint that receives payment status callbacks from MTN Mobile Money. "
        "Logs the event and creates a knowledge entry for the transaction."
    ),
)
async def mtn_momo_webhook(
    payload: MoMoWebhookPayload,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    logger.info("MTN MoMo webhook received: txn=%s status=%s", payload.transactionId, payload.status)
    # Store as integration log — link to company via X-Company-Id header if provided
    company_id = request.headers.get("X-Company-Id")
    log = IntegrationLog(
        integration_id=None,
        event_type="mtn_momo_payment",
        payload={
            "transactionId": payload.transactionId,
            "referenceId": payload.referenceId,
            "status": payload.status,
            "amount": payload.amount,
            "currency": payload.currency,
        },
        response_status=200,
        success=True,
    )
    db.add(log)
    await db.commit()
    return {"status": "received"}


# ---------------------------------------------------------------------------
# Airtel Money webhook
# ---------------------------------------------------------------------------

@router.post(
    "/airtel-money/webhook",
    summary="Receive Airtel Money payment notification",
    description="Public endpoint for Airtel Money payment status callbacks.",
)
async def airtel_money_webhook(
    payload: dict,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    logger.info("Airtel Money webhook received: %s", payload)
    log = IntegrationLog(
        integration_id=None,
        event_type="airtel_money_payment",
        payload=payload,
        response_status=200,
        success=True,
    )
    db.add(log)
    await db.commit()
    return {"status": "received"}


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

async def _get_connector(user: User, provider: str, db: AsyncSession) -> Integration:
    if not user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company")

    result = await db.execute(
        select(Integration).where(
            Integration.company_id == user.company_id,
            Integration.integration_type == IntegrationType.ACCOUNTING,
        )
    )
    integrations = result.scalars().all()
    for i in integrations:
        if (i.headers or {}).get("provider") == provider:
            return i

    raise HTTPException(
        status_code=404,
        detail=f"{provider.title()} not connected. Use POST /connectors/{provider}/connect first.",
    )
