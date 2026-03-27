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

    yield

    # Shutdown
    await close_redis()
    await engine.dispose()


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

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
        "All endpoints (except `/health` and `/auth/*`) require a Bearer JWT token.\n"
        "Obtain tokens via `POST /api/v1/auth/login`."
    ),
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    lifespan=lifespan,
)

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
