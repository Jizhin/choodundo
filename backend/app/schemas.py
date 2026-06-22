"""Pydantic v2 request/response schemas."""
from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class ReportStatus(str, Enum):
    HOT = "HOT"
    NORMAL = "NORMAL"
    EXTREME_HOT = "EXTREME_HOT"


class ReportCreate(BaseModel):
    status: ReportStatus
    place_name: str = Field(..., min_length=1, max_length=100)
    district: str = Field(..., min_length=1, max_length=50)
    pincode: str | None = Field(default=None, max_length=6)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: ReportStatus
    place_name: str
    district: str
    pincode: str | None
    created_at: datetime


class FeedItem(BaseModel):
    id: str
    status: ReportStatus
    name: str  # anonymous display name
    place: str
    district: str
    created_at: str  # ISO timestamp
    time: str  # relative time string


class ReportSubmitResponse(BaseModel):
    success: bool = True
    accepted: bool  # False when silently rate-limited (still 200)
    message: str
    report: FeedItem | None = None  # the created item, for instant client display


class DistrictSummary(BaseModel):
    district: str
    total: int
    hot: int
    extreme_hot: int
    normal: int
    hot_percentage: int
    level: str  # RED | ORANGE | GRAY
    hourly: list[int]  # hot report counts per IST hour (0-23) for last 24h, for sparkline


class DistrictsResponse(BaseModel):
    districts: list[DistrictSummary]
    total_reports: int
    updated_at: str


class PlaceSearchResult(BaseModel):
    place_name: str
    district: str
    pincode: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class LocationResolved(BaseModel):
    place_name: str
    district: str
    pincode: str | None = None
    latitude: float
    longitude: float


class LiveStats(BaseModel):
    reports_last_2h: int
    reports_today: int
    last_report_at: str | None = None


class HourlyBucket(BaseModel):
    hour: int
    hot: int
    normal: int
