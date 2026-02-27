from fastapi import APIRouter
from app.api.v1.endpoints import auth, documents, advisor, analytics

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(advisor.router, prefix="/advisor", tags=["AI Advisor"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
