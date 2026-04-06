"""ShareLink — time-limited, optionally password-protected document share URLs."""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.core.database import Base


class ShareLink(Base):
    __tablename__ = "share_links"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String, unique=True, nullable=False, index=True)   # random URL-safe token
    password_hash = Column(String, nullable=True)                      # optional protection
    expires_at = Column(DateTime, nullable=True)                       # None = no expiry
    max_views = Column(Integer, nullable=True)                         # None = unlimited
    view_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="share_links")
