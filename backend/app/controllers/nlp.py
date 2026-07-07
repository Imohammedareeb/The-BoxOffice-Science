from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.auth_deps import require_auth
from app.core.config import settings
from app.models.financial_specs import MovieConceptRequest, NLPMatchResponse
from app.models.documents import User
from app.services.nlp_matcher import match_concepts_from_db
from app.utils.errors import NLPMatchError

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/match", response_model=list[NLPMatchResponse])
@limiter.limit(settings.RATE_LIMIT_NLP)
async def match_concept(
    request: Request,
    body: MovieConceptRequest,
    current_user: User = Depends(require_auth),
):
    """
    Match a film concept against the IP database (DB-backed with in-memory fallback).
    Returns top-k similar films with similarity scores and financial data.
    Requires authentication. Rate-limited to 20 requests/minute per IP.
    """
    try:
        return await match_concepts_from_db(body.concept, body.top_k)
    except Exception as exc:
        raise NLPMatchError(detail=str(exc))
