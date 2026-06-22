"""Live feed endpoint, served from the Redis cache."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Query

from app.redis_client import get_feed
from app.schemas import FeedItem
from app.utils import relative_time

router = APIRouter(prefix="/api", tags=["feed"])


@router.get("/feed", response_model=list[FeedItem])
async def latest_feed(limit: int = Query(default=50, ge=1, le=100)) -> list[FeedItem]:
    items = await get_feed(limit)
    out: list[FeedItem] = []
    for it in items:
        # Recompute relative time so cached items stay fresh on each fetch.
        try:
            ts = datetime.fromisoformat(it["created_at"])
        except (KeyError, ValueError):
            ts = datetime.now(timezone.utc)
        out.append(
            FeedItem(
                id=it.get("id", ""),
                status=it.get("status", "HOT"),
                name=it.get("name", "Someone"),
                place=it.get("place", ""),
                district=it.get("district", ""),
                created_at=it.get("created_at", ts.isoformat()),
                time=relative_time(ts),
            )
        )
    return out
