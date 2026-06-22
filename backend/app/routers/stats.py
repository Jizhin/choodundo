"""Lightweight live stats for the hero."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import HourlyBucket, LiveStats
from app.services import (
    count_recent_reports,
    count_today_reports,
    get_hourly_stats,
    last_report_time,
)

router = APIRouter(prefix="/api", tags=["stats"])


@router.get("/stats", response_model=LiveStats)
async def live_stats(db: AsyncSession = Depends(get_db)) -> LiveStats:
    last = await last_report_time(db)
    return LiveStats(
        reports_last_2h=await count_recent_reports(db),
        reports_today=await count_today_reports(db),
        last_report_at=last.isoformat() if last else None,
    )


@router.get("/stats/hourly", response_model=list[HourlyBucket])
async def hourly_stats(db: AsyncSession = Depends(get_db)) -> list[dict]:
    return await get_hourly_stats(db)
