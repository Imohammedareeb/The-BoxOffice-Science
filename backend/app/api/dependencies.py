"""
MongoDB connection + Beanie ODM initialisation.

Beanie models are queried directly (e.g. ``await User.find_one(...)``), so unlike
SQLAlchemy there is no per-request session to inject. ``init_db()`` / ``close_db()``
are driven by the FastAPI lifespan in app.main.
"""

from typing import Optional

from fastapi import Query
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from beanie import init_beanie

from app.core.config import settings

# ─────────────────────────────────────────────────────────
# Client (created on startup, disposed on shutdown)
# ─────────────────────────────────────────────────────────

_client: Optional[AsyncIOMotorClient] = None


def get_database() -> AsyncIOMotorDatabase:
    """Return the active Motor database handle. Requires init_db() to have run."""
    if _client is None:
        raise RuntimeError("Database not initialised. Call init_db() first.")
    return _client[settings.MONGODB_DB]


async def init_db() -> None:
    """Open the Mongo client and register all Beanie document models."""
    global _client
    # Import here to avoid a circular import (documents import nothing from here).
    from app.models.documents import Movie, User, UserProduction, UserPrediction

    _client = AsyncIOMotorClient(settings.MONGODB_URI)
    await init_beanie(
        database=_client[settings.MONGODB_DB],
        document_models=[Movie, User, UserProduction, UserPrediction],
    )


async def close_db() -> None:
    """Close the Mongo client."""
    global _client
    if _client is not None:
        _client.close()
        _client = None


# ─────────────────────────────────────────────────────────
# Pagination Dependency
# ─────────────────────────────────────────────────────────

class PaginationParams:
    """Reusable pagination parameters injected via Depends."""

    def __init__(
        self,
        page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
        page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    ):
        self.page = page
        self.page_size = page_size
        self.offset = (page - 1) * page_size
        self.limit = page_size


def get_pagination(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginationParams:
    return PaginationParams(page=page, page_size=page_size)
