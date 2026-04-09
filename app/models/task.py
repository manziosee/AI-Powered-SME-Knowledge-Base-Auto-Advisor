import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from app.db.base import BaseModel


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    STARTED = "started"
    PROGRESS = "progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskPriority(str, enum.Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


class BackgroundTask(BaseModel):
    __tablename__ = "background_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Task identification
    task_id = Column(String(255), unique=True, nullable=False, index=True)  # Celery task ID
    task_name = Column(String(255), nullable=False)  # e.g., "process_document", "send_notification"
    
    # Status
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING, index=True)
    priority = Column(SQLEnum(TaskPriority), default=TaskPriority.NORMAL)
    
    # Progress tracking
    progress = Column(Integer, default=0)  # 0-100
    progress_message = Column(Text, nullable=True)
    
    # Input/Output
    input_data = Column(JSONB, nullable=True)  # Task input parameters
    result_data = Column(JSONB, nullable=True)  # Task result
    error_message = Column(Text, nullable=True)
    error_traceback = Column(Text, nullable=True)
    
    # Ownership
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Timing
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    estimated_completion = Column(DateTime, nullable=True)
    
    # Retry info
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    
    # Metadata
    metadata = Column(JSONB, nullable=True)  # Additional task-specific data
    
    # Relationships
    company = relationship("Company", back_populates="background_tasks")
    user = relationship("User")


class TaskDependency(BaseModel):
    """Track dependencies between tasks"""
    __tablename__ = "task_dependencies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("background_tasks.id"), nullable=False)
    depends_on_task_id = Column(UUID(as_uuid=True), ForeignKey("background_tasks.id"), nullable=False)
    
    dependency_type = Column(String(50), default="blocking")  # blocking, waiting
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    task = relationship("BackgroundTask", foreign_keys=[task_id])
    depends_on = relationship("BackgroundTask", foreign_keys=[depends_on_task_id])


class ScheduledTask(BaseModel):
    """For scheduled/cron tasks"""
    __tablename__ = "scheduled_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    
    # Schedule (cron-like)
    cron_expression = Column(String(100), nullable=True)
    interval_seconds = Column(Integer, nullable=True)  # For simple intervals
    
    # Task details
    task_name = Column(String(255), nullable=False)
    task_params = Column(JSONB, nullable=True)
    
    # Status
    is_active = Column(Integer, default=1)
    last_run_at = Column(DateTime, nullable=True)
    next_run_at = Column(DateTime, nullable=True)
    run_count = Column(Integer, default=0)
    failure_count = Column(Integer, default=0)
    
    # Configuration
    timeout_seconds = Column(Integer, default=3600)
    retry_on_failure = Column(Integer, default=True)
    max_retries = Column(Integer, default=3)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)