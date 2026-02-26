from pydantic import BaseModel, EmailStr, UUID4
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.models.user import UserRole
from app.models.document import DocumentType, DocumentStatus
from app.models.knowledge_entry import KnowledgeType, RiskLevel


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.EMPLOYEE


class UserCreate(UserBase):
    password: str
    company_id: Optional[UUID4] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: UUID4
    is_active: bool
    is_verified: bool
    company_id: Optional[UUID4]
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# Document Schemas
class DocumentBase(BaseModel):
    filename: str
    document_type: DocumentType = DocumentType.OTHER


class DocumentUpdate(BaseModel):
    document_type: Optional[DocumentType] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class DocumentResponse(DocumentBase):
    id: UUID4
    company_id: UUID4
    original_filename: str
    file_size: int
    mime_type: str
    status: DocumentStatus
    version: int
    summary: Optional[str]
    tags: List[str]
    metadata: Dict[str, Any]
    created_at: datetime
    processed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# Knowledge Schemas
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


# Company Schemas
class CompanyBase(BaseModel):
    name: str
    industry: Optional[str] = None
    country: str
    language: str = "en"


class CompanyResponse(CompanyBase):
    id: UUID4
    tax_id: Optional[str]
    is_active: bool
    compliance_score: float
    created_at: datetime
    
    class Config:
        from_attributes = True
