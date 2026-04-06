"""Subscription — Stripe-backed billing plans per company."""

from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float, JSON, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum
from app.core.database import Base


class PlanTier(str, enum.Enum):
    FREE = "free"
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


class BillingCycle(str, enum.Enum):
    MONTHLY = "monthly"
    ANNUAL = "annual"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    TRIALING = "trialing"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    UNPAID = "unpaid"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, unique=True, index=True)
    plan = Column(SQLEnum(PlanTier, values_callable=lambda x: [e.value for e in x]), default=PlanTier.FREE)
    status = Column(SQLEnum(SubscriptionStatus, values_callable=lambda x: [e.value for e in x]), default=SubscriptionStatus.ACTIVE)
    billing_cycle = Column(SQLEnum(BillingCycle, values_callable=lambda x: [e.value for e in x]), default=BillingCycle.MONTHLY)

    # Stripe identifiers
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    stripe_price_id = Column(String, nullable=True)

    # Limits per plan
    max_documents = Column(Integer, default=10)
    max_users = Column(Integer, default=3)
    max_ai_queries_per_month = Column(Integer, default=50)

    # Billing dates
    trial_ends_at = Column(DateTime, nullable=True)
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    canceled_at = Column(DateTime, nullable=True)

    # Usage this period
    ai_queries_used = Column(Integer, default=0)
    extra_meta = Column(JSON, default={})

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
