from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from datetime import datetime
import uuid
import enum
from app.core.database import Base


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"
    INDIVIDUAL = "individual"


class AccountType(str, enum.Enum):
    COMPANY = "company"
    INDIVIDUAL = "individual"


# All available permissions
ALL_PERMISSIONS = [
    "can_view_ai_training",
    "can_train_model",
    "can_view_documents",
    "can_upload_documents",
    "can_receive_alerts",
    "can_manage_users",
    "can_view_analytics",
    "can_view_compliance",
    "can_manage_company",
]

# Default permissions per role
DEFAULT_PERMISSIONS: dict[str, list[str]] = {
    "super_admin": ALL_PERMISSIONS,
    "admin": [
        "can_view_ai_training", "can_train_model", "can_view_documents",
        "can_upload_documents", "can_receive_alerts", "can_manage_users",
        "can_view_analytics", "can_view_compliance", "can_manage_company",
    ],
    "manager": [
        "can_view_documents", "can_upload_documents", "can_receive_alerts",
        "can_view_analytics", "can_view_compliance",
    ],
    "employee": [
        "can_view_documents", "can_receive_alerts", "can_view_compliance",
    ],
    "individual": [
        "can_view_documents", "can_upload_documents", "can_receive_alerts",
        "can_view_compliance",
    ],
}


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole, values_callable=lambda x: [e.value for e in x]), default=UserRole.EMPLOYEE, nullable=False)
    account_type = Column(SQLEnum(AccountType, values_callable=lambda x: [e.value for e in x]), default=AccountType.COMPANY, nullable=False)
    permissions = Column(ARRAY(String), default=list, nullable=False, server_default="{}")
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # 2FA / TOTP
    otp_secret = Column(String, nullable=True)
    otp_enabled = Column(Boolean, default=False)

    company = relationship("Company", back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    api_keys = relationship("ApiKey", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    team_memberships = relationship("TeamMember", back_populates="user", cascade="all, delete-orphan")

    def has_permission(self, permission: str) -> bool:
        """Check if user has a specific permission (role-based OR explicit)."""
        perms = self.permissions or []
        return permission in perms
