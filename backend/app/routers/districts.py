"""District summary endpoint — aggregation over the 2-hour decay window."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import DistrictsResponse
from app.services import get_district_summaries

router = APIRouter(prefix="/api", tags=["districts"])


@router.get("/districts", response_model=DistrictsResponse)
async def district_summary(db: AsyncSession = Depends(get_db)) -> DistrictsResponse:
    summaries, total = await get_district_summaries(db)
    return DistrictsResponse(
        districts=summaries,
        total_reports=total,
        updated_at=datetime.now(timezone.utc).isoformat(),
    )
