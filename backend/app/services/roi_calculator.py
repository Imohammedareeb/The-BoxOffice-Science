"""
ROI Calculator Service
Core financial computation for box office revenue prediction.
"""

from app.models.financial_specs import (
    FinancialSpecsRequest,
    PredictionResponse,
    RiskLevel,
)

# ── Multiplier Tables ─────────────────────────────────────

GENRE_MULTIPLIERS: dict[str, float] = {
    "Action": 2.8,
    "Sci-Fi": 2.4,
    "Animation": 3.1,
    "Comedy": 1.9,
    "Drama": 1.5,
    "Horror": 2.2,
    "Thriller": 1.8,
    "Fantasy": 2.6,
    "Romance": 1.4,
    "Documentary": 0.9,
}

CAST_MULTIPLIERS: dict[str, float] = {
    "A-List": 1.8,
    "B-List": 1.3,
    "Mixed": 1.5,
    "Newcomer": 0.9,
}

SEASON_MULTIPLIERS: dict[str, float] = {
    "Summer": 1.4,
    "Holiday": 1.5,
    "Spring": 1.1,
    "Fall": 1.0,
    "Winter": 0.9,
}

DEMOGRAPHIC_MULTIPLIERS: dict[str, float] = {
    "Under 18": 1.1,
    "18-24": 1.2,
    "18-34": 1.35,
    "25-44": 1.25,
    "35-54": 1.0,
    "55+": 0.85,
    "All Ages": 1.3,
    "Family": 1.45,
}


def compute_roi(specs: FinancialSpecsRequest) -> PredictionResponse:
    """
    Compute box office revenue prediction and ROI using weighted multipliers.
    Results are fully deterministic — same inputs always yield the same output.
    In production this would call a trained ML model endpoint.
    """
    genre_mult = GENRE_MULTIPLIERS.get(specs.genre, 2.0)
    cast_mult = CAST_MULTIPLIERS.get(specs.cast_tier.value, 1.3)
    season_mult = SEASON_MULTIPLIERS.get(specs.release_season.value, 1.0)
    demo_mult = DEMOGRAPHIC_MULTIPLIERS.get(specs.target_demographic, 1.2)

    # Deterministic gross revenue — no random variance
    gross_revenue = (
        specs.budget
        * genre_mult
        * cast_mult
        * season_mult
        * demo_mult
    )

    # Financial waterfall
    distributor_share = gross_revenue * (specs.distributor_split / 100)
    studio_gross = gross_revenue - distributor_share
    tax_deduction = studio_gross * (specs.tax_rate / 100)
    net_profit = studio_gross - tax_deduction - specs.budget

    roi = (net_profit / specs.budget) * 100

    # Confidence: deterministic, derived from multiplier strength
    confidence = min(
        95.0,
        55.0
        + genre_mult * 7
        + cast_mult * 6
        + season_mult * 4
    )

    # Risk classification
    if roi >= 150:
        risk = RiskLevel.LOW
    elif roi >= 50:
        risk = RiskLevel.MEDIUM
    else:
        risk = RiskLevel.HIGH

    return PredictionResponse(
        predicted_revenue=round(gross_revenue, 2),
        roi_percentage=round(roi, 2),
        net_profit=round(net_profit, 2),
        distributor_share=round(distributor_share, 2),
        tax_deduction=round(tax_deduction, 2),
        confidence=round(confidence, 1),
        risk_level=risk,
        genre_multiplier=genre_mult,
        cast_multiplier=cast_mult,
        season_multiplier=season_mult,
    )


# Alias for legacy controller imports
calculate_roi = compute_roi
