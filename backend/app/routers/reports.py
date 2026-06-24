"""Report submission endpoint with anti-spam, WS broadcast, and counter updates."""
from __future__ import annotations

import logging
import re

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.kerala import normalize_district
from app.database import get_db
from app.models import Report
from app.redis_client import is_rate_limited, push_feed_item
from app.schemas import FeedItem, ReportCreate, ReportSubmitResponse
from app.services import create_report, get_district_percentage
from app.utils import compute_user_hash, random_name, relative_time
from app.websocket_manager import manager

logger = logging.getLogger("choodundo.reports")

_HTML_RE = re.compile(r"<[^>]+>")
_LETTER_RE = re.compile(r"[a-zA-Zഀ-ൿ]")
# ALL-CAPS with no spaces and no lowercase = dictionary-word spam (ALLOCATIONS, ABRAM, etc.)
_ALL_CAPS_RE = re.compile(r"^[A-Z'.\-]+$")


def _sanitize_place(name: str) -> str | None:
    """Return cleaned place name, or None if it looks like spam/injection."""
    name = name.strip()
    if _HTML_RE.search(name):
        return None
    if not _LETTER_RE.search(name):
        return None
    # Reject strings that are >70% the same character (BBBBB...)
    if len(name) > 4:
        lower = name.lower()
        most_common = max(set(lower), key=lower.count)
        if lower.count(most_common) / len(lower) > 0.70:
            return None
    # Reject ALL-CAPS no-space words — real Kerala places always have mixed case or spaces
    if len(name) > 4 and _ALL_CAPS_RE.match(name):
        return None
    return name

router = APIRouter(prefix="/api", tags=["reports"])


@router.post("/reports", response_model=ReportSubmitResponse)
async def submit_report(
    payload: ReportCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> ReportSubmitResponse:
    user_hash = compute_user_hash(request)

    # Anti-spam: if this fingerprint voted within the window, return 200 but
    # silently skip the write (do not leak the block to trolls/bots).
    if await is_rate_limited(user_hash):
        logger.info("rate-limited submission for hash=%s", user_hash[:12])
        return ReportSubmitResponse(
            success=True,
            accepted=False,
            message="Your report was received.",
        )

    # Validate district — must be one of the 14 Kerala districts.
    district = normalize_district(payload.district)
    if district is None:
        logger.warning("rejected report with unknown district=%r", payload.district)
        return ReportSubmitResponse(
            success=True,
            accepted=False,
            message="Your report was received.",
        )

    # Validate and sanitize place_name — reject spam/injection attempts.
    place_name = _sanitize_place(payload.place_name)
    if place_name is None:
        logger.warning("rejected report with invalid place_name=%r", payload.place_name[:40])
        return ReportSubmitResponse(
            success=True,
            accepted=False,
            message="Your report was received.",
        )

    report = await create_report(
        db,
        status=payload.status.value,
        place_name=place_name,
        district=district,
        pincode=payload.pincode,
        latitude=payload.latitude,
        longitude=payload.longitude,
        user_hash=user_hash,
    )

    name = random_name()
    feed_item = {
        "id": str(report.id),
        "status": report.status,
        "name": name,
        "place": report.place_name,
        "district": report.district,
        "created_at": report.created_at.isoformat(),
        "time": relative_time(report.created_at),
    }
    await push_feed_item(feed_item)

    # Broadcast the new report event.
    await manager.broadcast({"type": "NEW_REPORT", **feed_item})

    # Broadcast the freshly computed district percentage.
    pct = await get_district_percentage(db, district)
    await manager.broadcast(
        {"type": "DISTRICT_UPDATE", "district": district, "hot_percentage": pct}
    )

    return ReportSubmitResponse(
        success=True,
        accepted=True,
        message="Report submitted.",
        report=FeedItem(**feed_item),
    )


@router.get("/district-reports")
async def get_district_reports(
    district: str = Query(...),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0),
    place: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """All-time reports for a district with optional place filter and pagination."""
    normalized = normalize_district(district) or district.strip().title()

    # Distinct place names for filter chips
    places_stmt = (
        select(Report.place_name)
        .where(Report.district == normalized)
        .distinct()
        .order_by(Report.place_name)
    )
    places = [row[0] for row in (await db.execute(places_stmt)).all()]

    # Base filter
    base = [Report.district == normalized]
    if place:
        base.append(Report.place_name == place)

    # Total count
    total = int((await db.execute(
        select(func.count()).select_from(Report).where(*base)
    )).scalar_one())

    # Paginated results newest-first
    rows = (await db.execute(
        select(Report).where(*base).order_by(Report.created_at.desc()).limit(limit).offset(offset)
    )).scalars().all()

    reports = [
        {
            "id": str(r.id),
            "status": r.status,
            "place": r.place_name,
            "district": r.district,
            "created_at": r.created_at.isoformat(),
            "time": relative_time(r.created_at),
        }
        for r in rows
    ]

    return {"reports": reports, "total": total, "places": places, "district": normalized}
