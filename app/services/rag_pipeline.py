"""
LangChain-powered RAG pipeline for the SME Knowledge Base.

Features
────────
1. Smart document chunking  — RecursiveCharacterTextSplitter with overlap
2. Vector retrieval         — pgvector cosine similarity (dense)
3. Keyword retrieval        — BM25 over in-memory index (sparse)
4. Hybrid fusion            — Reciprocal Rank Fusion (RRF) merges both lists
5. Contextual compression   — strips irrelevant sentences from each chunk
6. Structured LLM answer    — sources, confidence, follow-up questions
"""

import logging
import math
from typing import Any, Dict, List, Optional

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document as LCDocument
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.services.ai_service import _chat, generate_embedding, generate_embeddings_batch

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 1. Document chunking
# ---------------------------------------------------------------------------

_splitter = RecursiveCharacterTextSplitter(
    chunk_size=settings.RAG_CHUNK_SIZE,
    chunk_overlap=settings.RAG_CHUNK_OVERLAP,
    separators=["\n\n", "\n", ". ", "! ", "? ", "; ", ", ", " ", ""],
    length_function=len,
)


def chunk_text(text: str, metadata: Optional[Dict] = None) -> List[LCDocument]:
    """Split a document into overlapping chunks with metadata."""
    chunks = _splitter.create_documents([text], metadatas=[metadata or {}])
    for i, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = i
        chunk.metadata["chunk_total"] = len(chunks)
    return chunks


def chunk_text_raw(text: str) -> List[str]:
    """Return plain string chunks (used when LangChain Document objects aren't needed)."""
    return _splitter.split_text(text)


# ---------------------------------------------------------------------------
# 2. Dense (vector) retrieval from pgvector
# ---------------------------------------------------------------------------

async def dense_retrieve(
    db: AsyncSession,
    query_embedding: List[float],
    company_id: str,
    top_k: int = 10,
) -> List[Dict[str, Any]]:
    sql = text("""
        SELECT
            ke.id::text,
            ke.title,
            ke.content,
            ke.knowledge_type::text  AS knowledge_type,
            ke.risk_level::text      AS risk_level,
            ke.deadline,
            d.original_filename      AS source_document,
            (1 - (ke.embedding <=> :emb)) AS score
        FROM knowledge_entries ke
        LEFT JOIN documents d ON ke.document_id = d.id
        WHERE ke.company_id = :cid
          AND ke.is_active = true
          AND ke.embedding IS NOT NULL
        ORDER BY ke.embedding <=> :emb
        LIMIT :k
    """)
    rows = (await db.execute(sql, {"emb": str(query_embedding), "cid": company_id, "k": top_k})).fetchall()
    return [
        {
            "id": r.id,
            "title": r.title,
            "content": r.content,
            "knowledge_type": r.knowledge_type,
            "risk_level": r.risk_level,
            "deadline": r.deadline.isoformat() if r.deadline else None,
            "source": r.source_document,
            "dense_score": float(r.score),
            "rank": i + 1,
        }
        for i, r in enumerate(rows)
    ]


# ---------------------------------------------------------------------------
# 3. Sparse (BM25) retrieval — in-memory over company knowledge entries
# ---------------------------------------------------------------------------

async def sparse_retrieve(
    db: AsyncSession,
    query: str,
    company_id: str,
    top_k: int = 10,
) -> List[Dict[str, Any]]:
    """BM25 keyword search over all knowledge entry text."""
    try:
        from rank_bm25 import BM25Okapi
    except ImportError:
        logger.warning("rank_bm25 not installed — skipping sparse retrieval. pip install rank-bm25")
        return []

    sql = text("""
        SELECT ke.id::text, ke.title, ke.content,
               ke.knowledge_type::text, ke.risk_level::text, ke.deadline,
               d.original_filename AS source_document
        FROM knowledge_entries ke
        LEFT JOIN documents d ON ke.document_id = d.id
        WHERE ke.company_id = :cid AND ke.is_active = true
        LIMIT 2000
    """)
    rows = (await db.execute(sql, {"cid": company_id})).fetchall()

    if not rows:
        return []

    corpus = [f"{r.title} {r.content}".lower().split() for r in rows]
    bm25 = BM25Okapi(corpus)
    query_tokens = query.lower().split()
    scores = bm25.get_scores(query_tokens)

    indexed = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)[:top_k]
    results = []
    for rank, (idx, score) in enumerate(indexed):
        r = rows[idx]
        results.append({
            "id": r.id,
            "title": r.title,
            "content": r.content,
            "knowledge_type": r.knowledge_type,
            "risk_level": r.risk_level,
            "deadline": r.deadline.isoformat() if r.deadline else None,
            "source": r.source_document,
            "sparse_score": float(score),
            "rank": rank + 1,
        })
    return results


# ---------------------------------------------------------------------------
# 4. Reciprocal Rank Fusion (RRF)
# ---------------------------------------------------------------------------

def reciprocal_rank_fusion(
    dense: List[Dict],
    sparse: List[Dict],
    k: int = 60,
    top_n: int = 8,
) -> List[Dict]:
    """
    Merge dense and sparse result lists using RRF.
    RRF score = sum(1 / (k + rank)) across all lists.
    """
    scores: Dict[str, float] = {}
    entries: Dict[str, Dict] = {}

    for item in dense:
        doc_id = item["id"]
        scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + item["rank"])
        entries[doc_id] = item

    for item in sparse:
        doc_id = item["id"]
        scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + item["rank"])
        if doc_id not in entries:
            entries[doc_id] = item

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
    return [
        {**entries[doc_id], "rrf_score": round(score, 6)}
        for doc_id, score in ranked
    ]


# ---------------------------------------------------------------------------
# 5. Contextual compression — filter irrelevant sentences from each chunk
# ---------------------------------------------------------------------------

async def compress_context(query: str, chunks: List[Dict]) -> List[Dict]:
    """
    For each retrieved chunk, ask the LLM to extract only the relevant sentences.
    Reduces noise fed into the final answer prompt.
    Skips compression for short chunks (< 200 chars) to avoid overhead.
    """
    compressed = []
    for chunk in chunks:
        content = chunk["content"]
        if len(content) < 200:
            compressed.append(chunk)
            continue

        prompt = (
            f"Query: {query}\n\n"
            f"Passage:\n{content}\n\n"
            "Extract only the sentences from the passage that are directly relevant to the query. "
            "If nothing is relevant, reply with: [NOT RELEVANT]. "
            "Do not add any explanation."
        )
        try:
            result = await _chat(
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300,
                temperature=0,
            )
            if "[NOT RELEVANT]" not in result:
                compressed.append({**chunk, "content": result.strip()})
        except Exception:
            compressed.append(chunk)  # fallback: keep original

    return compressed


# ---------------------------------------------------------------------------
# 6. Full RAG pipeline — query → retrieve → fuse → compress → answer
# ---------------------------------------------------------------------------

async def rag_query(
    db: AsyncSession,
    query: str,
    company_id: str,
    language: str = "en",
    company_name: Optional[str] = None,
    use_compression: bool = True,
    top_k: int = None,
) -> Dict[str, Any]:
    """
    Full pipeline:
      query → embed → dense+sparse retrieve → RRF fusion
            → (optional) contextual compression → structured LLM answer
    """
    top_k = top_k or settings.RAG_TOP_K

    # Step 1: embed query
    query_embedding = await generate_embedding(query)

    # Step 2: retrieve from both indexes
    dense_results, sparse_results = await _parallel_retrieve(
        db, query_embedding, query, company_id, top_k
    )

    # Step 3: fuse
    fused = reciprocal_rank_fusion(dense_results, sparse_results, top_n=settings.RAG_RERANK_TOP_N)

    if not fused:
        return {
            "answer": (
                "I don't have enough information in your knowledge base to answer this question. "
                "Please upload relevant business documents first."
            ),
            "sources": [],
            "query": query,
        }

    # Step 4: contextual compression (optional — adds ~1 extra LLM call per chunk)
    chunks_to_use = await compress_context(query, fused) if use_compression else fused

    if not chunks_to_use:
        chunks_to_use = fused  # fallback to uncompressed

    # Step 5: build context string
    context = _build_context_string(chunks_to_use)

    # Step 6: structured LLM answer
    lang_note = f"Respond in {_lang_name(language)}." if language != "en" else ""
    company_note = f"You are advising {company_name}. " if company_name else ""

    answer = await _chat(
        messages=[
            {
                "role": "system",
                "content": (
                    f"{company_note}You are an AI business advisor for SMEs. "
                    "Answer the question using ONLY the provided context. "
                    "Be specific, cite which document the information comes from. "
                    "If the answer is not fully covered, say what's missing. "
                    f"{lang_note}"
                ),
            },
            {
                "role": "user",
                "content": f"Context:\n{context}\n\nQuestion: {query}",
            },
        ],
        max_tokens=700,
        temperature=0.4,
    )

    return {
        "query": query,
        "answer": answer,
        "sources": [
            {
                "id": c["id"],
                "title": c["title"],
                "type": c.get("knowledge_type"),
                "risk_level": c.get("risk_level"),
                "source_document": c.get("source"),
                "relevance": round(c.get("rrf_score", 0), 4),
            }
            for c in fused
        ],
        "retrieval_stats": {
            "dense_hits": len(dense_results),
            "sparse_hits": len(sparse_results),
            "after_fusion": len(fused),
            "after_compression": len(chunks_to_use),
        },
    }


# ---------------------------------------------------------------------------
# Chunk-level embedding store (for re-indexing after chunking)
# ---------------------------------------------------------------------------

async def embed_and_store_chunks(
    db: AsyncSession,
    document_id: str,
    company_id: str,
    text: str,
    document_type: str,
) -> int:
    """
    Split document into chunks, embed each, and store as KnowledgeEntry rows.
    Returns the number of chunks stored.
    """
    from app.models.knowledge_entry import KnowledgeEntry, KnowledgeType, RiskLevel
    from app.services.ml_service import RiskScorer

    scorer = RiskScorer()
    chunks = chunk_text_raw(text)

    if not chunks:
        return 0

    embeddings = await generate_embeddings_batch(chunks)

    entries = []
    for i, (chunk_text_, embedding) in enumerate(zip(chunks, embeddings)):
        risk = scorer.score(chunk_text_)
        entry = KnowledgeEntry(
            company_id=company_id,
            document_id=document_id,
            knowledge_type=KnowledgeType.INSIGHT,
            title=f"Chunk {i + 1}",
            content=chunk_text_,
            risk_level=RiskLevel(risk),
            embedding=embedding,
            metadata={"chunk_index": i, "document_type": document_type},
        )
        entries.append(entry)

    for e in entries:
        db.add(e)
    await db.commit()
    return len(entries)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _parallel_retrieve(db, query_embedding, query, company_id, top_k):
    """Run dense and sparse retrieval concurrently."""
    import asyncio
    dense_task = dense_retrieve(db, query_embedding, company_id, top_k)
    sparse_task = sparse_retrieve(db, query, company_id, top_k)
    return await asyncio.gather(dense_task, sparse_task)


def _build_context_string(chunks: List[Dict]) -> str:
    parts = []
    for i, c in enumerate(chunks, 1):
        source = c.get("source") or "Knowledge Base"
        parts.append(
            f"[{i}] Source: {source} | Type: {c.get('knowledge_type', 'N/A')} "
            f"| Risk: {c.get('risk_level', 'N/A')}\n{c['content']}"
        )
    return "\n\n".join(parts)


def _lang_name(code: str) -> str:
    return {
        "en": "English", "fr": "French", "sw": "Swahili",
        "rw": "Kinyarwanda", "pt": "Portuguese", "ar": "Arabic",
        "es": "Spanish", "de": "German",
    }.get(code.lower(), "English")
