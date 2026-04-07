"""
AI Advisor endpoints — single-shot + agent mode + streaming.

POST /advisor/ask          — single RAG query (fast, no tool use)
POST /advisor/ask-agent    — agent mode with tool use (DeadlineLookup, ComplianceCheck, etc.)
GET  /advisor/stream       — streaming SSE response (token-by-token)
GET  /advisor/history      — past queries (from chat sessions)
"""

import json
from typing import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select, text, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_active_user
from app.core.database import get_db, AsyncSessionLocal
from app.models.company import Company
from app.models.user import User
from app.schemas.knowledge import AdvisorQuery
from app.services.ai_service import (
    LLMConfigError,
    generate_embedding,
    stream_chat_with_advisor,
)
from app.services.rag_pipeline import rag_query

router = APIRouter()


class AgentQuery(BaseModel):
    query: str
    use_agent: bool = True


# ---------------------------------------------------------------------------
# Single-shot RAG (fast path — no tool loop)
# ---------------------------------------------------------------------------

@router.post("/ask")
async def ask_advisor(
    query_data: AdvisorQuery,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company")

    company_result = await db.execute(
        select(Company).where(Company.id == current_user.company_id)
    )
    company = company_result.scalar_one_or_none()
    language = company.language if company else "en"
    company_name = company.name if company else None

    try:
        result = await rag_query(
            db=db,
            query=query_data.query,
            company_id=str(current_user.company_id),
            language=language,
            company_name=company_name,
            use_compression=False,  # fast path — skip compression
        )
        # If no sources were found, surface uploaded documents + their status so the user understands why
        if not result.get("sources"):
            doc_rows = (await db.execute(
                text(
                    """
                    SELECT original_filename, status, processed_at, created_at
                    FROM documents
                    WHERE company_id = :cid
                    ORDER BY created_at DESC
                    LIMIT 20
                    """
                ),
                {"cid": str(current_user.company_id)},
            )).fetchall()

            if doc_rows:
                processed_docs = [d for d in doc_rows if d.status in ("processed", "failed")]
                pending_docs = [d for d in doc_rows if d.status not in ("processed", "failed")]
                
                msg_parts = []
                
                if pending_docs:
                    pending_list = "\n".join(f"  • {d.original_filename} ({d.status})" for d in pending_docs)
                    msg_parts.append(f"📄 **Documents still processing:**\n{pending_list}\n")
                    msg_parts.append("⚠️ These documents are not yet searchable. Please wait for processing to complete, or go to **Documents** and click **Reprocess** to try again.\n")
                
                if processed_docs:
                    processed_list = "\n".join(f"  • {d.original_filename}" for d in processed_docs)
                    msg_parts.append(f"✅ **Processed documents:**\n{processed_list}")
                
                if not processed_docs:
                    result["answer"] = (
                        "I can't answer your question yet because your documents are still being processed.\n\n"
                        + "\n".join(f"  • {d.original_filename} ({d.status})" for d in doc_rows)
                        + "\n\n"
                        "**What to do:**\n"
                        "1. Wait a few minutes for processing to complete\n"
                        "2. Or go to **Documents** → click the **⋮** menu → **Reprocess**\n"
                        "3. Once status shows 'processed', ask me again and I'll have the full content to work with.\n"
                        "\n"
                        "You can check processing status in the Documents tab."
                    )
                else:
                    result["answer"] = "I don't have specific information about that in your knowledge base. Try rephrasing your question, or upload a document that covers this topic."
        return result
    except LLMConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:  # pragma: no cover — fallback
        raise HTTPException(status_code=500, detail=f"Advisor failed: {exc}")


# ---------------------------------------------------------------------------
# Agent mode (uses tools: DeadlineLookup, ComplianceCheck, Calculator, etc.)
# ---------------------------------------------------------------------------

@router.post("/ask-agent")
async def ask_agent(
    query_data: AgentQuery,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company")

    company_result = await db.execute(
        select(Company).where(Company.id == current_user.company_id)
    )
    company = company_result.scalar_one_or_none()

    from app.services.agent_service import run_agent

    try:
        result = await run_agent(
            query=query_data.query,
            company_id=str(current_user.company_id),
            db_session_factory=AsyncSessionLocal,
            country_code=company.country if company else "US",
            industry=company.industry if company else None,
        )
        return result
    except LLMConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"Agent failed: {exc}")


# ---------------------------------------------------------------------------
# Streaming SSE endpoint — streams tokens as Server-Sent Events
# ---------------------------------------------------------------------------

@router.get("/stream")
async def stream_answer(
    q: str = Query(..., min_length=2, description="Question to stream"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Server-Sent Events streaming endpoint.
    Client receives tokens one-by-one as `data: <token>\n\n` lines.
    Final event is `data: [DONE]\n\n`.
    """
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company")

    company_result = await db.execute(
        select(Company).where(Company.id == current_user.company_id)
    )
    company = company_result.scalar_one_or_none()
    language = company.language if company else "en"
    company_name = company.name if company else None

    # Retrieve context via RAG first
    query_embedding = await generate_embedding(q)
    sql = text("""
        SELECT title, content, knowledge_type
        FROM knowledge_entries
        WHERE company_id = :cid AND is_active = true AND embedding IS NOT NULL
        ORDER BY embedding <=> :emb
        LIMIT 6
    """)
    rows = (await db.execute(sql, {"emb": str(query_embedding), "cid": str(current_user.company_id)})).fetchall()
    context = "\n\n".join(f"[{r.knowledge_type}] {r.title}: {r.content}" for r in rows) or "No context found."

    messages = [{"role": "user", "content": q}]

    async def event_stream() -> AsyncIterator[str]:
        try:
            async for token in stream_chat_with_advisor(messages, context, language, company_name):
                # SSE format: data: <payload>\n\n
                yield f"data: {json.dumps({'token': token})}\n\n"
            yield "data: [DONE]\n\n"
        except LLMConfigError as exc:
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"
        except Exception as exc:  # pragma: no cover
            yield f"data: {json.dumps({'error': 'Streaming failed: ' + str(exc)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
