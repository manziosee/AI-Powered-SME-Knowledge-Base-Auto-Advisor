"""
ModelVersion — tracks every trained model artefact.

Each row represents one trained model file stored in /app/models/.
Admins can promote a version to "active" which makes the system use it.
"""

from sqlalchemy import (
    Column, String, DateTime, Float, Integer,
    Boolean, Text, JSON, Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum
from app.core.database import Base


class ModelType(str, enum.Enum):
    DOCUMENT_CLASSIFIER = "document_classifier"
    RISK_SCORER         = "risk_scorer"


class TrainingStatus(str, enum.Enum):
    QUEUED     = "queued"
    RUNNING    = "running"
    COMPLETED  = "completed"
    FAILED     = "failed"


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_type       = Column(SQLEnum(ModelType),      nullable=False, index=True)
    version          = Column(String(20),              nullable=False)  # e.g. "1.0.0"
    status           = Column(SQLEnum(TrainingStatus), default=TrainingStatus.QUEUED)
    is_active        = Column(Boolean, default=False)  # currently used by the system

    # Training metadata
    company_id       = Column(UUID(as_uuid=True), nullable=True)   # None = global model
    sample_count     = Column(Integer,  nullable=True)
    accuracy         = Column(Float,    nullable=True)
    cv_accuracy      = Column(Float,    nullable=True)
    training_stats   = Column(JSON,     default={})
    classes          = Column(JSON,     default=[])    # label list

    # File location
    file_path        = Column(String,   nullable=True)  # e.g. /app/models/doc_clf_v1.0.0.pkl

    # Audit
    trained_by       = Column(UUID(as_uuid=True), nullable=True)   # user who triggered
    error_message    = Column(Text,  nullable=True)
    created_at       = Column(DateTime, default=datetime.utcnow)
    completed_at     = Column(DateTime, nullable=True)
    notes            = Column(Text,  nullable=True)
