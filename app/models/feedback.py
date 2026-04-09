import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey, Float, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.db.base import BaseModel


class AIResponseFeedback(BaseModel):
    """Track feedback on AI responses for continuous improvement"""
    __tablename__ = "ai_response_feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Reference to the conversation/response
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=True)
    message_id = Column(UUID(as_uuid=True), ForeignKey("chat_messages.id"), nullable=True)
    
    # The AI response that was rated
    response_text = Column(Text, nullable=True)
    response_metadata = Column(JSONB, nullable=True)  # Model used, tokens, latency, etc.
    
    # Feedback details
    is_helpful = Column(Boolean, nullable=True)  # Thumbs up/down
    rating = Column(Integer, nullable=True)  # 1-5 stars
    feedback_type = Column(String(50), nullable=True)  # "accurate", "relevant", "helpful", "harmful", "incorrect"
    
    # Detailed feedback
    comment = Column(Text, nullable=True)
    suggested_improvement = Column(Text, nullable=True)
    
    # For tracking which parts were problematic
    highlighted_text = Column(Text, nullable=True)  # User highlights part of response
    issue_category = Column(String(100), nullable=True)  # "factual_error", "irrelevant", "too_long", "too_short", "unclear"
    
    # Context
    query_text = Column(Text, nullable=True)  # The user's question
    sources_used = Column(JSONB, nullable=True)  # Documents/sources referenced
    
    # User info
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Timing
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Resolution
    is_resolved = Column(Boolean, default=False)
    reviewed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    admin_notes = Column(Text, nullable=True)
    
    # Relationships
    company = relationship("Company")
    user = relationship("User", foreign_keys=[user_id])
    conversation = relationship("Conversation")
    message = relationship("ChatMessage")
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])


class FeedbackSummary(BaseModel):
    """Aggregated feedback metrics"""
    __tablename__ = "feedback_summaries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Time period
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    
    # Scope
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=True)  # null = global
    model_name = Column(String(100), nullable=True)  # e.g., "llama-3.3-70b-versatile"
    
    # Metrics
    total_responses = Column(Integer, default=0)
    total_feedback_count = Column(Integer, default=0)
    helpful_count = Column(Integer, default=0)
    not_helpful_count = Column(Integer, default=0)
    average_rating = Column(Float, nullable=True)
    
    # Category breakdown
    accuracy_issues = Column(Integer, default=0)
    relevance_issues = Column(Integer, default=0)
    clarity_issues = Column(Integer, default=0)
    completeness_issues = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    company = relationship("Company")


class FeedbackNotification(BaseModel):
    """Notifications for important feedback"""
    __tablename__ = "feedback_notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    feedback_id = Column(UUID(as_uuid=True), ForeignKey("ai_response_feedback.id"), nullable=False)
    notify_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    message = Column(Text, nullable=False)
    priority = Column(String(20), default="normal")  # low, normal, high, critical
    
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    feedback = relationship("AIResponseFeedback")
    user = relationship("User")