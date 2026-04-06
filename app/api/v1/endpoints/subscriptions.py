"""
Subscription & Billing endpoints.

GET    /subscriptions/me              — get current company's subscription
POST   /subscriptions/checkout        — create Stripe checkout session
POST   /subscriptions/portal          — create Stripe customer portal session
POST   /subscriptions/webhook         — Stripe webhook receiver
GET    /subscriptions/plans           — list available plans + pricing
PUT    /subscriptions/me/cancel       — cancel subscription at period end
"""

import json
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_active_user, require_role
from app.core.config import settings
from app.core.database import get_db
from app.models.subscription import Subscription, PlanTier, BillingCycle, SubscriptionStatus
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# Plan definitions (can be moved to DB or config)
# ---------------------------------------------------------------------------

PLANS = {
    PlanTier.FREE: {
        "name": "Free",
        "price_monthly_usd": 0,
        "price_annual_usd": 0,
        "max_documents": 10,
        "max_users": 3,
        "max_ai_queries": 50,
        "features": ["Document upload", "Basic compliance check", "AI Advisor (50 queries/mo)"],
    },
    PlanTier.STARTER: {
        "name": "Starter",
        "price_monthly_usd": 29,
        "price_annual_usd": 290,
        "max_documents": 100,
        "max_users": 10,
        "max_ai_queries": 500,
        "features": ["All Free features", "Scheduled reports", "Document sharing", "API keys"],
    },
    PlanTier.PROFESSIONAL: {
        "name": "Professional",
        "price_monthly_usd": 79,
        "price_annual_usd": 790,
        "max_documents": 1000,
        "max_users": 50,
        "max_ai_queries": 2000,
        "features": ["All Starter features", "E-signatures", "Team collaboration", "Priority support"],
    },
    PlanTier.ENTERPRISE: {
        "name": "Enterprise",
        "price_monthly_usd": 0,   # custom pricing
        "price_annual_usd": 0,
        "max_documents": -1,      # unlimited
        "max_users": -1,
        "max_ai_queries": -1,
        "features": ["All Professional features", "Custom integrations", "Dedicated SLA", "SAML SSO"],
    },
}


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class CheckoutRequest(BaseModel):
    plan: PlanTier
    billing_cycle: BillingCycle = BillingCycle.MONTHLY
    success_url: str
    cancel_url: str


class StripePortalRequest(BaseModel):
    return_url: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/plans",
    summary="List available subscription plans",
    description="Returns all plan tiers with pricing and feature lists.",
)
async def list_plans():
    return [
        {"tier": tier.value, **info}
        for tier, info in PLANS.items()
    ]


@router.get(
    "/me",
    summary="Get current subscription",
    description="Returns the current company's active subscription details.",
)
async def get_subscription(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not current_user.company_id:
        return {"plan": "free", "status": "active", "company_id": None}

    result = await db.execute(
        select(Subscription).where(Subscription.company_id == current_user.company_id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        # Auto-create free tier for company
        sub = Subscription(company_id=current_user.company_id)
        db.add(sub)
        await db.commit()
        await db.refresh(sub)

    return {
        "id": str(sub.id),
        "plan": sub.plan.value,
        "status": sub.status.value,
        "billing_cycle": sub.billing_cycle.value,
        "max_documents": sub.max_documents,
        "max_users": sub.max_users,
        "max_ai_queries_per_month": sub.max_ai_queries_per_month,
        "ai_queries_used": sub.ai_queries_used,
        "trial_ends_at": sub.trial_ends_at,
        "current_period_end": sub.current_period_end,
        "canceled_at": sub.canceled_at,
        "stripe_customer_id": sub.stripe_customer_id,
    }


@router.post(
    "/checkout",
    summary="Create Stripe checkout session",
    description=(
        "Creates a Stripe Checkout Session for upgrading to a paid plan. "
        "Returns a `checkout_url` to redirect the user to. "
        "Requires `STRIPE_SECRET_KEY` to be configured."
    ),
)
async def create_checkout(
    payload: CheckoutRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    _require_stripe()

    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY

    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company")

    result = await db.execute(
        select(Subscription).where(Subscription.company_id == current_user.company_id)
    )
    sub = result.scalar_one_or_none()

    customer_id = sub.stripe_customer_id if sub else None
    if not customer_id:
        customer = stripe.Customer.create(
            email=current_user.email,
            name=current_user.full_name,
            metadata={"company_id": str(current_user.company_id)},
        )
        customer_id = customer.id
        if sub:
            sub.stripe_customer_id = customer_id
            await db.commit()

    plan_info = PLANS[payload.plan]
    price_usd = plan_info["price_annual_usd"] if payload.billing_cycle == BillingCycle.ANNUAL else plan_info["price_monthly_usd"]
    if price_usd == 0:
        raise HTTPException(status_code=400, detail="Cannot checkout free or enterprise (contact sales) plans")

    session = stripe.checkout.Session.create(
        customer=customer_id,
        mode="subscription",
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {"name": f"AdvisorAI {plan_info['name']}"},
                "unit_amount": price_usd * 100,
                "recurring": {
                    "interval": "year" if payload.billing_cycle == BillingCycle.ANNUAL else "month"
                },
            },
            "quantity": 1,
        }],
        success_url=payload.success_url,
        cancel_url=payload.cancel_url,
        metadata={
            "company_id": str(current_user.company_id),
            "plan": payload.plan.value,
            "billing_cycle": payload.billing_cycle.value,
        },
    )
    return {"checkout_url": session.url, "session_id": session.id}


@router.post(
    "/portal",
    summary="Create Stripe customer portal session",
    description="Returns a link to the Stripe billing portal where the customer can manage payment methods and invoices.",
)
async def create_portal(
    payload: StripePortalRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    _require_stripe()
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY

    result = await db.execute(
        select(Subscription).where(Subscription.company_id == current_user.company_id)
    )
    sub = result.scalar_one_or_none()
    if not sub or not sub.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No Stripe customer found. Upgrade to a paid plan first.")

    session = stripe.billing_portal.Session.create(
        customer=sub.stripe_customer_id,
        return_url=payload.return_url,
    )
    return {"portal_url": session.url}


@router.post(
    "/webhook",
    include_in_schema=False,  # Stripe webhook — not exposed in Swagger
    summary="Stripe webhook receiver",
)
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    _require_stripe()
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY

    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    webhook_secret = getattr(settings, "STRIPE_WEBHOOK_SECRET", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig, webhook_secret)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    await _handle_stripe_event(event, db)
    return {"status": "ok"}


@router.put(
    "/me/cancel",
    summary="Cancel subscription",
    description="Marks the subscription to cancel at the end of the current billing period.",
)
async def cancel_subscription(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Subscription).where(Subscription.company_id == current_user.company_id)
    )
    sub = result.scalar_one_or_none()
    if not sub or sub.plan == PlanTier.FREE:
        raise HTTPException(status_code=400, detail="No paid subscription to cancel")

    if sub.stripe_subscription_id:
        try:
            _require_stripe()
            import stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY
            stripe.Subscription.modify(sub.stripe_subscription_id, cancel_at_period_end=True)
        except Exception as exc:
            logger.warning("Stripe cancel failed: %s", exc)

    sub.canceled_at = datetime.utcnow()
    await db.commit()
    return {"status": "scheduled_for_cancellation", "canceled_at": sub.canceled_at}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _require_stripe():
    try:
        import stripe  # noqa: F401
        if not getattr(settings, "STRIPE_SECRET_KEY", ""):
            raise HTTPException(status_code=501, detail="Stripe not configured — set STRIPE_SECRET_KEY")
    except ImportError:
        raise HTTPException(status_code=501, detail="Stripe not installed — pip install stripe")


async def _handle_stripe_event(event: dict, db: AsyncSession):
    evt_type = event.get("type", "")
    data = event.get("data", {}).get("object", {})
    meta = data.get("metadata", {})
    company_id = meta.get("company_id")

    if not company_id:
        return

    result = await db.execute(
        select(Subscription).where(Subscription.company_id == company_id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        return

    if evt_type == "checkout.session.completed":
        sub.plan = PlanTier(meta.get("plan", "starter"))
        sub.billing_cycle = BillingCycle(meta.get("billing_cycle", "monthly"))
        sub.status = SubscriptionStatus.ACTIVE
        sub.stripe_subscription_id = data.get("subscription")
        plan_info = PLANS.get(sub.plan, {})
        sub.max_documents = plan_info.get("max_documents", 100)
        sub.max_users = plan_info.get("max_users", 10)
        sub.max_ai_queries_per_month = plan_info.get("max_ai_queries", 500)

    elif evt_type in ("invoice.payment_failed",):
        sub.status = SubscriptionStatus.PAST_DUE

    elif evt_type in ("customer.subscription.deleted",):
        sub.plan = PlanTier.FREE
        sub.status = SubscriptionStatus.CANCELED
        sub.max_documents = PLANS[PlanTier.FREE]["max_documents"]
        sub.max_users = PLANS[PlanTier.FREE]["max_users"]
        sub.max_ai_queries_per_month = PLANS[PlanTier.FREE]["max_ai_queries"]

    await db.commit()
