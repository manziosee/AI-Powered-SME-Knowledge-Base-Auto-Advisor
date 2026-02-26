from pydantic import BaseModel, EmailStr, UUID4
from datetime import datetime
from typing import Optional


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
