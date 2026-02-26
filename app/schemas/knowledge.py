from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.models.knowledge_entry import KnowledgeType, RiskLevel


class KnowledgeEntryBase(BaseModel):
    knowledge_type: KnowledgeType
    title: str
    content: str
    risk_level: Optional[RiskLevel] = None
    deadline: Optional[datetime] = None


class KnowledgeEntryResponse(KnowledgeEntryBase):
    id: UUID4
    company_id: UUID4
    document_id: Optional[UUID4]
    tags: List[str]
    metadata: Dict[str, Any]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class AdvisorQuery(BaseModel):
    query: str
    context_limit: int = 5
