"""
Box Office Science — FastAPI Backend (MongoDB / Beanie)
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.controllers import predictions, nlp, dashboard, production, auth
from app.api.dependencies import init_db, close_db
from app.db.seed import run_seed
from app.utils.errors import register_exception_handlers

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
)
# Keep chatty third-party wire loggers quiet even in DEBUG mode.
for _noisy in ("pymongo", "motor", "asyncio"):
    logging.getLogger(_noisy).setLevel(logging.WARNING)
logger = logging.getLogger("bos.main")

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.validate_security()
    logger.info("⚡ Box Office Science API starting up...")
    await init_db()
    await run_seed()
    logger.info("✅ MongoDB connected and seeded.")
    yield
    logger.info("🛑 Shutting down — closing MongoDB client.")
    await close_db()


app = FastAPI(
    title="Box Office Science API",
    description="AI-powered film investment intelligence platform.",
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    # BUG-04 FIX: Added "PUT", "DELETE", "PATCH" — required for:
    #   PUT  /api/production/ventures/{id}   (update venture)
    #   DELETE /api/production/ventures/{id} (delete venture)
    #   PATCH /api/auth/me                   (update profile name)
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(nlp.router,         prefix="/api/nlp",         tags=["NLP"])
app.include_router(dashboard.router,   prefix="/api/dashboard",   tags=["Dashboard"])
app.include_router(production.router,  prefix="/api/production",  tags=["Production"])
app.include_router(auth.router,        prefix="/api/auth",        tags=["Auth"])


@app.get("/health", tags=["System"])
async def health():
    return JSONResponse({
        "status": "online",
        "service": "Box Office Science API",
        "version": "0.2.0",
    })


@app.get("/", tags=["System"])
async def root():
    return {"message": "⚡ BOX OFFICE SCIENCE API", "docs": "/docs", "version": "0.2.0"}
