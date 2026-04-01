"""
Conversational chatbot endpoints.

POST /chatbot/sessions                                            — create a new chat session
GET  /chatbot/sessions                                            — list user's sessions
GET  /chatbot/sessions/{id}                                       — get session with full message history
DELETE /chatbot/sessions/{id}                                     — delete session
POST /chatbot/sessions/{id}/messages                              — send a message, get AI reply (multi-turn)
POST /chatbot/sessions/{id}/messages/{message_id}/feedback        — rate an AI message (thumbs up/down)
"""

import json
import logging
from datetime import datetime
from typing import List, Optional

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.api.dependencies import get_current_active_user
from app.core.database import get_db
from app.models.chat import ChatMessage, ChatSession, MessageRole
from app.models.company import Company
from app.models.user import User
from app.services.ai_service import (
    LLMConfigError,
    chat_with_advisor,
    generate_embedding,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class SessionCreate(BaseModel):
    title: Optional[str] = None


class MessageCreate(BaseModel):
    content: str
    context_limit: int = 8  # number of knowledge entries to retrieve


# ---------------------------------------------------------------------------
# Session management
# ---------------------------------------------------------------------------

@router.post("/sessions", status_code=201)
async def create_session(
    payload: SessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company")

    session = ChatSession(
        user_id=current_user.id,
        company_id=current_user.company_id,
        title=payload.title or f"Chat {datetime.utcnow().strftime('%b %d, %H:%M')}",
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return _serialize_session(session, [])


@router.get("/sessions")
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    result = await db.execute(
        select(ChatSession)
        .where(
            and_(
                ChatSession.user_id == current_user.id,
                ChatSession.is_active.is_(True),
            )
        )
        .order_by(ChatSession.updated_at.desc())
        .limit(limit)
        .offset(offset)
    )
    sessions = result.scalars().all()
    return {"items": [_serialize_session(s, []) for s in sessions], "total": len(sessions)}


@router.get("/sessions/{session_id}")
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    session, messages = await _get_session_and_messages(db, session_id, current_user.id)
    return _serialize_session(session, messages)


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    session, _ = await _get_session_and_messages(db, session_id, current_user.id)
    session.is_active = False
    await db.commit()
    return {"status": "deleted", "session_id": session_id}


# ---------------------------------------------------------------------------
# Messaging — multi-turn with RAG
# ---------------------------------------------------------------------------

@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: str,
    payload: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    session, history = await _get_session_and_messages(db, session_id, current_user.id)

    # Load company info for language + name
    company_result = await db.execute(
        select(Company).where(Company.id == session.company_id)
    )
    company = company_result.scalar_one_or_none()
    language = company.language if company else "en"
    company_name = company.name if company else None

    # RAG: embed the new message and retrieve relevant knowledge
    try:
        query_embedding = await generate_embedding(payload.content)
        sql = text("""
            SELECT title, content, knowledge_type, risk_level
            FROM knowledge_entries
            WHERE company_id = :company_id AND is_active = true
            ORDER BY embedding <=> :query_embedding
            LIMIT :limit
        """)
        ke_result = await db.execute(
            sql,
            {
                "query_embedding": str(query_embedding),
                "company_id": str(session.company_id),
                "limit": payload.context_limit,
            },
        )
        relevant_entries = ke_result.fetchall()
    except Exception as exc:
        logger.error("Embedding/retrieval failed in chatbot: %s", exc)
        relevant_entries = []

    context = "\n\n".join(
        f"[{e.knowledge_type}] {e.title}: {e.content}" for e in relevant_entries
    ) or "No relevant knowledge found in your documents yet. Please upload business documents to build your knowledge base."

    # Build message history for multi-turn
    api_history = [
        {"role": msg.role.value, "content": msg.content}
        for msg in history
    ]
    # Append the new user message
    api_history.append({"role": "user", "content": payload.content})

    # Call multi-turn AI
    try:
        ai_response = await chat_with_advisor(api_history, context, language, company_name)
    except LLMConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.error("LLM call failed in chatbot: %s", exc)
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable. Please try again.")

    # Persist user message
    user_msg = ChatMessage(
        session_id=session.id,
        role=MessageRole.USER,
        content=payload.content,
        token_count=None,
    )
    db.add(user_msg)

    # Persist assistant message with sources
    sources_json = json.dumps([
        {"title": e.title, "type": str(e.knowledge_type), "risk_level": str(e.risk_level)}
        for e in relevant_entries
    ])
    assistant_msg = ChatMessage(
        session_id=session.id,
        role=MessageRole.ASSISTANT,
        content=ai_response["content"],
        sources=sources_json,
        token_count=ai_response["usage"].get("total_tokens"),
    )
    db.add(assistant_msg)

    # Update session timestamp + auto-title from first message
    session.updated_at = datetime.utcnow()
    if not session.title or session.title.startswith("Chat "):
        session.title = payload.content[:60] + ("..." if len(payload.content) > 60 else "")

    await db.commit()

    return {
        "session_id": session_id,
        "message": {
            "id": str(assistant_msg.id),
            "role": "assistant",
            "content": ai_response["content"],
            "sources": relevant_entries and [
                {"title": e.title, "type": str(e.knowledge_type), "risk_level": str(e.risk_level)}
                for e in relevant_entries
            ],
            "usage": ai_response["usage"],
            "created_at": assistant_msg.created_at.isoformat(),
        },
    }


# ---------------------------------------------------------------------------
# Message feedback
# ---------------------------------------------------------------------------

class MessageFeedback(BaseModel):
    rating: int  # 1 = thumbs up, -1 = thumbs down
    comment: Optional[str] = None


@router.post(
    "/sessions/{session_id}/messages/{message_id}/feedback",
    summary="Rate an AI message",
    description=(
        "Store thumbs-up (rating=1) or thumbs-down (rating=-1) feedback on an AI-generated "
        "message. An optional free-text comment can be included. Feedback is persisted in the "
        "message's sources field alongside the original source citations."
    ),
    response_description="Confirmation dict with status, message_id, and the recorded rating.",
)
async def rate_message(
    session_id: str,
    message_id: str,
    payload: MessageFeedback,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Store thumbs-up / thumbs-down feedback on an AI message."""
    # Verify session belongs to user
    session, _ = await _get_session_and_messages(db, session_id, current_user.id)

    msg_result = await db.execute(
        select(ChatMessage).where(ChatMessage.id == message_id)
    )
    msg = msg_result.scalar_one_or_none()
    if not msg or str(msg.session_id) != str(session.id):
        raise HTTPException(status_code=404, detail="Message not found")

    # Store feedback in message metadata (use sources field as JSON store)
    existing = json.loads(msg.sources) if msg.sources else []
    if isinstance(existing, list):
        # Convert to dict format to store feedback alongside sources
        metadata = {"sources": existing, "feedback": {"rating": payload.rating, "comment": payload.comment}}
    else:
        metadata = {**existing, "feedback": {"rating": payload.rating, "comment": payload.comment}}
    msg.sources = json.dumps(metadata)
    await db.commit()
    return {"status": "ok", "message_id": message_id, "rating": payload.rating}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_session_and_messages(
    db: AsyncSession,
    session_id: str,
    user_id,
) -> tuple[ChatSession, List[ChatMessage]]:
    session_result = await db.execute(
        select(ChatSession).where(
            and_(
                ChatSession.id == session_id,
                ChatSession.user_id == user_id,
                ChatSession.is_active.is_(True),
            )
        )
    )
    session = session_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    msg_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = msg_result.scalars().all()
    return session, messages


def _serialize_session(session: ChatSession, messages: List[ChatMessage]) -> dict:
    return {
        "id": str(session.id),
        "title": session.title,
        "is_active": session.is_active,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "updated_at": session.updated_at.isoformat() if session.updated_at else None,
        "message_count": len(messages),
        "messages": [
            {
                "id": str(m.id),
                "role": m.role.value,
                "content": m.content,
                "sources": json.loads(m.sources) if m.sources else [],
                "token_count": m.token_count,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ],
    }
