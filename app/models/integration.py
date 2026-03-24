from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON, Boolean, Enum as SQLEnum, Integer
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum
from app.core.database import Base


class IntegrationType(str, enum.Enum):
    WEBHOOK = "webhook"
    ACCOUNTING = "accounting"
    HR_SYSTEM = "hr_system"
    ERP = "erp"
    CRM = "crm"
    CUSTOM = "custom"


class IntegrationStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    PENDING = "pending"


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    integration_type = Column(SQLEnum(IntegrationType), nullable=False)
    status = Column(SQLEnum(IntegrationStatus), default=IntegrationStatus.PENDING)
    endpoint_url = Column(String, nullable=True)        # webhook URL or API base URL
    api_key_encrypted = Column(Text, nullable=True)     # stored encrypted
    headers = Column(JSON, default={})
    payload_template = Column(JSON, default={})         # template for outgoing payloads
    event_triggers = Column(JSON, default=[])           # events that fire this integration
    last_triggered_at = Column(DateTime, nullable=True)
    last_error = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class IntegrationLog(Base):
    __tablename__ = "integration_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    integration_id = Column(UUID(as_uuid=True), ForeignKey("integrations.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String, nullable=False)
    payload = Column(JSON, default={})
    response_status = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    success = Column(Boolean, nullable=False)
    triggered_at = Column(DateTime, default=datetime.utcnow)
