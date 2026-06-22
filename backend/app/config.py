"""Application configuration loaded from environment variables."""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    app_name: str = "ChoodUndo"
    environment: str = "production"
    debug: bool = False

    # Database
    database_url: str = "postgresql+asyncpg://choodundo:choodundo@postgres:5432/choodundo"

    # Redis
    redis_url: str = "redis://redis:6379/0"

    # CORS
    cors_origins: str = "*"

    # Anti-spam / rate limiting
    rate_limit_seconds: int = 15 * 60  # 15 minutes
    decay_window_seconds: int = 2 * 60 * 60  # 2 hours

    # Redis keys / sizing
    feed_max_items: int = 100

    # Geocoding (Photon — OSM search-as-you-type)
    photon_url: str = "https://photon.komoot.io"
    geocoder_user_agent: str = "ChoodUndo/1.0 (https://choodundo.app)"
    # Kerala bounding box: minLon, minLat, maxLon, maxLat
    kerala_bbox: str = "74.70,8.00,77.60,12.95"

    @property
    def kerala_bbox_tuple(self) -> tuple[float, float, float, float]:
        parts = [float(x) for x in self.kerala_bbox.split(",")]
        return parts[0], parts[1], parts[2], parts[3]

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
