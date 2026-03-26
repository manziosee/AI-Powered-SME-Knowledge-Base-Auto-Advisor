from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON, Enum as SQLEnum, Integer
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum
from app.core.database import Base


class ReportType(str, enum.Enum):
    COMPLIANCE_OVERVIEW = "compliance_overview"
    RISK_DISTRIBUTION = "risk_distribution"
    DOCUMENT_SUMMARY = "document_summary"
    KNOWLEDGE_AUDIT = "knowledge_audit"
    FULL_DASHBOARD = "full_dashboard"


class ReportFormat(str, enum.Enum):
    PDF = "pdf"
    EXCEL = "excel"
    JSON = "json"


class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    GENERATING = "generating"
    READY = "ready"
    FAILED = "failed"


class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    requested_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    report_type = Column(SQLEnum(ReportType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    report_format = Column(SQLEnum(ReportFormat, values_callable=lambda x: [e.value for e in x]), nullable=False)
    status = Column(SQLEnum(ReportStatus, values_callable=lambda x: [e.value for e in x]), default=ReportStatus.PENDING)
    file_path = Column(String, nullable=True)           # S3 key after generation
    filters = Column(JSON, default={})                  # date range, doc types, etc.
    row_count = Column(Integer, nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=True)        # auto-delete after TTL
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
