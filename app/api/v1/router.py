from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    advisor,
    analytics,
    api_keys,
    auth,
    chatbot,
    comments,
    companies,
    connectors,
    documents,
    insights,
    integrations,
    notifications,
    search,
    sessions,
    share_links,
    subscriptions,
    templates,
    two_factor,
)

api_router = APIRouter()

# ── Existing ──────────────────────────────────────────────────────────────────
api_router.include_router(auth.router,           prefix="/auth",           tags=["Authentication"])
api_router.include_router(documents.router,      prefix="/documents",      tags=["Documents"])
api_router.include_router(advisor.router,        prefix="/advisor",        tags=["AI Advisor"])
api_router.include_router(chatbot.router,        prefix="/chatbot",        tags=["Chatbot"])
api_router.include_router(analytics.router,      prefix="/analytics",      tags=["Analytics & Reports"])
api_router.include_router(notifications.router,  prefix="/notifications",  tags=["Notifications"])
api_router.include_router(companies.router,      prefix="/companies",      tags=["Companies"])
api_router.include_router(integrations.router,   prefix="/integrations",   tags=["Integrations"])
api_router.include_router(admin.router,          prefix="/admin",          tags=["Admin"])
api_router.include_router(insights.router,       prefix="/insights",       tags=["Business Insights"])
api_router.include_router(search.router,         prefix="/search",         tags=["Search"])

# ── New: 2FA ──────────────────────────────────────────────────────────────────
api_router.include_router(two_factor.router,     prefix="/auth/2fa",       tags=["Two-Factor Auth (2FA)"])

# ── New: API Keys ─────────────────────────────────────────────────────────────
api_router.include_router(api_keys.router,       prefix="/auth/api-keys",  tags=["API Keys"])

# ── New: Session management ───────────────────────────────────────────────────
api_router.include_router(sessions.router,       prefix="/auth/sessions",  tags=["Session Management"])

# ── New: Share links ──────────────────────────────────────────────────────────
api_router.include_router(share_links.router,    prefix="/share-links",    tags=["Document Sharing"])

# ── New: Document comments ────────────────────────────────────────────────────
api_router.include_router(comments.router,       prefix="/documents",      tags=["Document Comments"])

# ── New: Templates ────────────────────────────────────────────────────────────
api_router.include_router(templates.router,      prefix="/templates",      tags=["Document Templates"])

# ── New: Subscriptions & Billing ──────────────────────────────────────────────
api_router.include_router(subscriptions.router,  prefix="/subscriptions",  tags=["Subscriptions & Billing"])

# ── New: Accounting / Payroll Connectors ──────────────────────────────────────
api_router.include_router(connectors.router,     prefix="/connectors",     tags=["Accounting & Payroll Connectors"])
