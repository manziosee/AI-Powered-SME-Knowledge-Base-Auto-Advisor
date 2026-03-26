"""
Global search endpoint.

GET /search?q=<query>&limit=<n>

Searches across:
  - Documents (filename, summary, extracted_text)
  - Knowledge entries (title, content)

Returns a unified ranked list scoped to the authenticated user's company.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_active_user
from app.core.database import get_db
from app.models.document import Document
from app.models.knowledge_entry import KnowledgeEntry
from app.models.user import User

router = APIRouter()


@router.get("")
async def global_search(
    q: str = Query(..., min_length=1, max_length=200, description="Search query"),
    limit: int = Query(default=10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Full-text keyword search across documents and knowledge entries.
    Results are scoped to the authenticated user's company and ranked by relevance.
    """
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company")

    company_id = current_user.company_id
    term = f"%{q.lower()}%"
    results: List[dict] = []

    # ── Documents ────────────────────────────────────────────────────────────
    doc_query = await db.execute(
        select(Document)
        .where(
            Document.company_id == company_id,
            or_(
                func.lower(Document.original_filename).like(term),
                func.lower(Document.summary).like(term),
                func.lower(Document.extracted_text).like(term),
            ),
        )
        .order_by(Document.created_at.desc())
        .limit(limit)
    )
    docs = doc_query.scalars().all()

    for doc in docs:
        excerpt = _extract_excerpt(doc.summary or doc.extracted_text or "", q)
        results.append(
            {
                "id": str(doc.id),
                "type": "document",
                "title": doc.original_filename,
                "filename": doc.original_filename,
                "excerpt": excerpt,
                "document_type": doc.document_type.value if doc.document_type else "other",
                "status": doc.status.value if doc.status else "unknown",
                "created_at": doc.created_at.isoformat() if doc.created_at else None,
            }
        )

    # ── Knowledge entries ────────────────────────────────────────────────────
    ke_query = await db.execute(
        select(KnowledgeEntry)
        .where(
            KnowledgeEntry.company_id == company_id,
            KnowledgeEntry.is_active == True,  # noqa: E712
            or_(
                func.lower(KnowledgeEntry.title).like(term),
                func.lower(KnowledgeEntry.content).like(term),
            ),
        )
        .order_by(KnowledgeEntry.created_at.desc())
        .limit(limit)
    )
    entries = ke_query.scalars().all()

    for entry in entries:
        excerpt = _extract_excerpt(entry.content or "", q)
        results.append(
            {
                "id": str(entry.id),
                "type": "knowledge",
                "title": entry.title or "Knowledge Entry",
                "filename": entry.title,
                "excerpt": excerpt,
                "document_type": entry.knowledge_type.value if entry.knowledge_type else "general",
                "status": "active",
                "created_at": entry.created_at.isoformat() if entry.created_at else None,
            }
        )

    # De-duplicate by id and sort: exact title matches first, then by date
    seen: set = set()
    unique: List[dict] = []
    for r in results:
        if r["id"] not in seen:
            seen.add(r["id"])
            r["_rank"] = 0 if q.lower() in (r["title"] or "").lower() else 1
            unique.append(r)

    unique.sort(key=lambda r: (r.pop("_rank"), r.get("created_at") or ""))
    unique = unique[:limit]

    return {
        "query": q,
        "results": unique,
        "total": len(unique),
    }


def _extract_excerpt(text: str, query: str, context: int = 120) -> str:
    """Return a short excerpt around the first occurrence of *query* in *text*."""
    if not text:
        return ""
    lower_text = text.lower()
    idx = lower_text.find(query.lower())
    if idx == -1:
        return text[:context].strip() + ("…" if len(text) > context else "")
    start = max(0, idx - context // 2)
    end = min(len(text), idx + len(query) + context // 2)
    snippet = text[start:end].strip()
    if start > 0:
        snippet = "…" + snippet
    if end < len(text):
        snippet = snippet + "…"
    return snippet
