"""Live feed endpoint, served from the Redis cache."""
from __future__ import annotations

import re
from datetime import datetime, timezone

from fastapi import APIRouter, Query

from app.redis_client import get_feed
from app.schemas import FeedItem
from app.utils import relative_time

router = APIRouter(prefix="/api", tags=["feed"])

_VALID_DISTRICTS = {
    "Kasaragod", "Kannur", "Wayanad", "Kozhikode", "Malappuram",
    "Palakkad", "Thrissur", "Ernakulam", "Idukki", "Kottayam",
    "Alappuzha", "Pathanamthitta", "Kollam", "Thiruvananthapuram",
}
_HTML_RE = re.compile(r"<[^>]+>")
_ALL_CAPS_RE = re.compile(r"^[A-Z'.\-]+$")


def _is_clean(place: str, district: str) -> bool:
    if district not in _VALID_DISTRICTS:
        return False
    if _HTML_RE.search(place):
        return False
    if len(place) > 4 and _ALL_CAPS_RE.match(place):
        return False
    if len(place) > 4:
        lower = place.lower()
        mc = max(set(lower), key=lower.count)
        if lower.count(mc) / len(lower) > 0.70:
            return False
    return True


@router.get("/feed", response_model=list[FeedItem])
async def latest_feed(limit: int = Query(default=50, ge=1, le=100)) -> list[FeedItem]:
    items = await get_feed(limit * 2)  # fetch extra to compensate for filtered-out spam
    out: list[FeedItem] = []
    for it in items:
        place = it.get("place", "")
        district = it.get("district", "")
        if not _is_clean(place, district):
            continue
        try:
            ts = datetime.fromisoformat(it["created_at"])
        except (KeyError, ValueError):
            ts = datetime.now(timezone.utc)
        out.append(
            FeedItem(
                id=it.get("id", ""),
                status=it.get("status", "HOT"),
                name=it.get("name", "Someone"),
                place=place,
                district=district,
                created_at=it.get("created_at", ts.isoformat()),
                time=relative_time(ts),
            )
        )
        if len(out) >= limit:
            break
    return out
