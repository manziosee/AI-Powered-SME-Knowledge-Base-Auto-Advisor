from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.models.document import DocumentType, DocumentStatus


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
