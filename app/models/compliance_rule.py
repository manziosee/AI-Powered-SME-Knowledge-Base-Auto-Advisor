from sqlalchemy import Column, String, DateTime, Text, JSON, Boolean, Enum as SQLEnum, Integer
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum
from app.core.database import Base


class RuleCategory(str, enum.Enum):
    TAX = "tax"
    LABOR = "labor"
    ENVIRONMENTAL = "environmental"
    FINANCIAL = "financial"
    DATA_PRIVACY = "data_privacy"
    HEALTH_SAFETY = "health_safety"
    CORPORATE = "corporate"
    OTHER = "other"


class RuleSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class ComplianceRule(Base):
    __tablename__ = "compliance_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    country_code = Column(String(10), nullable=False, index=True)  # ISO 3166-1 alpha-2
    language_code = Column(String(10), default="en")
    category = Column(SQLEnum(RuleCategory), nullable=False, index=True)
    severity = Column(SQLEnum(RuleSeverity), default=RuleSeverity.WARNING)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    legal_reference = Column(String, nullable=True)
    deadline_pattern = Column(String, nullable=True)   # cron-like pattern e.g. "monthly", "annual-Q1"
    affected_industries = Column(JSON, default=[])      # list of industry strings, [] = all
    keywords = Column(JSON, default=[])                 # trigger keywords for matching
    action_required = Column(Text, nullable=True)
    penalty_description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)