"""
AI service — Groq LLM (primary) with OpenAI fallback.
Embeddings use local SentenceTransformers (all-MiniLM-L6-v2, 384-dim, zero API cost).

LLM priority:  GROQ_API_KEY present → Groq / Llama-3.1
               else                  → OpenAI (gpt-4-turbo)
"""

import json
import logging
import threading
from functools import lru_cache
from typing import Any, AsyncIterator, Dict, List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


class LLMConfigError(RuntimeError):
    """Raised when no usable LLM credentials are configured."""
    pass


# ---------------------------------------------------------------------------
# Embedding model  (local, no API call, 384-dim)
# ---------------------------------------------------------------------------

_embed_lock = threading.Lock()
_embedder = None


def _get_embedder():
    global _embedder
    if _embedder is None:
        with _embed_lock:
            if _embedder is None:
                from sentence_transformers import SentenceTransformer
                logger.info("Loading SentenceTransformer model: %s", settings.HUGGINGFACE_MODEL)
                _embedder = SentenceTransformer(settings.HUGGINGFACE_MODEL)
    return _embedder


async def generate_embedding(text: str) -> List[float]:
    """Generate a 384-dim embedding using local SentenceTransformer (no API cost)."""
    import asyncio
    loop = asyncio.get_event_loop()
    embedder = _get_embedder()
    embedding = await loop.run_in_executor(
        None, lambda: embedder.encode(text[:4096], normalize_embeddings=True).tolist()
    )
    return embedding


async def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Batch embeddings — much faster than calling one-by-one."""
    import asyncio
    loop = asyncio.get_event_loop()
    embedder = _get_embedder()
    truncated = [t[:4096] for t in texts]
    embeddings = await loop.run_in_executor(
        None, lambda: embedder.encode(truncated, normalize_embeddings=True).tolist()
    )
    return embeddings


# ---------------------------------------------------------------------------
# LLM client factory  (Groq preferred, OpenAI fallback)
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def _get_llm_client():
    """Returns (client, model_name, is_groq)."""
    if settings.GROQ_API_KEY:
        try:
            from groq import AsyncGroq
            client = AsyncGroq(api_key=settings.GROQ_API_KEY)
            logger.info("Using Groq LLM: %s", settings.GROQ_MODEL)
            return client, settings.GROQ_MODEL, True
        except ImportError:
            logger.warning("groq package not installed, falling back to OpenAI")

    # No Groq key or groq not installed — try OpenAI
    if not settings.OPENAI_API_KEY:
        raise LLMConfigError(
            "No LLM credentials configured. Set GROQ_API_KEY or OPENAI_API_KEY in the environment."
        )

    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    logger.info("Using OpenAI LLM: %s", settings.OPENAI_MODEL)
    return client, settings.OPENAI_MODEL, False


async def _chat(messages: List[Dict], max_tokens: int = 600, temperature: float = 0.4, json_mode: bool = False) -> str:
    """Unified LLM call — works with both Groq and OpenAI."""
    client, model, is_groq = _get_llm_client()

    kwargs: Dict[str, Any] = dict(
        model=model,
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature,
    )

    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    response = await client.chat.completions.create(**kwargs)
    return response.choices[0].message.content


async def _chat_stream(messages: List[Dict], max_tokens: int = 800) -> AsyncIterator[str]:
    """Streaming chat — yields text tokens as they arrive."""
    client, model, _ = _get_llm_client()
    stream = await client.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=max_tokens,
        temperature=0.5,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta and delta.content:
            yield delta.content


# ---------------------------------------------------------------------------
# Document summarisation
# ---------------------------------------------------------------------------

async def summarize_document(text: str, language: str = "en") -> str:
    lang_note = f"Respond in {_lang_name(language)}." if language != "en" else ""
    return await _chat(
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert at summarizing business documents for SME owners. "
                    "Provide concise, actionable summaries highlighting obligations, deadlines, and risks. "
                    + lang_note
                ),
            },
            {"role": "user", "content": f"Summarize this document:\n\n{text[:5000]}"},
        ],
        max_tokens=600,
        temperature=0.3,
    )


# ---------------------------------------------------------------------------
# Knowledge extraction
# ---------------------------------------------------------------------------

async def extract_knowledge(text: str, document_type: str) -> Dict[str, Any]:
    prompt = (
        f"Extract key compliance information from this {document_type} document.\n\n"
        f"Document:\n{text[:5000]}\n\n"
        "Return JSON with keys:\n"
        "  obligations: [{title, content}]\n"
        "  deadlines:   [{title, content, date}]  (ISO date if found)\n"
        "  risks:       [{title, content, level}]  (level: low/medium/high/critical)\n"
        "  metrics:     [{title, content}]"
    )
    raw = await _chat(
        messages=[
            {"role": "system", "content": "You extract structured compliance data from business documents. Always return valid JSON."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=1500,
        temperature=0.1,
        json_mode=True,
    )
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("Failed to parse knowledge extraction JSON response")
        return {"obligations": [], "deadlines": [], "risks": [], "metrics": []}


# ---------------------------------------------------------------------------
# Document classification
# ---------------------------------------------------------------------------

async def classify_document(filename: str, text_preview: str) -> str:
    result = await _chat(
        messages=[
            {
                "role": "system",
                "content": (
                    "Classify the document into exactly one of: "
                    "contract, invoice, policy, report, tax_document, hr_document, compliance, other. "
                    "Reply with only the category name, lowercase."
                ),
            },
            {
                "role": "user",
                "content": f"Filename: {filename}\nContent preview: {text_preview[:600]}\n\nClassify:",
            },
        ],
        max_tokens=15,
        temperature=0,
    )
    return result.strip().lower()


# ---------------------------------------------------------------------------
# Single-shot advisor query (RAG answer)
# ---------------------------------------------------------------------------

async def answer_query(query: str, context: str, language: str = "en") -> str:
    lang_note = f"Respond in {_lang_name(language)}." if language != "en" else ""
    return await _chat(
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a knowledgeable AI advisor for SMEs. "
                    "Answer questions based strictly on the provided context. "
                    "If the context is insufficient to answer fully, say so clearly and specify which document type would help. "
                    "Never fabricate facts, dates, or figures. "
                    "Use bullet points and bold headers for clarity. "
                    f"Be concise and actionable. {lang_note}"
                ),
            },
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"},
        ],
        max_tokens=700,
        temperature=0.3,
    )


# ---------------------------------------------------------------------------
# Multi-turn chatbot
# ---------------------------------------------------------------------------

CHATBOT_SYSTEM = """You are an expert AI business advisor embedded inside a Knowledge Base system for SMEs (small and medium enterprises). You have access to the company's uploaded documents through a RAG (Retrieval-Augmented Generation) pipeline.

Your capabilities:
- Compliance gap analysis and obligation tracking
- Contract review and risk identification
- Deadline monitoring and alerts
- Regulatory requirement interpretation (tax, labour, data protection, licensing)
- Business best-practice guidance

Response rules:
1. **Ground answers in the knowledge base** — use the context provided between the --- KNOWLEDGE BASE --- markers. Quote or reference specific document titles when relevant.
2. **Be honest about gaps** — if the knowledge base lacks information to answer fully, say so clearly and specify exactly which type of document would fill the gap (e.g. "Upload your employment contracts to analyse leave entitlements").
3. **If documents are still processing** — acknowledge them by name and let the user know content will be available once processing completes. Do NOT pretend the content is unavailable forever.
4. **Prioritise urgency** — flag overdue items with ⚠️, critical risks with 🔴, and upcoming deadlines with 🕐.
5. **Be concise and structured** — use bullet points, bold headers, and short paragraphs. Avoid long walls of text.
6. **Never fabricate data** — do not invent dates, amounts, company names, regulation names, or reference numbers. Only state what is in the context.
7. **Actionable output** — end every response with a clear next step or recommendation the user can act on immediately."""


async def chat_with_advisor(
    messages: List[Dict[str, str]],
    context: str,
    language: str = "en",
    company_name: Optional[str] = None,
) -> Dict[str, Any]:
    lang_note = f"Respond in {_lang_name(language)}." if language != "en" else ""
    company_note = f"You are advising {company_name}. " if company_name else ""

    system_content = (
        f"{company_note}{CHATBOT_SYSTEM} {lang_note}\n\n"
        f"--- KNOWLEDGE BASE ---\n{context}\n--- END ---"
    )

    api_messages = [{"role": "system", "content": system_content}]
    api_messages.extend(messages[-20:])  # keep last 20 turns

    client, model, _ = _get_llm_client()
    response = await client.chat.completions.create(
        model=model,
        messages=api_messages,
        max_tokens=800,
        temperature=0.5,
    )

    choice = response.choices[0]
    return {
        "content": choice.message.content,
        "usage": {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens,
        },
        "finish_reason": choice.finish_reason,
    }


async def stream_chat_with_advisor(
    messages: List[Dict[str, str]],
    context: str,
    language: str = "en",
    company_name: Optional[str] = None,
) -> AsyncIterator[str]:
    """Streaming version of chat_with_advisor — yields tokens."""
    lang_note = f"Respond in {_lang_name(language)}." if language != "en" else ""
    company_note = f"You are advising {company_name}. " if company_name else ""

    system_content = (
        f"{company_note}{CHATBOT_SYSTEM} {lang_note}\n\n"
        f"--- KNOWLEDGE BASE ---\n{context}\n--- END ---"
    )

    api_messages = [{"role": "system", "content": system_content}]
    api_messages.extend(messages[-20:])

    async for token in _chat_stream(api_messages, max_tokens=800):
        yield token


# ---------------------------------------------------------------------------
# Compliance recommendations
# ---------------------------------------------------------------------------

async def generate_compliance_recommendations(
    gaps: List[Dict[str, Any]],
    company_name: str,
    country_code: str,
    language: str = "en",
) -> str:
    if not gaps:
        return "Your knowledge base covers all applicable compliance rules. No immediate gaps detected."

    gap_list = "\n".join(
        f"- [{g['severity'].upper()}] {g['title']}: {g.get('action_required', 'Review required')}"
        for g in gaps[:15]
    )
    lang_note = f"Respond in {_lang_name(language)}." if language != "en" else ""

    return await _chat(
        messages=[
            {
                "role": "system",
                "content": f"You are a compliance advisor for SMEs in {country_code}. {lang_note}",
            },
            {
                "role": "user",
                "content": (
                    f"Company: {company_name}\n"
                    "These compliance requirements are NOT yet documented:\n"
                    f"{gap_list}\n\n"
                    "Provide a prioritised, actionable compliance action plan."
                ),
            },
        ],
        max_tokens=700,
        temperature=0.4,
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _lang_name(code: str) -> str:
    return {
        "en": "English", "fr": "French", "sw": "Swahili",
        "rw": "Kinyarwanda", "pt": "Portuguese", "ar": "Arabic",
        "es": "Spanish", "de": "German", "zh": "Chinese",
    }.get(code.lower(), "English")
