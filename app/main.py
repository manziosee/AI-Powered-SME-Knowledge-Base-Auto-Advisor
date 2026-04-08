from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import RedirectResponse, JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import engine
from app.core.middleware import (
    GlobalErrorHandlerMiddleware,
    RateLimitMiddleware,
    RequestIDMiddleware,
    SecurityHeadersMiddleware,
)
from app.core.redis import close_redis, init_redis


# ---------------------------------------------------------------------------
# Lifespan — startup / shutdown hooks
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_redis()

    # Seed default compliance rules on first boot (idempotent)
    try:
        from sqlalchemy.ext.asyncio import AsyncSession
        from app.core.database import AsyncSessionLocal
        from app.services.compliance_service import seed_default_rules
        async with AsyncSessionLocal() as db:
            count = await seed_default_rules(db)
            if count:
                import logging
                logging.getLogger(__name__).info("Seeded %d compliance rules", count)
    except Exception:
        pass  # non-fatal — rules can be seeded via admin API later

    # Seed super admin user on first boot
    try:
        from sqlalchemy import select as sa_select
        from app.models.user import User, UserRole
        from app.core.security import get_password_hash
        import logging as _logging
        async with AsyncSessionLocal() as db:
            _existing = await db.execute(sa_select(User).where(User.email == "admin@admin.com"))
            if not _existing.scalar_one_or_none():
                _admin = User(
                    email="admin@admin.com",
                    hashed_password=get_password_hash("123456789"),
                    full_name="System Administrator",
                    role=UserRole.SUPER_ADMIN,
                    is_active=True,
                    is_verified=True,
                    company_id=None,
                )
                db.add(_admin)
                await db.commit()
                _logging.getLogger(__name__).info("Created default super admin: admin@admin.com")
    except Exception as _e:
        pass  # non-fatal

    yield

    # Shutdown
    await close_redis()
    await engine.dispose()


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

_OPENAPI_TAGS = [
    {
        "name": "Authentication",
        "description": (
            "Register, login, logout, refresh tokens, forgot/reset password, and profile management.\n\n"
            "**Registration flows:**\n"
            "- `account_type=company` — creates a company, user becomes `super_admin`\n"
            "- `account_type=individual` — personal account, `individual` role, no company\n\n"
            "- `POST /auth/login` — returns `access_token` (30 min) + `refresh_token` (7 days)\n"
            "- `POST /auth/refresh` — auto-called by the frontend on 401; rotates both tokens\n"
            "- `POST /auth/forgot-password` — sends reset email via SMTP; returns token in dev mode\n"
            "- Account locked **15 min** after 5 consecutive failed login attempts\n"
            "- If 2FA is enabled, login returns HTTP 403 `{code: '2fa_required', user_id}` — "
            "complete with `POST /auth/2fa/validate`"
        ),
    },
    {
        "name": "Two-Factor Auth (2FA)",
        "description": (
            "TOTP-based two-factor authentication (Google Authenticator, Authy, etc.).\n\n"
            "**Setup flow:** `POST /auth/2fa/setup` → scan QR → `POST /auth/2fa/verify`\n\n"
            "**Login flow (when 2FA enabled):** `POST /auth/login` returns 403 `2fa_required` "
            "→ `POST /auth/2fa/validate` with `user_id` + 6-digit code → JWT tokens issued\n\n"
            "**Disable:** `POST /auth/2fa/disable` (requires current TOTP code)"
        ),
    },
    {
        "name": "API Keys",
        "description": (
            "Manage long-lived API keys for programmatic / CI access.\n\n"
            "- Keys are prefixed `sk_` and shown **once** at creation — store immediately\n"
            "- Scopes: `read`, `write`, `admin`\n"
            "- Pass via `X-API-Key: sk_...` header as an alternative to Bearer JWT\n"
            "- Optional expiry in days; `last_used_at` tracked automatically"
        ),
    },
    {
        "name": "Session Management",
        "description": (
            "View and revoke active login sessions across all devices.\n\n"
            "- Each login creates a `UserSession` row with IP, user-agent, and refresh token JTI\n"
            "- `DELETE /auth/sessions/{id}` blacklists the session's refresh token in Redis immediately\n"
            "- `DELETE /auth/sessions` revokes **all** sessions except the current one"
        ),
    },
    {
        "name": "Documents",
        "description": (
            "Upload, manage, and search business documents.\n\n"
            "**Supported formats:** PDF, DOCX, XLSX, DOC, XLS, TXT (max 50 MB)\n\n"
            "**Processing pipeline (async via Celery):**\n"
            "text extraction → OCR fallback → NER (spaCy) → classify → summarise → "
            "chunk → embed (384-dim) → knowledge extraction → pgvector index\n\n"
            "**Versioning:** re-uploading the same filename creates a new version; "
            "`doc_metadata.previous_version_id` links to the prior version."
        ),
    },
    {
        "name": "Document Sharing",
        "description": (
            "Generate time-limited, optionally password-protected share links for documents.\n\n"
            "- No recipient account required — share with lawyers, auditors, clients\n"
            "- Optional: password protection, expiry hours, max view count\n"
            "- `GET /share-links/{token}` is public (no auth); returns document metadata\n"
            "- `POST /share-links/{token}/view` unlocks password-protected links"
        ),
    },
    {
        "name": "Document Comments",
        "description": (
            "Threaded comments and annotations on documents for team collaboration.\n\n"
            "- Supports nested replies via `parent_id`\n"
            "- Authors can edit their own comments; admins can delete any comment\n"
            "- `is_edited` flag set automatically on update"
        ),
    },
    {
        "name": "Document Templates",
        "description": (
            "Pre-built and company-specific document templates by industry and country.\n\n"
            "- Filter by `category`, `country_code`, `industry`, or free-text `search`\n"
            "- `POST /templates/{id}/use` fills `{{placeholder}}` fields and returns rendered content\n"
            "- Admins can create public platform templates; others create private company templates\n"
            "- `usage_count` tracked per template"
        ),
    },
    {
        "name": "AI Advisor",
        "description": (
            "Ask questions in plain English against your company's knowledge base.\n\n"
            "**RAG pipeline:** embed query → dense (pgvector cosine) + sparse (BM25) retrieval → "
            "RRF fusion → contextual compression → Groq LLaMA 3.3 70B answer with cited sources\n\n"
            "- `POST /advisor/ask` — fast path (no compression)\n"
            "- `POST /advisor/ask-agent` — ReAct agent with tools (DeadlineLookup, ComplianceCheck, etc.)\n"
            "- `GET /advisor/stream` — Server-Sent Events token streaming"
        ),
    },
    {
        "name": "Chatbot",
        "description": (
            "Multi-turn conversational AI with persistent session history.\n\n"
            "- Sessions stored in PostgreSQL; context window = last 20 turns\n"
            "- `POST /chatbot/sessions/{id}/messages/feedback` — thumbs up/down rating\n"
            "- Each session is scoped to a company (multi-tenant isolation)"
        ),
    },
    {
        "name": "Analytics & Reports",
        "description": (
            "Dashboard KPIs, compliance gap analysis, risk distribution, and report export.\n\n"
            "- `GET /analytics/overview` — document counts, knowledge entries, alerts\n"
            "- `GET /analytics/compliance-score` — gap analysis vs country-specific rules\n"
            "- `POST /analytics/export` — stream PDF or Excel report\n"
            "- `GET /analytics/export-knowledge` — download all knowledge entries as CSV/Excel\n"
            "- `POST /analytics/schedule` — schedule recurring email reports (cron expression)\n"
            "- All data scoped to the authenticated user's company"
        ),
    },
    {
        "name": "Notifications",
        "description": (
            "In-app notifications for document processing, deadline alerts, and compliance changes.\n\n"
            "- `GET /notifications/unread-count` — badge count for the UI\n"
            "- `PATCH /notifications/{id}/read` — mark single as read\n"
            "- `POST /notifications/read-all` — bulk mark all read\n"
            "- Real-time push via WebSocket (see **Real-time** tag)"
        ),
    },
    {
        "name": "Companies",
        "description": (
            "Company profile management and team administration.\n\n"
            "- `GET /companies/me` — current user's company\n"
            "- `POST /companies/me/invite` — invite a team member by email (sends invite link)\n"
            "- `GET /companies/invite/{token}` — validate an invite token (public)\n"
            "- Role hierarchy: `EMPLOYEE < MANAGER < ADMIN < SUPER_ADMIN`\n"
            "- Super Admins can create and delete companies"
        ),
    },
    {
        "name": "Integrations",
        "description": (
            "Webhook registration and third-party connector management.\n\n"
            "- Outbound webhooks signed with HMAC-SHA256 (`X-AdvisorAI-Signature-256`)\n"
            "- Supported event triggers: `document.processed`, `compliance.alert`, "
            "`deadline.reminder`, `training.completed`\n"
            "- `POST /integrations/{id}/test` — send a test payload to verify your endpoint"
        ),
    },
    {
        "name": "Accounting & Payroll Connectors",
        "description": (
            "Real connectors to accounting and payroll systems.\n\n"
            "- **QuickBooks Online** — `POST /connectors/quickbooks/connect`, `GET /connectors/quickbooks/invoices`\n"
            "- **Xero** — `POST /connectors/xero/connect`, `GET /connectors/xero/contacts`\n"
            "- **MTN MoMo** — `POST /connectors/mtn-momo/webhook` (public, receives payment callbacks)\n"
            "- **Airtel Money** — `POST /connectors/airtel-money/webhook` (public)\n"
            "- `GET /connectors/` — list all configured connectors for the company"
        ),
    },
    {
        "name": "Subscriptions & Billing",
        "description": (
            "Stripe-backed subscription management.\n\n"
            "**Plans:** Free · Starter ($29/mo) · Professional ($79/mo) · Enterprise (custom)\n\n"
            "- `POST /subscriptions/checkout` — create Stripe Checkout session\n"
            "- `POST /subscriptions/portal` — Stripe billing portal (manage payment methods)\n"
            "- `POST /subscriptions/webhook` — Stripe webhook receiver (not in Swagger UI)\n"
            "- `PUT /subscriptions/me/cancel` — cancel at period end"
        ),
    },
    {
        "name": "Admin",
        "description": (
            "System administration. Requires `admin` or `super_admin` role (or specific permissions).\n\n"
            "**super_admin only:** user CRUD, company management, compliance rule CRUD, seed rules\n\n"
            "**admin+:** system stats, audit logs, ML model status/training, health alerts, LLM status\n\n"
            "**Permission-based access (no role required):**\n"
            "- `GET /admin/ml/status` \u2014 also accessible with `can_view_ai_training` permission\n"
            "- `POST /admin/ml/train-risk-scorer` \u2014 also accessible with `can_train_model` permission\n"
            "- `POST /admin/ml/predict-risk` \u2014 also accessible with `can_view_ai_training` permission\n\n"
            "**Audit log actions tracked:** `update_permissions` (includes added/removed permission lists), "
            "plus all document, user, and company mutations."
        ),
    },
    {
        "name": "Business Insights",
        "description": (
            "AI-generated business insights derived from the company's knowledge base.\n\n"
            "- `GET /insights/health` — aggregate 0–100 business health score with component breakdown\n"
            "- `GET /insights/calendar` — upcoming compliance deadlines (statutory + document-specific)\n"
            "- `GET /insights/expiry` — documents expiring within N days"
        ),
    },
    {
        "name": "Search",
        "description": (
            "Unified full-text + semantic search across documents and knowledge entries.\n\n"
            "- Keyword search via PostgreSQL `ILIKE` on filename, summary, extracted text\n"
            "- Results ranked: exact title matches first, then by recency\n"
            "- Scoped to the authenticated user's company"
        ),
    },
    {
        "name": "Real-time (WebSocket)",
        "description": (
            "WebSocket endpoint for real-time notification push.\n\n"
            "**Connect:** `wss://<host>/api/v1/ws/notifications?token=<access_token>`\n\n"
            "**Server sends:**\n"
            "```json\n"
            "{\"type\": \"notification\", \"data\": {\"id\": \"...\", \"title\": \"...\", \"message\": \"...\"}}\n"
            "{\"type\": \"pong\", \"data\": {}}\n"
            "```\n\n"
            "**Client sends:** `ping` → server replies `pong` (keep-alive every 30s)\n\n"
            "Multi-tab supported — all connections for a user receive the same events."
        ),
    },
    {
        "name": "Health",
        "description": (
            "Service health check. Returns status of API, PostgreSQL, and Redis.\n\n"
            "`GET /health` — no auth required. Used by Docker health checks and load balancers."
        ),
    },
]

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "AI-Powered Knowledge Base & Auto Advisor for SMEs.\n\n"
        "## Features\n"
        "- **Document Management** — upload, classify, version-control, bulk-delete, bulk-tag\n"
        "- **AI Knowledge Extraction** — obligations, deadlines, risks, metrics via Groq LLaMA 3.3 70B\n"
        "- **RAG Advisor** — hybrid dense+sparse retrieval, RRF fusion, contextual compression, SSE streaming\n"
        "- **Agent Mode** — ReAct agent with tools (DeadlineLookup, ComplianceCheck, Calculator)\n"
        "- **Conversational Chatbot** — multi-turn sessions with persistent history\n"
        "- **Compliance Engine** — country-specific rules (RW, KE, NG, ZA, FR, US, EU/GDPR), gap analysis\n"
        "- **Analytics & Export** — dashboards, PDF/Excel reports, CSV knowledge export, scheduled email reports\n"
        "- **Document Sharing** — time-limited signed links with optional password + view limits\n"
        "- **Document Comments** — threaded annotations for team collaboration\n"
        "- **Document Templates** — pre-built SME templates with AI placeholder filling\n"
        "- **2FA (TOTP)** — Google Authenticator / Authy support\n"
        "- **API Keys** — scoped long-lived keys (`sk_` prefix) as JWT alternative\n"
        "- **Session Management** — view and force-revoke active sessions\n"
        "- **Subscriptions** — Stripe-backed Free/Starter/Professional/Enterprise plans\n"
        "- **Connectors** — QuickBooks, Xero, MTN MoMo, Airtel Money\n"
        "- **Real-time** — WebSocket push notifications\n"
        "- **Integrations** — HMAC-signed outbound webhooks\n"
        "- **OCR** — Tesseract fallback for scanned PDFs\n"
        "- **Data Retention** — GDPR/RPDP-compliant auto-archival via Celery beat\n"
        "- **RBAC + Permissions** — role-based access + fine-grained per-user permission overrides\n"
        "- **User Invites** — email-based invite flow with 7-day token, role pre-assignment\n"
        "- **Audit Trail** — every mutation logged including permission changes\n\n"
        "## Authentication\n"
        "All protected endpoints require a Bearer JWT in the `Authorization` header.\n"
        "```\nAuthorization: Bearer <access_token>\n```\n"
        "Alternatively pass `X-API-Key: sk_...` for programmatic access.\n"
        "Obtain tokens via `POST /api/v1/auth/login`.\n\n"
        "## 2FA Login Flow\n"
        "If 2FA is enabled, `POST /auth/login` returns HTTP 403 with "
        "`{\"code\": \"2fa_required\", \"user_id\": \"...\"}`. "
        "Complete login with `POST /auth/2fa/validate`.\n\n"
        "## Rate Limits\n"
        "| Endpoint group | Limit |\n"
        "|---|---|\n"
        "| Login / Register | 20 req / 60 s |\n"
        "| Forgot password | 10 req / 60 s |\n"
        "| AI Advisor | 60 req / 60 s |\n"
        "| Chatbot | 120 req / 60 s |\n"
        "| All other | 200 req / 60 s |\n\n"
        "## Security\n"
        "- JWT HS256, 30-min access tokens, 7-day refresh tokens\n"
        "- Account locked 15 min after 5 consecutive failed logins\n"
        "- Refresh token blacklist in Redis on logout/session-revoke\n"
        "- HSTS, CSP, X-Frame-Options, and other security headers in production\n"
        "- Sliding-window rate limiting backed by Redis\n"
        "- All requests carry an `X-Request-ID` trace header"
    ),
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    openapi_tags=_OPENAPI_TAGS,
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Custom OpenAPI — inject Bearer security scheme so "Authorize" button works
# ---------------------------------------------------------------------------

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    from fastapi.openapi.utils import get_openapi
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        tags=_OPENAPI_TAGS,
        routes=app.routes,
    )
    schema.setdefault("components", {})
    schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Paste your `access_token` from POST /auth/login",
        },
        "ApiKeyAuth": {
            "type": "apiKey",
            "in": "header",
            "name": "X-API-Key",
            "description": "Long-lived API key (sk_...) as an alternative to Bearer JWT",
        },
    }
    # Public endpoints that need no auth
    _PUBLIC_PATHS = {
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/auth/forgot-password",
        "/api/v1/auth/reset-password",
        "/api/v1/auth/2fa/validate",
        "/api/v1/share-links/{token}",
        "/api/v1/share-links/{token}/view",
        "/api/v1/companies/invite/{token}",
        "/api/v1/connectors/mtn-momo/webhook",
        "/api/v1/connectors/airtel-money/webhook",
        "/api/v1/subscriptions/webhook",
        "/health",
    }
    for path, path_item in schema.get("paths", {}).items():
        for operation in path_item.values():
            if not isinstance(operation, dict):
                continue
            if path in _PUBLIC_PATHS:
                operation["security"] = []
            else:
                operation.setdefault(
                    "security",
                    [{"BearerAuth": []}, {"ApiKeyAuth": []}],
                )
    app.openapi_schema = schema
    return schema


app.openapi = custom_openapi  # type: ignore[method-assign]

# ---------------------------------------------------------------------------
# Middleware  (order matters — outermost = first to handle request)
# ---------------------------------------------------------------------------

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(GlobalErrorHandlerMiddleware)
app.add_middleware(RequestIDMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# WebSocket routes (registered directly, not under the REST router)
from app.api.v1.endpoints.websockets import router as ws_router
app.include_router(ws_router, prefix=f"{settings.API_V1_PREFIX}/ws", tags=["Real-time (WebSocket)"])


# ---------------------------------------------------------------------------
# Root — friendly landing instead of 404
# ---------------------------------------------------------------------------

@app.get("/", include_in_schema=False)
async def root():
    return JSONResponse({
        "name": "AdvisorAI API",
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs": "/docs",
        "health": "/health",
    })


# ---------------------------------------------------------------------------
# Docs shortcuts — /docs and /swagger both redirect to the Swagger UI
# ---------------------------------------------------------------------------

@app.get("/docs", include_in_schema=False)
async def docs_redirect():
    return RedirectResponse(url=f"{settings.API_V1_PREFIX}/docs")


@app.get("/swagger", include_in_schema=False)
async def swagger_redirect():
    return RedirectResponse(url=f"{settings.API_V1_PREFIX}/docs")


@app.get("/redoc", include_in_schema=False)
async def redoc_redirect():
    return RedirectResponse(url=f"{settings.API_V1_PREFIX}/redoc")


# ---------------------------------------------------------------------------
# Health check  (checks DB + Redis connectivity)
# ---------------------------------------------------------------------------

@app.get("/health", tags=["Health"], summary="Service health check")
async def health_check():
    from app.core.redis import get_redis
    from sqlalchemy import text
    from app.core.celery_app import celery_app

    checks = {"api": "ok", "version": settings.APP_VERSION}

    # Database
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as exc:
        checks["database"] = f"error: {exc}"

    # Redis
    try:
        redis = await get_redis()
        if redis:
            await redis.ping()
            checks["redis"] = "ok"
        else:
            checks["redis"] = "not connected"
    except Exception as exc:
        checks["redis"] = f"error: {exc}"

    # Celery workers
    try:
        inspect = celery_app.control.inspect()
        active_workers = inspect.active() or {}
        worker_count = len(active_workers)
        checks["celery"] = f"{worker_count} workers" if worker_count > 0 else "no workers running"
    except Exception as exc:
        checks["celery"] = f"error: {exc}"

    # Document processing queue
    try:
        redis = await get_redis()
        if redis:
            doc_queue_len = await redis.llen("celery")
            checks["processing_queue"] = f"{doc_queue_len} pending tasks"
        else:
            checks["processing_queue"] = "redis not available"
    except Exception as exc:
        checks["processing_queue"] = f"error: {exc}"

    overall = "healthy" if all(v == "ok" for k, v in checks.items() if k not in ["version", "celery", "processing_queue"]) else "degraded"
    return {"status": overall, **checks}
