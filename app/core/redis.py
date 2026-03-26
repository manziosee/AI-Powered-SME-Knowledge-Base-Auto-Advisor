import logging
import re
import redis.asyncio as aioredis
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

redis_client: Optional[aioredis.Redis] = None


async def get_redis() -> Optional[aioredis.Redis]:
    return redis_client


def _fix_redis_url(url: str) -> str:
    """Upstash only supports DB 0 — strip any /N suffix."""
    return re.sub(r"/\d+$", "/0", url)


async def init_redis():
    global redis_client
    try:
        url = _fix_redis_url(settings.REDIS_URL)
        redis_client = await aioredis.from_url(
            url,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
        )
        await redis_client.ping()
        logger.info("Redis connected: %s", url.split("@")[-1])
    except Exception as exc:
        logger.warning("Redis unavailable — running without cache/rate-limiting: %s", exc)
        redis_client = None


async def close_redis():
    global redis_client
    if redis_client:
        try:
            await redis_client.close()
        except Exception:
            pass
