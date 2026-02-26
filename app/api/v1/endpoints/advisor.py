from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db
from app.api.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.knowledge import AdvisorQuery
from app.services.ai_service import answer_query, generate_embedding

router = APIRouter()


@router.post("/ask")
async def ask_advisor(
    query_data: AdvisorQuery,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company")
    
    query_embedding = await generate_embedding(query_data.query)
    
    sql = text("""
        SELECT id, title, content, knowledge_type, risk_level, deadline,
               embedding <=> :query_embedding as distance
        FROM knowledge_entries
        WHERE company_id = :company_id AND is_active = true
        ORDER BY distance
        LIMIT :limit
    """)
    
    result = await db.execute(
        sql,
        {
            "query_embedding": str(query_embedding),
            "company_id": str(current_user.company_id),
            "limit": query_data.context_limit
        }
    )
    
    relevant_entries = result.fetchall()
    
    if not relevant_entries:
        return {
            "query": query_data.query,
            "answer": "I don't have enough information to answer this question. Please upload relevant documents first.",
            "sources": []
        }
    
    context = "\n\n".join([
        f"[{entry.knowledge_type}] {entry.title}: {entry.content}"
        for entry in relevant_entries
    ])
    
    answer = await answer_query(query_data.query, context)
    
    return {
        "query": query_data.query,
        "answer": answer,
        "sources": [
            {
                "id": str(entry.id),
                "title": entry.title,
                "type": entry.knowledge_type,
                "risk_level": entry.risk_level
            }
            for entry in relevant_entries
        ]
    }
