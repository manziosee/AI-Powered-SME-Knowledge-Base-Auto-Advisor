"""
Application middleware stack.

1. RequestIDMiddleware   — attaches X-Request-ID to every request/response
2. GlobalErrorHandler    — catches unhandled exceptions, returns JSON (never stack traces)
3. RateLimitMiddleware   — sliding-window rate limiting backed by Redis
4. SecurityHeadersMiddleware — adds security-focused HTTP response headers
"""

import time
import uuid
import logging
import traceback
from typing import Callable, Optional

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.redis import get_redis

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 1.  Request ID  (traces requests across logs)
# ---------------------------------------------------------------------------

class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


# ---------------------------------------------------------------------------
# 2.  Global error handler  (never leak stack traces to clients)
# ---------------------------------------------------------------------------

class GlobalErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            return await call_next(request)
        except Exception as exc:
            request_id = getattr(request.state, "request_id", "unknown")
            logger.error(
                "Unhandled exception [request_id=%s] %s: %s\n%s",
                request_id,
                type(exc).__name__,
                exc,
                traceback.format_exc(),
            )
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error": "internal_server_error",
                    "message": "An unexpected error occurred. Please try again later.",
                    "request_id": request_id,
                },
            )


# ---------------------------------------------------------------------------
# 3.  Rate limiting — sliding window via Redis
#     Default: 100 requests / 60 seconds per IP
#     Auth endpoints:  20 requests / 60 seconds per IP
# ---------------------------------------------------------------------------

RATE_LIMIT_RULES = {
    "/api/v1/auth/login":           (20,  60),   # 20 req / 60 s
    "/api/v1/auth/forgot-password": (10,  60),   # 10 req / 60 s
    "/api/v1/auth/register":        (20,  60),
    "/api/v1/advisor/ask":          (60,  60),   # 60 req / 60 s
    "/api/v1/chatbot":              (120, 60),
    "default":                      (200, 60),   # 200 req / 60 s
}


def _get_limit(path: str):
    for prefix, rule in RATE_LIMIT_RULES.items():
        if prefix != "default" and path.startswith(prefix):
            return rule
    return RATE_LIMIT_RULES["default"]


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        redis = await get_redis()
        if not redis:
            # Redis unavailable — skip rate limiting rather than block all traffic
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        max_requests, window = _get_limit(path)

        key = f"ratelimit:{client_ip}:{path}"
        now = int(time.time())
        window_start = now - window

        pipe = redis.pipeline()
        pipe.zremrangebyscore(key, 0, window_start)
        pipe.zadd(key, {str(now) + str(uuid.uuid4()): now})
        pipe.zcard(key)
        pipe.expire(key, window)
        results = await pipe.execute()

        request_count = results[2]

        if request_count > max_requests:
            retry_after = window
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "rate_limit_exceeded",
                    "message": f"Too many requests. Limit: {max_requests} per {window}s.",
                    "retry_after": retry_after,
                },
                headers={"Retry-After": str(retry_after)},
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, max_requests - request_count))
        return response


# ---------------------------------------------------------------------------
# 4.  Security headers  (defence-in-depth)
# ---------------------------------------------------------------------------

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        response.headers.update({
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
            # Only add HSTS on production (HTTPS only)
            # "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        })
        return response
