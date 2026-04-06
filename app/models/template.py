"""DocumentTemplate — pre-built document templates by industry and country."""

from sqlalchemy import Column, String, Text, DateTime, Boolean, JSON, Integer, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum
from app.core.database import Base


class TemplateCategory(str, enum.Enum):
    CONTRACT = "contract"
    HR = "hr"
    TAX = "tax"
    COMPLIANCE = "compliance"
    FINANCIAL = "financial"
    LEGAL = "legal"
    OTHER = "other"


class Template(Base):
    __tablename__ = "templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(
        SQLEnum(TemplateCategory, values_callable=lambda x: [e.value for e in x]),
        default=TemplateCategory.OTHER,
    )
    country_code = Column(String, nullable=True)          # ISO 3166-1, None = global
    industry = Column(String, nullable=True)              # None = all industries
    content = Column(Text, nullable=False)                # Markdown / rich text body with {{placeholders}}
    fields = Column(JSON, default=[])                     # [{"key": "party_name", "label": "Party Name", "type": "text"}]
    tags = Column(JSON, default=[])
    is_public = Column(Boolean, default=True)             # False = company-specific
    company_id = Column(UUID(as_uuid=True), nullable=True)  # None = platform template
    created_by = Column(UUID(as_uuid=True), nullable=True)
    is_active = Column(Boolean, default=True)
    usage_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
