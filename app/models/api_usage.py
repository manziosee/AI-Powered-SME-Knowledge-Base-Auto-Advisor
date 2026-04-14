import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, DateTime, Integer, BigInteger, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class APIUsage(BaseModel):
    __tablename__ = "api_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # API details
    endpoint = Column(String(255), nullable=False)  # e.g., "/api/v1/chat", "/api/v1/documents"
    method = Column(String(10), nullable=False)  # GET, POST, PUT, DELETE
    status_code = Column(Integer, nullable=True)
    
    # Usage metrics
    tokens_used = Column(Integer, default=0)
    tokens_limit = Column(Integer, nullable=True)
    tokens_remaining = Column(Integer, nullable=True)
    latency_ms = Column(Integer, nullable=True)  # Response time in milliseconds
    
    # Metadata
    ip_address = Column(String(45), nullable=True)  # Support IPv6
    user_agent = Column(String(512), nullable=True)
    request_id = Column(String(255), nullable=True)  # For tracing
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="api_usage")
    user = relationship("User")


class APISubscriptionPlan(BaseModel):
    __tablename__ = "api_subscription_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    # Plan limits
    name = Column(String(100), nullable=False)  # e.g., "Free", "Pro", "Enterprise"
    monthly_requests_limit = Column(BigInteger, nullable=True)  # -1 for unlimited
    monthly_tokens_limit = Column(BigInteger, nullable=True)  # -1 for unlimited
    daily_requests_limit = Column(BigInteger, nullable=True)
    daily_tokens_limit = Column(BigInteger, nullable=True)
    
    # Features
    rate_limit_per_minute = Column(Integer, default=60)
    max_file_size_mb = Column(Integer, default=50)
    allow_webhooks = Column(Boolean, default=False)
    allow_api_access = Column(Boolean, default=True)
    
    # Current period
    current_period_start = Column(DateTime, nullable=False)
    current_period_end = Column(DateTime, nullable=False)
    
    # Usage tracking
    requests_used_this_month = Column(BigInteger, default=0)
    tokens_used_this_month = Column(BigInteger, default=0)
    requests_used_today = Column(BigInteger, default=0)
    tokens_used_today = Column(BigInteger, default=0)
    
    # Status
    is_active = Column(Integer, default=1)  # 1=active, 0=inactive
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    company = relationship("Company", back_populates="api_subscription_plan")


class RateLimitOverride(BaseModel):
    __tablename__ = "rate_limit_overrides"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    endpoint = Column(String(255), nullable=False)  # Specific endpoint or wildcard
    
    # Override limits (null means use default)
    requests_per_minute = Column(Integer, nullable=True)
    requests_per_hour = Column(Integer, nullable=True)
    requests_per_day = Column(Integer, nullable=True)
    
    # Status
    is_active = Column(Integer, default=1)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    company = relationship("Company")
    created_by = relationship("User")