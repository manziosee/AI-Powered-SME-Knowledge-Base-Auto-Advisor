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
            "Register, login, logout, refresh tokens, forgot/reset password, "
            "and profile management. Login returns `access_token` (30 min) and "
            "`refresh_token` (7 days). Account is locked for 15 minutes after 5 "
            "consecutive failed login attempts."
        ),
    },
    {
        "name": "Documents",
        "description": (
            "Upload single or bulk documents (PDF, DOCX, XLSX, DOC, XLS, TXT). "
            "Processing (text extraction → chunking → embedding → knowledge extraction) "
            "runs asynchronously via Celery. Supports semantic search, versioning, "
            "presigned S3 download URLs, and metadata updates."
        ),
    },
    {
        "name": "AI Advisor",
        "description": (
            "Ask questions in plain English against your company's knowledge base. "
            "Uses RAG (Retrieve-Augment-Generate) with pgvector cosine similarity "
            "search and Groq LLaMA 3.3 70B for generation. Returns cited sources."
        ),
    },
    {
        "name": "Chatbot",
        "description": (
            "Multi-turn conversational AI with session history stored in Redis. "
            "Maintains context across messages. Each session is scoped to a company."
        ),
    },
    {
        "name": "Analytics & Reports",
        "description": (
            "Dashboard KPIs, compliance gap analysis, risk distribution breakdown, "
            "document type stats, and PDF/Excel report export. All data is "
            "scoped to the authenticated user's company."
        ),
    },
    {
        "name": "Notifications",
        "description": (
            "System notifications for document processing status, deadline alerts, "
            "and compliance updates. Supports mark-as-read and bulk operations."
        ),
    },
    {
        "name": "Companies",
        "description": (
            "Company profile management and team administration. Admins can invite "
            "members, update roles (employee → manager → admin), and remove users. "
            "Super Admins can create and delete companies."
        ),
    },
    {
        "name": "Integrations",
        "description": (
            "Webhook registration and third-party connector management "
            "(accounting, HR, ERP systems). Webhook payloads are signed with "
            "HMAC-SHA256 for verification."
        ),
    },
    {
        "name": "Admin",
        "description": (
            "System administration endpoints. Requires `admin` or `super_admin` role.\n\n"
            "**super_admin** endpoints: user CRUD, company management, compliance rule CRUD, seed rules.\n\n"
            "**admin** endpoints: system stats, audit logs, ML model status/training, health alerts."
        ),
    },
    {
        "name": "Business Insights",
        "description": (
            "AI-generated business insights and trend analysis derived from the "
            "company's knowledge base. Proactive recommendations and risk summaries."
        ),
    },
    {
        "name": "Search",
        "description": (
            "Unified semantic search across documents and knowledge entries using "
            "pgvector. Returns ranked results by cosine similarity."
        ),
    },
    {
        "name": "Health",
        "description": "Service health check. Returns status of API, database, and Redis connections.",
    },
]

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "AI-Powered Knowledge Base & Auto Advisor for SMEs.\n\n"
        "## Features\n"
        "- **Document Management** — upload, classify, version-control business documents\n"
        "- **AI Knowledge Extraction** — extract obligations, deadlines, risks, metrics\n"
        "- **Semantic Search** — query your knowledge base with natural language\n"
        "- **Conversational Chatbot** — multi-turn AI advisor with session history\n"
        "- **Compliance Engine** — country-specific rules, gap analysis, score tracking\n"
        "- **Analytics & Export** — dashboards, PDF/Excel reports\n"
        "- **Integrations** — webhooks, accounting/HR/ERP connectors\n\n"
        "## Authentication\n"
        "All protected endpoints require a Bearer JWT token in the `Authorization` header.\n"
        "```\nAuthorization: Bearer <access_token>\n```\n"
        "Obtain tokens via `POST /api/v1/auth/login`. Use the **Authorize** button above "
        "to set your token for all try-it-out requests.\n\n"
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
        "- Refresh token blacklist in Redis on logout\n"
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
        }
    }
    # Apply BearerAuth as default security to every operation
    for path_item in schema.get("paths", {}).values():
        for operation in path_item.values():
            if isinstance(operation, dict) and "tags" in operation:
                tags = operation.get("tags", [])
                # Auth endpoints don't need a token (login/register/etc)
                # but still mark them so they can opt-in if needed
                if "Authentication" not in tags:
                    operation.setdefault("security", [{"BearerAuth": []}])
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

    overall = "healthy" if all(v == "ok" for k, v in checks.items() if k != "version") else "degraded"
    return {"status": overall, **checks}
