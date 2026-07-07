"""
movie_concept.py — Legacy compatibility shim.
All concept/NLP Pydantic models now live in financial_specs.py.
This module re-exports them so any remaining old import paths don't break.
"""

from app.models.financial_specs import (  # noqa: F401
    MovieConceptRequest,
    NLPMatchResponse,
)
