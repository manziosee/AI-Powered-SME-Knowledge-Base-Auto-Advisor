from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    advisor,
    analytics,
    auth,
    chatbot,
    companies,
    documents,
    insights,
    integrations,
    notifications,
)

api_router = APIRouter()

api_router.include_router(auth.router,          prefix="/auth",          tags=["Authentication"])
api_router.include_router(documents.router,     prefix="/documents",     tags=["Documents"])
api_router.include_router(advisor.router,       prefix="/advisor",       tags=["AI Advisor"])
api_router.include_router(chatbot.router,       prefix="/chatbot",       tags=["Chatbot"])
api_router.include_router(analytics.router,     prefix="/analytics",     tags=["Analytics & Reports"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(companies.router,     prefix="/companies",     tags=["Companies"])
api_router.include_router(integrations.router,  prefix="/integrations",  tags=["Integrations"])
api_router.include_router(admin.router,         prefix="/admin",         tags=["Admin"])
api_router.include_router(insights.router,      prefix="/insights",      tags=["Business Insights"])
