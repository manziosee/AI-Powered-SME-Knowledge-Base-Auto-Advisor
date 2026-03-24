"""
Integration / webhook dispatcher service.

Supports outbound webhooks and generic API integrations (accounting, HR, ERP, CRM).
Incoming webhook validation is handled at the endpoint layer.
"""

import hmac
import hashlib
import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.integration import Integration, IntegrationLog, IntegrationStatus

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Supported event types
# ---------------------------------------------------------------------------

class IntegrationEvent:
    DOCUMENT_UPLOADED = "document.uploaded"
    DOCUMENT_PROCESSED = "document.processed"
    KNOWLEDGE_EXTRACTED = "knowledge.extracted"
    COMPLIANCE_ALERT = "compliance.alert"
    DEADLINE_APPROACHING = "deadline.approaching"
    RISK_DETECTED = "risk.detected"
    REPORT_READY = "report.ready"
    USER_CREATED = "user.created"


async def get_active_integrations(
    db: AsyncSession,
    company_id: str,
    event_type: str,
) -> list[Integration]:
    result = await db.execute(
        select(Integration).where(
            and_(
                Integration.company_id == company_id,
                Integration.is_active.is_(True),
                Integration.status == IntegrationStatus.ACTIVE,
            )
        )
    )
    integrations = result.scalars().all()
    # Filter by event trigger
    return [i for i in integrations if not i.event_triggers or event_type in i.event_triggers]


async def dispatch_event(
    db: AsyncSession,
    company_id: str,
    event_type: str,
    payload: Dict[str, Any],
    secret: Optional[str] = None,
) -> Dict[str, int]:
    """Fire an event to all matching integrations. Returns success/failure counts."""
    integrations = await get_active_integrations(db, company_id, event_type)
    results = {"dispatched": 0, "failed": 0}

    for integration in integrations:
        success = await _send_webhook(db, integration, event_type, payload, secret)
        if success:
            results["dispatched"] += 1
        else:
            results["failed"] += 1

    return results


async def _send_webhook(
    db: AsyncSession,
    integration: Integration,
    event_type: str,
    payload: Dict[str, Any],
    secret: Optional[str],
) -> bool:
    if not integration.endpoint_url:
        return False

    # Merge payload template with actual payload
    full_payload = {**(integration.payload_template or {}), **payload, "event": event_type}
    body = json.dumps(full_payload, default=str)

    headers = {
        "Content-Type": "application/json",
        "X-SME-Event": event_type,
        "X-SME-Timestamp": datetime.utcnow().isoformat(),
        **(integration.headers or {}),
    }

    # HMAC signature if secret configured
    if secret:
        sig = hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()
        headers["X-SME-Signature"] = f"sha256={sig}"

    status_code = None
    response_body = None
    success = False

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(integration.endpoint_url, content=body, headers=headers)
            status_code = resp.status_code
            response_body = resp.text[:2000]
            success = 200 <= status_code < 300

        # Update integration state
        integration.last_triggered_at = datetime.utcnow()
        if success:
            integration.retry_count = 0
            integration.last_error = None
            integration.status = IntegrationStatus.ACTIVE
        else:
            integration.retry_count = (integration.retry_count or 0) + 1
            integration.last_error = f"HTTP {status_code}: {response_body}"
            if integration.retry_count >= 5:
                integration.status = IntegrationStatus.ERROR

    except Exception as exc:
        logger.exception("Webhook dispatch failed for integration %s", integration.id)
        integration.last_error = str(exc)
        integration.retry_count = (integration.retry_count or 0) + 1
        if integration.retry_count >= 5:
            integration.status = IntegrationStatus.ERROR

    # Persist log
    log = IntegrationLog(
        integration_id=integration.id,
        event_type=event_type,
        payload=full_payload,
        response_status=status_code,
        response_body=response_body,
        success=success,
    )
    db.add(log)
    await db.commit()
    return success


def verify_incoming_signature(raw_body: bytes, signature_header: str, secret: str) -> bool:
    """Verify an incoming webhook's HMAC-SHA256 signature."""
    if not signature_header.startswith("sha256="):
        return False
    expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    provided = signature_header[len("sha256="):]
    return hmac.compare_digest(expected, provided)
