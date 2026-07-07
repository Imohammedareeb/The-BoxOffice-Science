"""
Dashboard Controller — KPI Stats, Genre Breakdown, Top Films, Personal Stats

User-scoped stats come from each user's own ventures/predictions; market stats
come from the shared movies catalog.
"""
from fastapi import APIRouter, Depends

from app.api.auth_deps import require_auth
from app.models.documents import User, UserProduction, UserPrediction
from app.models.financial_specs import DashboardStatsResponse
from app.services.catalog import all_movies, genre_roi_rows
from app.utils.errors import DatabaseError

router = APIRouter()

# ── Correct fallback shape matching PersonalStats interface ────────────────────
_PERSONAL_STATS_FALLBACK = {
    "has_data": False,
    "venture_count": 0,
    "prediction_count": 0,
    "avg_predicted_roi": None,
    "total_projected_revenue": 0,
    "best_genre": None,
    "is_new_account": True,
}


async def _fetch_user_stats(user: User) -> dict:
    """Compute KPIs from THIS user's own ventures and predictions."""
    uid = str(user.id)
    predictions = await UserPrediction.find(UserPrediction.user_id == uid).to_list()
    venture_count = await UserProduction.find(UserProduction.user_id == uid).count()

    prediction_count = len(predictions)
    roi_values = [float(p.roi_percentage) for p in predictions if p.roi_percentage is not None]
    avg_roi = sum(roi_values) / len(roi_values) if roi_values else 0.0
    total_predicted = sum(int(p.predicted_revenue or 0) for p in predictions)

    # Best genre by average ROI from the user's predictions
    genre_buckets: dict[str, list[float]] = {}
    for p in predictions:
        if p.roi_percentage is not None:
            genre_buckets.setdefault(p.genre, []).append(float(p.roi_percentage))
    best_genre = None
    if genre_buckets:
        best_genre = max(
            genre_buckets.items(), key=lambda kv: sum(kv[1]) / len(kv[1])
        )[0]

    return {
        "has_data": (prediction_count > 0 or venture_count > 0),
        "venture_count": venture_count,
        "prediction_count": prediction_count,
        "avg_predicted_roi": round(avg_roi, 1) if prediction_count > 0 else None,
        "total_projected_revenue": total_predicted,
        "best_genre": best_genre,
        "is_new_account": prediction_count == 0 and venture_count == 0,
    }


async def _fetch_market_stats() -> dict:
    """Global market KPIs from the shared movies catalog."""
    rows = await genre_roi_rows()

    if not rows:
        return {
            "market_avg_roi": 248.4,
            "market_sentiment_label": "BULLISH",
            "sentiment_score": 0.67,
            "top_genre": "Animation",
            "top_genre_roi": 259.0,
        }

    total = sum(r["avg_roi"] * r["count"] for r in rows)
    count = sum(r["count"] for r in rows)
    avg_roi = round(total / count, 1) if count else 0.0

    sentiment_label, sentiment_score = (
        ("BULLISH",  0.82) if avg_roi >= 200 else
        ("POSITIVE", 0.64) if avg_roi >= 100 else
        ("NEUTRAL",  0.51) if avg_roi >= 50  else
        ("CAUTIOUS", 0.38)
    )
    top = rows[0]  # rows are sorted by avg_roi desc
    return {
        "market_avg_roi": avg_roi,
        "market_sentiment_label": sentiment_label,
        "sentiment_score": sentiment_score,
        "top_genre": top["genre"],
        "top_genre_roi": round(top["avg_roi"], 1),
    }


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(user: User = Depends(require_auth)):
    """
    Returns user-scoped personal stats merged with global market stats.
    New users correctly see 0 predictions, 0 ventures, $0 revenue.
    """
    try:
        user_stats = await _fetch_user_stats(user)
        market_stats = await _fetch_market_stats()
        display_roi = (
            user_stats["avg_predicted_roi"] if user_stats["has_data"]
            else market_stats["market_avg_roi"]
        )
        return DashboardStatsResponse(
            total_predicted_revenue=user_stats["total_projected_revenue"],
            average_roi=display_roi or 0.0,
            active_ventures=user_stats["venture_count"],
            market_sentiment_label=market_stats["market_sentiment_label"],
            sentiment_score=market_stats["sentiment_score"],
            top_genre=market_stats["top_genre"],
            top_genre_roi=market_stats["top_genre_roi"],
            total_predictions=user_stats["prediction_count"],
            is_new_user=user_stats["is_new_account"],
        )
    except Exception:
        return DashboardStatsResponse(
            total_predicted_revenue=0,
            average_roi=0,
            active_ventures=0,
            market_sentiment_label="BULLISH",
            sentiment_score=0.67,
            top_genre="Animation",
            top_genre_roi=259.0,
            total_predictions=0,
            is_new_user=True,
        )


@router.get("/genre-breakdown")
async def get_genre_breakdown(user=Depends(require_auth)):
    """Per-genre aggregated financials from the shared catalog. Intentionally global."""
    try:
        buckets: dict[str, dict] = {}
        for m in await all_movies():
            if m.roi is None:
                continue
            b = buckets.setdefault(
                m.genre, {"budgets": [], "revenues": [], "rois": []}
            )
            b["budgets"].append(float(m.budget or 0))
            b["revenues"].append(float(m.box_office or 0))
            b["rois"].append(float(m.roi))

        result = []
        for genre, b in buckets.items():
            n = len(b["rois"])
            result.append({
                "genre": genre,
                "count": n,
                "avg_budget":  round(sum(b["budgets"]) / n / 1_000_000, 1),
                "avg_revenue": round(sum(b["revenues"]) / n / 1_000_000, 1),
                "avg_roi":     round(sum(b["rois"]) / n, 1),
                "peak_roi":    round(max(b["rois"]), 1),
            })
        result.sort(key=lambda r: r["avg_roi"], reverse=True)
        return result
    except Exception:
        raise DatabaseError("Could not retrieve genre breakdown.")


@router.get("/top-films")
async def get_top_films(
    limit: int = 10,
    sort_by: str = "roi",
    user=Depends(require_auth),
):
    """Top-performing films from the shared catalog. Intentionally global analytical data."""
    SORT_KEYS = {
        "roi": lambda m: m.roi or 0,
        "box_office": lambda m: m.box_office or 0,
        "year": lambda m: m.year or 0,
    }
    key = SORT_KEYS.get(sort_by, SORT_KEYS["roi"])
    try:
        movies = [m for m in await all_movies() if m.roi is not None]
        movies.sort(key=key, reverse=True)
        return [
            {
                "title": m.title,
                "genre": m.genre,
                "year": m.year,
                "budget": m.budget,
                "box_office": m.box_office,
                "roi": float(m.roi or 0),
                "director": m.director,
                "studio": m.studio,
            }
            for m in movies[: min(limit, 50)]
        ]
    except Exception:
        raise DatabaseError("Could not retrieve top films.")


@router.get("/personal-stats")
async def get_user_personal_stats(user: User = Depends(require_auth)):
    """
    Personal stats for the profile page. Field names match the frontend
    PersonalStats interface.
    """
    try:
        return await _fetch_user_stats(user)
    except Exception:
        return _PERSONAL_STATS_FALLBACK
