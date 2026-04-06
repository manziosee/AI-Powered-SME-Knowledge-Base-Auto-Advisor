"""API Key model — lets external clients authenticate with X-API-Key instead of JWT."""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.core.database import Base


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)                         # human label, e.g. "CI Pipeline"
    key_hash = Column(String, unique=True, nullable=False)        # SHA-256 hash of the raw key
    key_prefix = Column(String, nullable=False)                   # first 8 chars shown in UI
    scopes = Column(JSON, default=["read"])                       # ["read", "write", "admin"]
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)                  # None = never expires
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="api_keys")
