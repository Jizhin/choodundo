"""Business logic: report creation, aggregation over the 2-hour decay window."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import Integer
from sqlalchemy import cast as sql_cast
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.data.kerala import DISTRICTS
from app.models import Report
from app.schemas import DistrictSummary
from app.utils import level_from_percentage


# Kerala local time (IST) for "today" boundaries.
IST = timezone(timedelta(hours=5, minutes=30))


def decay_cutoff() -> datetime:
    return datetime.now(timezone.utc) - timedelta(seconds=settings.decay_window_seconds)


def today_cutoff_utc() -> datetime:
    now_ist = datetime.now(IST)
    start_ist = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
    return start_ist.astimezone(timezone.utc)


async def create_report(
    db: AsyncSession,
    *,
    status: str,
    place_name: str,
    district: str,
    pincode: str | None,
    latitude: float | None,
    longitude: float | None,
    user_hash: str,
) -> Report:
    report = Report(
        status=status,
        place_name=place_name,
        district=district,
        pincode=pincode,
        latitude=latitude,
        longitude=longitude,
        user_hash=user_hash,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report


async def count_recent_reports(db: AsyncSession) -> int:
    cutoff = decay_cutoff()
    stmt = select(func.count()).select_from(Report).where(Report.created_at >= cutoff)
    result = await db.execute(stmt)
    return int(result.scalar_one())


async def count_today_reports(db: AsyncSession) -> int:
    stmt = (
        select(func.count())
        .select_from(Report)
        .where(Report.created_at >= today_cutoff_utc())
    )
    return int((await db.execute(stmt)).scalar_one())


async def last_report_time(db: AsyncSession) -> datetime | None:
    stmt = select(func.max(Report.created_at))
    return (await db.execute(stmt)).scalar_one_or_none()


async def get_district_summaries(db: AsyncSession) -> tuple[list[DistrictSummary], int]:
    """Aggregate HOT/NORMAL counts per district across all time.
    Also returns per-district hourly hot counts for the last 24h (for real sparklines).
    Always returns all 14 districts, including those with zero reports (GRAY).
    """
    from sqlalchemy import text as sa_text

    # All-time counts per district+status
    stmt = (
        select(Report.district, Report.status, func.count().label("cnt"))
        .group_by(Report.district, Report.status)
    )
    rows = (await db.execute(stmt)).all()

    # Last 24h: hot counts per district per IST hour (for sparkline)
    cutoff_24h = datetime.now(timezone.utc) - timedelta(hours=24)
    ist_hour = sql_cast(
        func.extract("hour", Report.created_at + sa_text("INTERVAL '5 hours 30 minutes'")),
        Integer,
    )
    hourly_stmt = (
        select(Report.district, ist_hour.label("hr"), func.count().label("cnt"))
        .where(
            Report.created_at >= cutoff_24h,
            Report.status.in_(["HOT", "EXTREME_HOT"]),
        )
        .group_by(Report.district, ist_hour)
    )
    hourly_rows = (await db.execute(hourly_stmt)).all()

    hourly_map: dict[str, dict[int, int]] = {d: {} for d in DISTRICTS}
    for district, hr, cnt in hourly_rows:
        if district in hourly_map:
            key = int(hr)
            hourly_map[district][key] = hourly_map[district].get(key, 0) + int(cnt)

    tally: dict[str, dict[str, int]] = {d: {"HOT": 0, "EXTREME_HOT": 0, "NORMAL": 0} for d in DISTRICTS}
    for district, status, cnt in rows:
        if district in tally and status in ("HOT", "EXTREME_HOT", "NORMAL"):
            tally[district][status] += int(cnt)

    summaries: list[DistrictSummary] = []
    grand_total = 0
    for district in DISTRICTS:
        hot = tally[district]["HOT"]
        extreme_hot = tally[district]["EXTREME_HOT"]
        normal = tally[district]["NORMAL"]
        total = hot + extreme_hot + normal
        grand_total += total
        combined_hot = hot + extreme_hot
        pct = int(round((combined_hot / total) * 100)) if total > 0 else 0
        hourly = [hourly_map[district].get(h, 0) for h in range(24)]
        summaries.append(
            DistrictSummary(
                district=district,
                total=total,
                hot=hot,
                extreme_hot=extreme_hot,
                normal=normal,
                hot_percentage=pct,
                level=level_from_percentage(pct) if total > 0 else "GRAY",
                hourly=hourly,
            )
        )
    return summaries, grand_total


async def get_hourly_stats(db: AsyncSession) -> list[dict]:
    """HOT/NORMAL report counts grouped by IST hour for today."""
    from sqlalchemy import text as sa_text

    cutoff = today_cutoff_utc()
    # Add 5h30m to UTC timestamp to get IST hour.
    ist_expr = Report.created_at + sa_text("INTERVAL '5 hours 30 minutes'")
    hour_expr = sql_cast(func.extract("hour", ist_expr), Integer)

    stmt = (
        select(hour_expr.label("hour"), Report.status, func.count(Report.id).label("cnt"))
        .where(Report.created_at >= cutoff)
        .group_by(hour_expr, Report.status)
        .order_by(hour_expr)
    )
    rows = (await db.execute(stmt)).all()

    hourly: dict[int, dict[str, int]] = {}
    for row in rows:
        h = int(row.hour)
        if h not in hourly:
            hourly[h] = {"hot": 0, "normal": 0}
        key = "hot" if row.status == "HOT" else "normal"
        hourly[h][key] = int(row.cnt)

    current_hour = datetime.now(IST).hour
    return [
        {"hour": h, "hot": hourly.get(h, {}).get("hot", 0), "normal": hourly.get(h, {}).get("normal", 0)}
        for h in range(current_hour + 1)
    ]


async def get_district_percentage(db: AsyncSession, district: str) -> int:
    stmt = (
        select(Report.status, func.count().label("cnt"))
        .where(Report.district == district)
        .group_by(Report.status)
    )
    rows = (await db.execute(stmt)).all()
    counts = {status: int(cnt) for status, cnt in rows}
    hot = counts.get("HOT", 0) + counts.get("EXTREME_HOT", 0)
    total = hot + counts.get("NORMAL", 0)
    return int(round((hot / total) * 100)) if total > 0 else 0
