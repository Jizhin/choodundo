"""ChoodUndo FastAPI application entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.redis_client import close_redis, get_redis
from app.routers import districts, feed, location, presence, reports, stats, ws

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("choodundo")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist (Alembic owns schema in prod; this is a safe fallback).
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Warm Redis connection.
    try:
        await get_redis().ping()
        logger.info("Redis connection OK")
    except Exception as exc:  # noqa: BLE001
        logger.warning("Redis ping failed at startup: %s", exc)
    logger.info("%s started (env=%s)", settings.app_name, settings.environment)
    yield
    await close_redis()
    await engine.dispose()


app = FastAPI(
    title="ChoodUndo API",
    description="Community-driven live heat reports across Kerala.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reports.router)
app.include_router(feed.router)
app.include_router(districts.router)
app.include_router(location.router)
app.include_router(stats.router)
app.include_router(ws.router)
app.include_router(presence.router)


@app.get("/health", tags=["health"])
async def health() -> dict:
    redis_ok = True
    try:
        await get_redis().ping()
    except Exception:  # noqa: BLE001
        redis_ok = False
    return {"status": "ok", "redis": redis_ok}


@app.get("/api/health", tags=["health"])
async def api_health() -> dict:
    return await health()
