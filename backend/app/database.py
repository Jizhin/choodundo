"""Async SQLAlchemy engine and session management."""
from __future__ import annotations

from collections.abc import AsyncGenerator
from urllib.parse import urlparse, urlencode, parse_qs, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


def _build_engine_url(raw: str) -> tuple[str, dict]:
    """Strip asyncpg-incompatible query params and return (clean_url, connect_args)."""
    parsed = urlparse(raw)
    params = parse_qs(parsed.query, keep_blank_values=True)
    needs_ssl = params.pop("sslmode", [None])[0] in ("require", "verify-ca", "verify-full")
    params.pop("channel_binding", None)
    clean_query = urlencode({k: v[0] for k, v in params.items()})
    clean_url = urlunparse(parsed._replace(query=clean_query))
    connect_args = {"ssl": True} if needs_ssl else {}
    return clean_url, connect_args


_db_url, _connect_args = _build_engine_url(settings.database_url)

engine = create_async_engine(
    _db_url,
    echo=settings.debug,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
