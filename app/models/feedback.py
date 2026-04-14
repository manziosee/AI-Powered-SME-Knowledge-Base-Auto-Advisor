import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey, Float, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class AIResponseFeedback(Base):
    """Track feedback on AI responses for continuous improvement"""
    __tablename__ = "ai_response_feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=True)
    message_id = Column(UUID(as_uuid=True), ForeignKey("chat_messages.id"), nullable=True)
    
    response_text = Column(Text, nullable=True)
    response_metadata = Column(JSONB, nullable=True)
    
    is_helpful = Column(Boolean, nullable=True)
    rating = Column(Integer, nullable=True)
    feedback_type = Column(String(50), nullable=True)
    
    comment = Column(Text, nullable=True)
    suggested_improvement = Column(Text, nullable=True)
    
    highlighted_text = Column(Text, nullable=True)
    issue_category = Column(String(100), nullable=True)
    
    query_text = Column(Text, nullable=True)
    sources_used = Column(JSONB, nullable=True)
    
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    is_resolved = Column(Boolean, default=False)
    reviewed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    admin_notes = Column(Text, nullable=True)
    
    company = relationship("Company")
    user = relationship("User", foreign_keys=[user_id])
    conversation = relationship("Conversation")
    message = relationship("ChatMessage")
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])


class FeedbackSummary(Base):
    """Aggregated feedback metrics"""
    __tablename__ = "feedback_summaries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=True)
    model_name = Column(String(100), nullable=True)
    
    total_responses = Column(Integer, default=0)
    total_feedback_count = Column(Integer, default=0)
    helpful_count = Column(Integer, default=0)
    not_helpful_count = Column(Integer, default=0)
    average_rating = Column(Float, nullable=True)
    
    accuracy_issues = Column(Integer, default=0)
    relevance_issues = Column(Integer, default=0)
    clarity_issues = Column(Integer, default=0)
    completeness_issues = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    company = relationship("Company")


class FeedbackNotification(Base):
    """Notifications for important feedback"""
    __tablename__ = "feedback_notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    feedback_id = Column(UUID(as_uuid=True), ForeignKey("ai_response_feedback.id"), nullable=False)
    notify_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    message = Column(Text, nullable=False)
    priority = Column(String(20), default="normal")
    
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    feedback = relationship("AIResponseFeedback")
    user = relationship("User")