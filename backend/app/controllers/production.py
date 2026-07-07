"""
Production Controller — Active Venture Tracker

FIX-DATA-ISOLATION: Ventures are per-user in the user_productions collection.
Real users start with 0 ventures. The demo account sees sample ventures until
it creates its own.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.auth_deps import require_auth
from app.models.documents import User, UserProduction

logger = logging.getLogger("bos.production")
router = APIRouter()


# ── Pydantic Schemas ───────────────────────────────────────────────────────────

class VenturePhase(BaseModel):
    id: str
    label: str
    status: str  # "done" | "active" | "upcoming"


class VentureOut(BaseModel):
    id: str
    title: str
    genre: str
    budget: int
    projected_revenue: int
    director: str
    cast_tier: str
    status_color: str
    current_phase: str
    progress: int
    risk: str
    team_size: int | None = None
    start_date: str
    release_date: str
    phases: list[VenturePhase]
    is_demo: bool = False  # flag so frontend can show "Add your first venture" CTA


class VentureCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    genre: str = Field(..., min_length=1, max_length=100)
    budget: int = Field(..., ge=0)
    projected_revenue: int | None = Field(default=None, ge=0)
    director: str | None = Field(default=None, max_length=255)
    cast_tier: str | None = Field(default="Mixed", max_length=50)
    current_phase: str | None = Field(default="Development", max_length=100)
    progress: int = Field(default=0, ge=0, le=100)
    risk: str | None = Field(default="Medium", max_length=20)
    start_date: str | None = Field(default=None, max_length=50)
    release_date: str | None = Field(default=None, max_length=50)
    notes: str | None = None


class VentureUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    genre: str | None = Field(default=None, min_length=1, max_length=100)
    budget: int | None = Field(default=None, ge=0)
    projected_revenue: int | None = Field(default=None, ge=0)
    director: str | None = Field(default=None, max_length=255)
    cast_tier: str | None = Field(default=None, max_length=50)
    current_phase: str | None = Field(default=None, max_length=100)
    progress: int | None = Field(default=None, ge=0, le=100)
    risk: str | None = Field(default=None, max_length=20)
    start_date: str | None = Field(default=None, max_length=50)
    release_date: str | None = Field(default=None, max_length=50)
    notes: str | None = None


# ── Helpers ────────────────────────────────────────────────────────────────────

def _status_color(progress: int) -> str:
    if progress >= 80: return "#F6DB35"
    if progress >= 40: return "#4C69F6"
    if progress >= 15: return "#00A841"
    return "#714B96"


def _derive_phases(progress: int) -> list[dict]:
    milestones = [0, 15, 40, 80, 95]
    labels = ["Development", "Pre-Production", "Production", "Post-Production", "Distribution"]
    ids    = ["dev", "pre", "prod", "post", "dist"]
    phases = []
    for i, (milestone, label, pid) in enumerate(zip(milestones, labels, ids)):
        next_m = milestones[i + 1] if i + 1 < len(milestones) else 100
        if progress >= next_m:
            s = "done"
        elif progress >= milestone:
            s = "active"
        else:
            s = "upcoming"
        phases.append({"id": pid, "label": label, "status": s})
    return phases


def _production_to_out(p: UserProduction) -> VentureOut:
    return VentureOut(
        id=str(p.id),
        title=p.title.upper(),
        genre=p.genre,
        budget=int(p.budget or 0),
        projected_revenue=int(p.projected_revenue or 0),
        director=p.director or "TBA",
        cast_tier=p.cast_tier or "Mixed",
        status_color=p.status_color or _status_color(p.progress),
        current_phase=p.current_phase or "Development",
        progress=p.progress,
        risk=p.risk or "Medium",
        start_date=p.start_date or "",
        release_date=p.release_date or "",
        phases=[VenturePhase(**ph) for ph in _derive_phases(p.progress)],
    )


async def _get_owned_venture(venture_id: str, user: User) -> UserProduction:
    """Fetch a venture by id, enforcing ownership. Raises 404 otherwise."""
    try:
        oid = PydanticObjectId(venture_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venture not found.")

    venture = await UserProduction.get(oid)
    if venture is None or venture.user_id != str(user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venture not found.")
    return venture


# Demo ventures shown only to the demo account with zero real ventures
_DEMO_VENTURES: list[dict[str, Any]] = [
    {
        "id": "demo_v1",
        "title": "NEON NIGHTS",
        "genre": "Sci-Fi",
        "budget": 120_000_000,
        "projected_revenue": 480_000_000,
        "director": "Sample Director",
        "cast_tier": "A-List",
        "status_color": "#4C69F6",
        "current_phase": "Production Phase III",
        "progress": 72,
        "risk": "Low",
        "team_size": 348,
        "start_date": "Jan 2024",
        "release_date": "Nov 2024",
        "phases": _derive_phases(72),
        "is_demo": True,
    },
    {
        "id": "demo_v2",
        "title": "GHOST PROTOCOL 8",
        "genre": "Action",
        "budget": 165_000_000,
        "projected_revenue": 720_000_000,
        "director": "Sample Director",
        "cast_tier": "A-List",
        "status_color": "#F6DB35",
        "current_phase": "Post-Production",
        "progress": 91,
        "risk": "Low",
        "team_size": 210,
        "start_date": "Sep 2023",
        "release_date": "Jul 2024",
        "phases": _derive_phases(91),
        "is_demo": True,
    },
]


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/ventures", summary="List user's active production ventures")
async def get_ventures(user: User = Depends(require_auth)) -> list[dict[str, Any]]:
    """
    Returns THIS user's own ventures only. Brand-new demo accounts get sample
    placeholder data marked is_demo=True so the frontend can show an
    'Add your first venture' CTA.
    """
    productions = (
        await UserProduction.find(UserProduction.user_id == str(user.id))
        .sort("-created_at")
        .to_list()
    )

    if not productions:
        if user.email == "demo@boxofficescience.ai":
            return _DEMO_VENTURES
        return []

    return [_production_to_out(p).model_dump() for p in productions]


@router.post("/ventures", summary="Create a new production venture", status_code=status.HTTP_201_CREATED)
async def create_venture(
    body: VentureCreate,
    user: User = Depends(require_auth),
) -> dict[str, Any]:
    """Create a new venture for the authenticated user."""
    venture = UserProduction(
        user_id=str(user.id),
        title=body.title,
        genre=body.genre,
        budget=body.budget,
        projected_revenue=body.projected_revenue,
        director=body.director,
        cast_tier=body.cast_tier,
        current_phase=body.current_phase,
        progress=body.progress,
        risk=body.risk,
        start_date=body.start_date,
        release_date=body.release_date,
        status_color=_status_color(body.progress),
        notes=body.notes,
    )
    await venture.insert()
    return _production_to_out(venture).model_dump()


@router.put("/ventures/{venture_id}", summary="Update a venture")
async def update_venture(
    venture_id: str,
    body: VentureUpdate,
    user: User = Depends(require_auth),
) -> dict[str, Any]:
    """Update a venture — only the owner can update it."""
    venture = await _get_owned_venture(venture_id, user)

    for field, val in body.model_dump(exclude_unset=True).items():
        setattr(venture, field, val)
    if body.progress is not None:
        venture.status_color = _status_color(body.progress)
    venture.updated_at = datetime.now(timezone.utc)

    await venture.save()
    return _production_to_out(venture).model_dump()


@router.delete("/ventures/{venture_id}", summary="Delete a venture", status_code=status.HTTP_204_NO_CONTENT)
async def delete_venture(
    venture_id: str,
    user: User = Depends(require_auth),
) -> None:
    """Delete a venture — only the owner can delete it."""
    venture = await _get_owned_venture(venture_id, user)
    await venture.delete()
