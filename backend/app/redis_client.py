"""Redis connection and helpers for rate limiting, feed cache, and counters."""
from __future__ import annotations

import json
from typing import Any

import redis.asyncio as redis

from app.config import settings

_pool: redis.Redis | None = None


def get_redis() -> redis.Redis:
    global _pool
    if _pool is None:
        _pool = redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    return _pool


async def close_redis() -> None:
    global _pool
    if _pool is not None:
        await _pool.aclose()
        _pool = None


# ---- Rate limiting (anti-spam) ----

def rate_key(user_hash: str) -> str:
    return f"choodundo:user:{user_hash}"


async def is_rate_limited(user_hash: str) -> bool:
    """Return True if this hash has voted within the rate-limit window."""
    r = get_redis()
    key = rate_key(user_hash)
    # SET key value NX EX <ttl> -> returns True only if newly set.
    was_set = await r.set(key, "1", nx=True, ex=settings.rate_limit_seconds)
    return not bool(was_set)


# ---- Live feed cache ----

FEED_KEY = "choodundo:feed"


async def push_feed_item(item: dict[str, Any]) -> None:
    r = get_redis()
    pipe = r.pipeline()
    pipe.lpush(FEED_KEY, json.dumps(item))
    pipe.ltrim(FEED_KEY, 0, settings.feed_max_items - 1)
    await pipe.execute()


async def get_feed(limit: int = 50) -> list[dict[str, Any]]:
    r = get_redis()
    limit = max(1, min(limit, settings.feed_max_items))
    raw = await r.lrange(FEED_KEY, 0, limit - 1)
    return [json.loads(x) for x in raw]


# ---- District counters (cache only; source of truth is Postgres) ----

def district_key(district: str) -> str:
    return f"district:{district.lower().replace(' ', '_')}"


# ---- Active users (sorted set keyed by last-seen timestamp) ----

ACTIVE_USERS_KEY = "choodundo:active_users"
ACTIVE_TTL_SECONDS = 120  # remove sessions not seen for 2 min


async def heartbeat(session_id: str) -> int:
    """Mark session as active and return current online count."""
    import time
    r = get_redis()
    now = int(time.time())
    pipe = r.pipeline()
    pipe.zadd(ACTIVE_USERS_KEY, {session_id: now})
    pipe.zremrangebyscore(ACTIVE_USERS_KEY, 0, now - ACTIVE_TTL_SECONDS)
    pipe.zcard(ACTIVE_USERS_KEY)
    results = await pipe.execute()
    return int(results[2])
