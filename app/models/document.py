from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Enum as SQLEnum, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from datetime import datetime
import uuid
import enum
from app.core.database import Base


class DocumentType(str, enum.Enum):
    CONTRACT = "contract"
    INVOICE = "invoice"
    POLICY = "policy"
    REPORT = "report"
    TAX_DOCUMENT = "tax_document"
    HR_DOCUMENT = "hr_document"
    COMPLIANCE = "compliance"
    OTHER = "other"


class DocumentStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"


class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String, nullable=False)
    document_type = Column(SQLEnum(DocumentType), default=DocumentType.OTHER)
    status = Column(SQLEnum(DocumentStatus), default=DocumentStatus.UPLOADED)
    version = Column(Integer, default=1)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    extracted_text = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    metadata = Column(JSON, default={})
    tags = Column(JSON, default=[])
    embedding = Column(Vector(1536), nullable=True)
    uploaded_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    
    company = relationship("Company", back_populates="documents")
    knowledge_entries = relationship("KnowledgeEntry", back_populates="document", cascade="all, delete-orphan")
    versions = relationship("Document", backref="parent", remote_side=[id])
