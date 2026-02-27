from pydantic import BaseModel, EmailStr, UUID4
from datetime import datetime
from typing import Optional, Dict, Any


class CompanyCreate(BaseModel):
    name: str
    industry: Optional[str] = None
    country: str
    language: str = "en"
    tax_id: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    settings: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class CompanyResponse(BaseModel):
    id: UUID4
    name: str
    industry: Optional[str]
    country: str
    language: str
    tax_id: Optional[str]
    is_active: bool
    compliance_score: float
    created_at: datetime
    
    class Config:
        from_attributes = True
