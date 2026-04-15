import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class WebhookEvent(str, enum.Enum):
    DOCUMENT_UPLOADED = "document.uploaded"
    DOCUMENT_PROCESSED = "document.processed"
    DOCUMENT_FAILED = "document.failed"
    USER_CREATED = "user.created"
    USER_LOGIN = "user.login"
    COMPLIANCE_ALERT = "compliance.alert"
    EXPIRY_WARNING = "expiry.warning"
    CHAT_MESSAGE = "chat.message"


class WebhookStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    FAILED = "failed"


class WebhookDeliveryStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    RETRYING = "retrying"


class Webhook(Base):
    __tablename__ = "webhooks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    name = Column(String(255), nullable=False)
    url = Column(Text, nullable=False)
    secret = Column(String(255), nullable=True)
    events = Column(JSONB, default=list)  # List of WebhookEvent
    status = Column(SQLEnum(WebhookStatus), default=WebhookStatus.ACTIVE)
    is_active = Column(Boolean, default=True)
    
    # Retry configuration
    max_retries = Column(Integer, default=3)
    timeout_seconds = Column(Integer, default=30)
    
    # Metadata
    description = Column(Text, nullable=True)
    last_triggered_at = Column(DateTime, nullable=True)
    last_failed_at = Column(DateTime, nullable=True)
    
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    company = relationship("Company", back_populates="webhooks")
    created_by = relationship("User")
    deliveries = relationship("WebhookDelivery", back_populates="webhook", cascade="all, delete-orphan")


class WebhookDelivery(Base):
    __tablename__ = "webhook_deliveries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    webhook_id = Column(UUID(as_uuid=True), ForeignKey("webhooks.id"), nullable=False)
    event = Column(SQLEnum(WebhookEvent), nullable=False)
    payload = Column(JSONB, nullable=False)
    status = Column(SQLEnum(WebhookDeliveryStatus), default=WebhookDeliveryStatus.PENDING)
    
    # Response details
    response_status_code = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Retry tracking
    attempt = Column(Integer, default=0)
    next_retry_at = Column(DateTime, nullable=True)
    
    # Timing
    created_at = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    webhook = relationship("Webhook", back_populates="deliveries")


class WebhookLog(Base):
    __tablename__ = "webhook_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    delivery_id = Column(UUID(as_uuid=True), ForeignKey("webhook_deliveries.id"), nullable=True)
    event = Column(SQLEnum(WebhookEvent), nullable=False)
    payload = Column(JSONB, nullable=False)
    response_status = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    delivery = relationship("WebhookDelivery")