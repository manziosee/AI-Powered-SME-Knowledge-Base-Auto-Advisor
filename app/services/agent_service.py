"""
LangChain Agent for the SME Advisor.

The agent has access to tools that let it look up real data from the DB
rather than hallucinating answers.

Tools
─────
1. DeadlineLookupTool    — query upcoming deadlines for the company
2. ComplianceCheckTool   — check which compliance rules apply + gaps
3. DocumentSearchTool    — semantic search over knowledge base (RAG)
4. RiskSummaryTool       — get current risk distribution
5. CalculatorTool        — safe arithmetic for financial questions
6. DateTool              — today's date (stops LLM from guessing)

The agent uses a ReAct (Reasoning + Acting) loop:
  Thought → Action → Observation → ... → Final Answer
"""

import json
import logging
import math
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from langgraph.prebuilt import create_react_agent
from langchain_core.tools import Tool, StructuredTool
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import HumanMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# LangChain LLM wrapper (Groq or OpenAI)
# ---------------------------------------------------------------------------

def _build_langchain_llm() -> BaseChatModel:
    if settings.GROQ_API_KEY:
        try:
            from langchain_groq import ChatGroq
            return ChatGroq(
                api_key=settings.GROQ_API_KEY,
                model=settings.GROQ_MODEL,
                temperature=0.3,
                max_tokens=1024,
            )
        except ImportError:
            logger.warning("langchain-groq not installed, falling back to OpenAI")

    from langchain_openai import ChatOpenAI
    return ChatOpenAI(
        api_key=settings.OPENAI_API_KEY,
        model=settings.OPENAI_MODEL,
        temperature=0.3,
        max_tokens=1024,
    )


# ---------------------------------------------------------------------------
# Tool implementations  (sync wrappers around async DB calls)
# ---------------------------------------------------------------------------

def _make_deadline_tool(company_id: str, db_session_factory):
    def lookup_deadlines(days_ahead: str = "30") -> str:
        """Look up upcoming deadlines for the company within the given number of days."""
        import asyncio
        from sqlalchemy import select, and_
        from app.models.knowledge_entry import KnowledgeEntry, KnowledgeType

        try:
            days = int(days_ahead)
        except ValueError:
            days = 30

        async def _query():
            async with db_session_factory() as db:
                now = datetime.utcnow()
                result = await db.execute(
                    select(KnowledgeEntry)
                    .where(
                        and_(
                            KnowledgeEntry.company_id == company_id,
                            KnowledgeEntry.is_active.is_(True),
                            KnowledgeEntry.deadline.isnot(None),
                            KnowledgeEntry.deadline >= now,
                            KnowledgeEntry.deadline <= now + timedelta(days=days),
                        )
                    )
                    .order_by(KnowledgeEntry.deadline.asc())
                    .limit(20)
                )
                entries = result.scalars().all()
                if not entries:
                    return f"No deadlines found in the next {days} days."
                lines = [
                    f"- {e.deadline.strftime('%Y-%m-%d')}: {e.title} [{e.risk_level}]"
                    for e in entries
                ]
                return f"Upcoming deadlines (next {days} days):\n" + "\n".join(lines)

        return asyncio.run(_query())

    return Tool(
        name="DeadlineLookup",
        func=lookup_deadlines,
        description=(
            "Look up upcoming compliance deadlines for the company. "
            "Input: number of days ahead (default 30). "
            "Use this when asked about upcoming deadlines, due dates, or time-sensitive obligations."
        ),
    )


def _make_compliance_tool(company_id: str, db_session_factory, country_code: str, industry: Optional[str]):
    def check_compliance(category: str = "") -> str:
        """Check compliance rules and gaps for the company."""
        import asyncio
        from app.services.compliance_service import compute_compliance_gaps, get_rules_for_company
        from sqlalchemy import select, and_
        from app.models.knowledge_entry import KnowledgeEntry

        async def _query():
            async with db_session_factory() as db:
                ke_result = await db.execute(
                    select(KnowledgeEntry.title, KnowledgeEntry.content)
                    .where(and_(KnowledgeEntry.company_id == company_id, KnowledgeEntry.is_active.is_(True)))
                )
                texts = [f"{r.title} {r.content}" for r in ke_result.all()]

                gap_report = await compute_compliance_gaps(
                    db=db,
                    company_id=company_id,
                    country_code=country_code,
                    industry=industry,
                    knowledge_titles=texts,
                )
                gaps = gap_report.get("gap_rules", [])[:5]
                coverage = gap_report.get("coverage_percentage", 0)

                if not gaps:
                    return f"Compliance coverage: {coverage}%. No critical gaps detected."

                gap_text = "\n".join(
                    f"- [{g['severity'].upper()}] {g['title']}: {g.get('action_required', 'Action needed')}"
                    for g in gaps
                )
                return (
                    f"Compliance coverage: {coverage}%.\n"
                    f"Top compliance gaps:\n{gap_text}"
                )

        return asyncio.run(_query())

    return Tool(
        name="ComplianceCheck",
        func=check_compliance,
        description=(
            "Check the company's compliance status and identify gaps against applicable regulations. "
            "Input: optional category filter (tax, labor, data_privacy, etc.) or empty for all. "
            "Use this for compliance questions, regulatory requirements, or risk assessments."
        ),
    )


def _make_document_search_tool(company_id: str, db_session_factory):
    def search_documents(query: str) -> str:
        """Search the company knowledge base for relevant information."""
        import asyncio
        from app.services.rag_pipeline import dense_retrieve
        from app.services.ai_service import generate_embedding

        async def _query():
            async with db_session_factory() as db:
                embedding = await generate_embedding(query)
                results = await dense_retrieve(db, embedding, company_id, top_k=5)
                if not results:
                    return "No relevant information found in the knowledge base."
                parts = [
                    f"[{r['knowledge_type']}] {r['title']} (source: {r['source'] or 'N/A'}):\n{r['content'][:400]}"
                    for r in results
                ]
                return "\n\n".join(parts)

        return asyncio.run(_query())

    return Tool(
        name="DocumentSearch",
        func=search_documents,
        description=(
            "Search the company's uploaded documents and knowledge base. "
            "Input: a natural language search query. "
            "Use this to find specific information from contracts, policies, invoices, or reports."
        ),
    )


def _make_risk_tool(company_id: str, db_session_factory):
    def get_risk_summary(_: str = "") -> str:
        """Get current risk distribution across the knowledge base."""
        import asyncio
        from sqlalchemy import select, func, and_
        from app.models.knowledge_entry import KnowledgeEntry

        async def _query():
            async with db_session_factory() as db:
                result = await db.execute(
                    select(KnowledgeEntry.risk_level, func.count(KnowledgeEntry.id))
                    .where(
                        and_(
                            KnowledgeEntry.company_id == company_id,
                            KnowledgeEntry.is_active.is_(True),
                            KnowledgeEntry.risk_level.isnot(None),
                        )
                    )
                    .group_by(KnowledgeEntry.risk_level)
                )
                distribution = {str(level): count for level, count in result.all()}
                if not distribution:
                    return "No risk data found. Upload documents to generate risk analysis."
                total = sum(distribution.values())
                lines = [
                    f"  {level.upper()}: {count} items ({round(count/total*100, 1)}%)"
                    for level, count in sorted(distribution.items())
                ]
                return f"Risk distribution (total: {total} items):\n" + "\n".join(lines)

        return asyncio.run(_query())

    return Tool(
        name="RiskSummary",
        func=get_risk_summary,
        description=(
            "Get the current risk distribution across the company's knowledge base. "
            "Input: ignored. "
            "Use this to understand the overall risk profile."
        ),
    )


def _make_calculator_tool():
    def calculate(expression: str) -> str:
        """Safely evaluate a mathematical expression."""
        allowed_names = {
            "abs": abs, "round": round, "min": min, "max": max,
            "sum": sum, "pow": pow, "sqrt": math.sqrt,
            "floor": math.floor, "ceil": math.ceil,
        }
        try:
            result = eval(expression, {"__builtins__": {}}, allowed_names)  # noqa: S307
            return str(result)
        except Exception as exc:
            return f"Calculation error: {exc}"

    return Tool(
        name="Calculator",
        func=calculate,
        description=(
            "Safely evaluate a mathematical expression. "
            "Input: a valid Python math expression (e.g. '1200 * 0.18' or 'round(5000/12, 2)'). "
            "Use for tax calculations, financial projections, or percentage computations."
        ),
    )


def _make_date_tool():
    return Tool(
        name="CurrentDate",
        func=lambda _: datetime.utcnow().strftime("%Y-%m-%d (UTC)"),
        description="Returns today's date. Use this whenever the current date is relevant.",
    )


# ---------------------------------------------------------------------------
# ReAct prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = (
    "You are an AI business advisor for SMEs. "
    "Always use the available tools to retrieve real data before answering. "
    "Never guess dates, deadlines, or numbers — use tools. "
    "Keep answers concise and actionable. "
    "Flag critical risks or deadlines prominently."
)


# ---------------------------------------------------------------------------
# Agent factory
# ---------------------------------------------------------------------------

def build_sme_agent(
    company_id: str,
    db_session_factory,
    country_code: str = "US",
    industry: Optional[str] = None,
    verbose: bool = False,
):
    """
    Build and return a fully configured SME advisor agent (LangGraph CompiledGraph).

    Args:
        company_id:         UUID of the company
        db_session_factory: Callable that returns an AsyncSession context manager
        country_code:       ISO country code for compliance rules
        industry:           Company industry string
        verbose:            Log agent reasoning steps
    """
    llm = _build_langchain_llm()

    tools = [
        _make_deadline_tool(company_id, db_session_factory),
        _make_compliance_tool(company_id, db_session_factory, country_code, industry),
        _make_document_search_tool(company_id, db_session_factory),
        _make_risk_tool(company_id, db_session_factory),
        _make_calculator_tool(),
        _make_date_tool(),
    ]

    return create_react_agent(model=llm, tools=tools, prompt=SYSTEM_PROMPT)


async def run_agent(
    query: str,
    company_id: str,
    db_session_factory,
    country_code: str = "US",
    industry: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Run the SME agent on a query and return structured output.
    Falls back to direct RAG if the agent fails.
    """
    import asyncio

    executor = build_sme_agent(
        company_id=company_id,
        db_session_factory=db_session_factory,
        country_code=country_code,
        industry=industry,
        verbose=False,
    )

    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: executor.invoke({"messages": [HumanMessage(content=query)]}),
        )
        messages = result.get("messages", [])
        # Final answer is the last AIMessage content
        answer = ""
        tools_used = []
        for msg in messages:
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                tools_used.extend(tc["name"] for tc in msg.tool_calls if "name" in tc)
            if hasattr(msg, "content") and msg.content and not getattr(msg, "tool_calls", None):
                answer = msg.content

        return {
            "answer": answer,
            "tools_used": tools_used,
            "steps": len(messages),
            "mode": "agent",
        }
    except Exception as exc:
        logger.warning("Agent failed (%s), falling back to RAG", exc)
        from app.services.rag_pipeline import rag_query
        async with db_session_factory() as db:
            return await rag_query(db, query, company_id)
