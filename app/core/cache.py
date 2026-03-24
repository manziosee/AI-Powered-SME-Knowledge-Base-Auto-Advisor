"""
Redis caching utilities.

Usage:
    from app.core.cache import cache_get, cache_set, cache_delete, cached

    # Manual
    data = await cache_get("key")
    await cache_set("key", data, ttl=300)
    await cache_delete("key")

    # Decorator (async functions only)
    @cached(prefix="overview", ttl=120)
    async def get_overview(company_id: str): ...
"""

import json
import logging
from functools import wraps
from typing import Any, Callable, Optional

from app.core.config import settings
from app.core.redis import get_redis

logger = logging.getLogger(__name__)

DEFAULT_TTL = settings.REDIS_CACHE_TTL  # default from config (3600 s)


async def cache_get(key: str) -> Optional[Any]:
    """Return deserialized value from Redis, or None on miss/error."""
    try:
        redis = await get_redis()
        if not redis:
            return None
        raw = await redis.get(key)
        return json.loads(raw) if raw else None
    except Exception:
        logger.warning("cache_get failed for key=%s", key, exc_info=True)
        return None


async def cache_set(key: str, value: Any, ttl: int = DEFAULT_TTL) -> bool:
    """Serialize value to JSON and store in Redis with TTL."""
    try:
        redis = await get_redis()
        if not redis:
            return False
        await redis.setex(key, ttl, json.dumps(value, default=str))
        return True
    except Exception:
        logger.warning("cache_set failed for key=%s", key, exc_info=True)
        return False


async def cache_delete(key: str) -> bool:
    try:
        redis = await get_redis()
        if not redis:
            return False
        await redis.delete(key)
        return True
    except Exception:
        logger.warning("cache_delete failed for key=%s", key, exc_info=True)
        return False


async def cache_delete_pattern(pattern: str) -> int:
    """Delete all keys matching a pattern (use sparingly on large datasets)."""
    try:
        redis = await get_redis()
        if not redis:
            return 0
        keys = await redis.keys(pattern)
        if keys:
            return await redis.delete(*keys)
        return 0
    except Exception:
        logger.warning("cache_delete_pattern failed for pattern=%s", pattern, exc_info=True)
        return 0


def cached(prefix: str, ttl: int = DEFAULT_TTL, key_args: Optional[list] = None):
    """
    Decorator for caching async function results.

    Args:
        prefix:   Cache key prefix (e.g. "overview")
        ttl:      TTL in seconds
        key_args: List of argument names to include in the cache key.
                  Defaults to all positional args joined by ":".

    Example:
        @cached(prefix="company_overview", ttl=120)
        async def get_overview(company_id: str): ...
        # cache key → "company_overview:<company_id>"
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Build cache key from selected args
            if key_args:
                parts = [str(kwargs.get(a, "")) for a in key_args]
            else:
                parts = [str(a) for a in args] + [f"{k}={v}" for k, v in kwargs.items()]

            cache_key = f"{prefix}:" + ":".join(parts)

            cached_value = await cache_get(cache_key)
            if cached_value is not None:
                return cached_value

            result = await func(*args, **kwargs)
            await cache_set(cache_key, result, ttl=ttl)
            return result

        return wrapper
    return decorator


# ---------------------------------------------------------------------------
# Namespace helpers — invalidate all cache for a company
# ---------------------------------------------------------------------------

async def invalidate_company_cache(company_id: str) -> int:
    """Invalidate all cached data for a specific company."""
    return await cache_delete_pattern(f"*:{company_id}*")
