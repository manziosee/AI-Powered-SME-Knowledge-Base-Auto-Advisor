import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, DateTime, Integer, Boolean, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from app.db.base import BaseModel


class InvitationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class InvitationRole(str, enum.Enum):
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"
    EDITOR = "editor"


class TeamInvitation(BaseModel):
    """Team invitation system - invite members via email with roles"""
    __tablename__ = "team_invitations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Invitation details
    email = Column(String(255), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    # Role and permissions
    role = Column(SQLEnum(InvitationRole), default=InvitationRole.MEMBER)
    permissions = Column(JSONB, nullable=True)  # Custom permissions for the role
    
    # Status
    status = Column(SQLEnum(InvitationStatus), default=InvitationStatus.PENDING)
    
    # Token for invitation
    token = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    
    # Inviter
    invited_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Invitee (when accepted)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    accepted_at = Column(DateTime, nullable=True)
    
    # Message
    message = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="team_invitations")
    invited_by = relationship("User", foreign_keys=[invited_by_id])
    user = relationship("User", foreign_keys=[user_id])


class TeamMember(BaseModel):
    """Team members with roles"""
    __tablename__ = "team_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    role = Column(SQLEnum(InvitationRole), default=InvitationRole.MEMBER)
    permissions = Column(JSONB, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_owner = Column(Boolean, default=False)  # Company owner
    
    # Activity
    last_active_at = Column(DateTime, nullable=True)
    login_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="team_memberships")
    company = relationship("Company", back_populates="team_members")

    # Unique constraint
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )


class DocumentTag(BaseModel):
    """Document tagging system"""
    __tablename__ = "document_tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), nullable=False, unique=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    # Styling
    color = Column(String(7), default="#6366f1")  # Hex color
    icon = Column(String(50), nullable=True)  # Icon name
    
    # Usage
    document_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    company = relationship("Company", back_populates="document_tags")
    created_by = relationship("User")


class DocumentTagAssignment(BaseModel):
    """Many-to-many relationship between documents and tags"""
    __tablename__ = "document_tag_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("document_tags.id"), nullable=False)
    assigned_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    assigned_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document")
    tag = relationship("DocumentTag")
    assigned_by = relationship("User")


class ScheduledReport(BaseModel):
    """Scheduled reports - auto-generate and email reports"""
    __tablename__ = "scheduled_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    # Report config
    name = Column(String(255), nullable=False)
    report_type = Column(String(50), nullable=False)  # "analytics", "compliance", "documents", "usage"
    
    # Schedule
    frequency = Column(String(20), nullable=False)  # "daily", "weekly", "monthly"
    day_of_week = Column(Integer, nullable=True)  # 0-6 for weekly
    day_of_month = Column(Integer, nullable=True)  # 1-31 for monthly
    hour = Column(Integer, default=9)  # Hour of day (0-23)
    timezone = Column(String(50), default="UTC")
    
    # Recipients
    recipients = Column(JSONB, nullable=False)  # List of email addresses
    
    # Filter options
    filters = Column(JSONB, nullable=True)  # Report-specific filters
    
    # Status
    is_active = Column(Boolean, default=True)
    last_run_at = Column(DateTime, nullable=True)
    next_run_at = Column(DateTime, nullable=True)
    run_count = Column(Integer, default=0)
    failure_count = Column(Integer, default=0)
    last_error = Column(Text, nullable=True)
    
    # Output format
    format = Column(String(20), default="pdf")  # "pdf", "csv", "excel"
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    company = relationship("Company")
    created_by = relationship("User")


class ActivityLog(BaseModel):
    """Activity feed - track recent user actions"""
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Activity details
    action = Column(String(100), nullable=False)  # "document_uploaded", "user_invited", etc.
    resource_type = Column(String(50), nullable=True)  # "document", "user", "company"
    resource_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Description
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    metadata = Column(JSONB, nullable=True)
    
    # IP/Location
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    company = relationship("Company")
    user = relationship("User")


class BulkOperation(BaseModel):
    """Track bulk operations on documents"""
    __tablename__ = "bulk_operations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Operation details
    operation_type = Column(String(50), nullable=False)  # "delete", "move", "archive", "tag", "untag"
    
    # Target documents
    document_ids = Column(JSONB, nullable=False)  # List of document IDs
    
    # Parameters for the operation
    parameters = Column(JSONB, nullable=True)  # e.g., destination folder, tags to add
    
    # Status
    status = Column(String(20), default="pending")  # "pending", "processing", "completed", "failed"
    processed_count = Column(Integer, default=0)
    total_count = Column(Integer, nullable=False)
    failed_count = Column(Integer, default=0)
    
    # Errors
    errors = Column(JSONB, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    company = relationship("Company")
    user = relationship("User")


class OnlineUser(BaseModel):
    """Track online users for real-time indicators"""
    __tablename__ = "online_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    # Current page/resource
    current_page = Column(String(255), nullable=True)
    resource_id = Column(UUID(as_uuid=True), nullable=True)
    resource_type = Column(String(50), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    last_heartbeat = Column(DateTime, default=datetime.utcnow)
    session_id = Column(String(255), nullable=True)
    
    # Connection info
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")
    company = relationship("Company")