"""
Pydantic response schemas for financial/dashboard data.
FIX: Added total_predictions and is_new_user fields for data isolation UX.
RECONSTRUCTED: Added missing models lost during the update.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class CastTier(str, Enum):
    A_LIST = "A-List"
    B_LIST = "B-List"
    MIXED = "Mixed"
    NEWCOMER = "Newcomer"


class ReleaseSeason(str, Enum):
    SUMMER = "Summer"
    HOLIDAY = "Holiday"
    SPRING = "Spring"
    FALL = "Fall"
    WINTER = "Winter"


class FinancialSpecsRequest(BaseModel):
    budget: float
    genre: str
    cast_tier: CastTier
    target_demographic: str
    release_season: ReleaseSeason
    distributor_split: float = 20.0
    tax_rate: float = 5.0


class PredictionResponse(BaseModel):
    predicted_revenue: float
    roi_percentage: float
    net_profit: float
    distributor_share: float
    tax_deduction: float
    confidence: float
    risk_level: RiskLevel
    genre_multiplier: float
    cast_multiplier: float
    season_multiplier: float


class MovieConceptRequest(BaseModel):
    concept: str = Field(..., min_length=10, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=20)


class NLPMatchResponse(BaseModel):
    title: str
    similarity_score: float
    genre: str
    year: int
    box_office: float
    budget: float
    roi: float
    description: str
    tags: List[str]
    director: Optional[str] = None
    studio: Optional[str] = None


class GenreTrend(BaseModel):
    genre: str
    trend: float
    momentum: str


class MarketMarket(BaseModel):
    region: str
    growth: float


class MarketSentimentResponse(BaseModel):
    overall_sentiment: float
    genre_trends: List[GenreTrend]
    top_markets: List[MarketMarket]
    ai_insight: str


class DashboardStatsResponse(BaseModel):
    total_predicted_revenue: float
    average_roi: float
    active_ventures: int
    market_sentiment_label: str
    sentiment_score: float
    top_genre: str
    top_genre_roi: float
    # FIX-DATA-ISOLATION: New fields for per-user awareness
    total_predictions: int = 0
    is_new_user: bool = False
