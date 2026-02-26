from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from datetime import datetime
import uuid
import enum
from app.core.database import Base


class KnowledgeType(str, enum.Enum):
    OBLIGATION = "obligation"
    DEADLINE = "deadline"
    RISK = "risk"
    METRIC = "metric"
    RECOMMENDATION = "recommendation"
    INSIGHT = "insight"


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class KnowledgeEntry(Base):
    __tablename__ = "knowledge_entries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=True)
    knowledge_type = Column(SQLEnum(KnowledgeType), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    risk_level = Column(SQLEnum(RiskLevel), nullable=True)
    deadline = Column(DateTime, nullable=True)
    metadata = Column(JSON, default={})
    tags = Column(JSON, default=[])
    embedding = Column(Vector(1536), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    company = relationship("Company", back_populates="knowledge_entries")
    document = relationship("Document", back_populates="knowledge_entries")
