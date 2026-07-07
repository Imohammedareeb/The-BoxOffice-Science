"""
Predictions Controller — Revenue Prediction + Market Sentiment + History
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query

from app.api.auth_deps import require_auth
from app.models.documents import User, UserPrediction
from app.services.roi_calculator import compute_roi
from app.services.sentiment_engine import generate_sentiment
from app.services.catalog import genre_roi_rows
from app.models.financial_specs import FinancialSpecsRequest

router = APIRouter()
logger = logging.getLogger("bos.predictions")


@router.post("/revenue")
async def predict_revenue(
    body: FinancialSpecsRequest,
    user: User = Depends(require_auth),
    save: bool = Query(default=True, description="Auto-save prediction to user history"),
):
    """
    Run a revenue prediction using the multiplier model.
    Auto-saves to the user's prediction history if save=true.
    """
    result = compute_roi(body)

    if save:
        try:
            pred = UserPrediction(
                user_id=str(user.id),
                genre=body.genre,
                budget=int(body.budget),
                cast_tier=body.cast_tier.value,
                release_season=body.release_season.value,
                predicted_revenue=int(result.predicted_revenue),
                roi_percentage=float(result.roi_percentage),
                net_profit=int(result.net_profit),
                risk_level=result.risk_level.value,
                confidence=float(result.confidence),
                label=f"{body.genre} — ${int(body.budget) // 1_000_000}M",
            )
            await pred.insert()
        except Exception as e:
            logger.warning("Could not save prediction: %s", e)

    return result


@router.get("/sentiment")
async def get_market_sentiment(user: User = Depends(require_auth)):
    """Market sentiment from the global catalog — analytical, not user-scoped."""
    try:
        rows = await genre_roi_rows()
        return generate_sentiment(rows)
    except Exception:
        return generate_sentiment([])


@router.get("/history")
async def get_prediction_history(user: User = Depends(require_auth)):
    """Return this user's saved prediction history (most recent first)."""
    preds = (
        await UserPrediction.find(UserPrediction.user_id == str(user.id))
        .sort("-created_at")
        .limit(50)
        .to_list()
    )
    return [
        {
            "id": str(p.id),
            "genre": p.genre,
            "budget": p.budget,
            "cast_tier": p.cast_tier,
            "release_season": p.release_season,
            "predicted_revenue": p.predicted_revenue,
            "roi_percentage": float(p.roi_percentage or 0),
            "net_profit": p.net_profit,
            "risk_level": p.risk_level,
            "confidence": float(p.confidence or 0),
            "label": p.label,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in preds
    ]
