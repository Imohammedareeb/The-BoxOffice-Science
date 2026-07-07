"""
Beanie ODM documents — the MongoDB collections.

Replaces the former SQLAlchemy ORM models. Beanie documents are Pydantic
models, so they validate on read/write and are queried directly, e.g.::

    user = await User.find_one(User.email == "a@b.com")

FIX-DATA-ISOLATION:
  UserProduction and UserPrediction give each registered user their own
  private data, completely separate from the shared ``movies`` catalog.
  ``user_id`` stores the owning user's id as a string (str(user.id)).
"""

from datetime import datetime, timezone
from typing import Optional

import pymongo
from beanie import Document
from pydantic import Field


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Movie(Document):
    """Shared analytical catalog — global data, no user writes."""

    title: str
    genre: str
    year: int
    budget: int
    box_office: int
    net_profit: Optional[int] = None
    roi: Optional[float] = None
    director: Optional[str] = None
    studio: Optional[str] = None
    cast_tier: Optional[str] = None
    release_season: Optional[str] = None
    description: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=_utcnow)

    class Settings:
        name = "movies"
        indexes = [
            "genre",
            "year",
            [("roi", pymongo.DESCENDING)],
        ]


class User(Document):
    """Registered studio users."""

    email: str
    display_name: str
    hashed_pw: str
    is_active: bool = True
    tier: str = "Analyst"
    created_at: datetime = Field(default_factory=_utcnow)
    last_login: Optional[datetime] = None

    class Settings:
        name = "users"
        indexes = [
            pymongo.IndexModel([("email", pymongo.ASCENDING)], unique=True),
        ]


class UserProduction(Document):
    """Per-user venture tracker. Real users create ventures here, not in movies."""

    user_id: str
    title: str
    genre: str
    budget: int = 0
    projected_revenue: Optional[int] = None
    director: Optional[str] = None
    cast_tier: Optional[str] = "Mixed"
    current_phase: Optional[str] = "Development"
    progress: int = 0
    risk: Optional[str] = "Medium"
    start_date: Optional[str] = None
    release_date: Optional[str] = None
    status_color: Optional[str] = "#4C69F6"
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)

    class Settings:
        name = "user_productions"
        indexes = ["user_id"]


class UserPrediction(Document):
    """Saved Oracle prediction history per user (private)."""

    user_id: str
    genre: str
    budget: int
    cast_tier: Optional[str] = None
    release_season: Optional[str] = None
    predicted_revenue: Optional[int] = None
    roi_percentage: Optional[float] = None
    net_profit: Optional[int] = None
    risk_level: Optional[str] = None
    confidence: Optional[float] = None
    label: Optional[str] = None
    created_at: datetime = Field(default_factory=_utcnow)

    class Settings:
        name = "user_predictions"
        indexes = ["user_id"]
