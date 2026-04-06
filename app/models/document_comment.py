"""DocumentComment — threaded comments on documents for team collaboration."""

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.core.database import Base


class DocumentComment(Base):
    __tablename__ = "document_comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("document_comments.id"), nullable=True)  # thread support
    content = Column(Text, nullable=False)
    is_edited = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    document = relationship("Document", back_populates="comments")
    replies = relationship("DocumentComment", backref="parent", remote_side=[id])
