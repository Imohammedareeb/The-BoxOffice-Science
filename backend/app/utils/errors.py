"""
Centralized error handling for Box Office Science API.
Defines custom exceptions and FastAPI exception handlers.
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pymongo.errors import PyMongoError
import logging

logger = logging.getLogger("bos.errors")


# ─────────────────────────────────────────────────────────
# Custom Exception Hierarchy
# ─────────────────────────────────────────────────────────

class BOSException(Exception):
    """Base exception for all Box Office Science errors."""
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code: str = "INTERNAL_ERROR"
    message: str = "An unexpected error occurred."

    def __init__(self, message: str | None = None, detail: str | None = None):
        self.message = message or self.__class__.message
        self.detail = detail
        super().__init__(self.message)


class NotFoundError(BOSException):
    """Resource not found (404)."""
    status_code = status.HTTP_404_NOT_FOUND
    error_code = "NOT_FOUND"
    message = "The requested resource was not found."


class ValidationError(BOSException):
    """Business-logic validation error (422)."""
    status_code = 422
    error_code = "VALIDATION_ERROR"
    message = "Invalid input data."


class PredictionError(BOSException):
    """Error in the revenue prediction engine (500)."""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code = "PREDICTION_ERROR"
    message = "Revenue prediction failed."


class NLPMatchError(BOSException):
    """Error in the NLP concept matcher (500)."""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code = "NLP_MATCH_ERROR"
    message = "Concept matching failed."


class DatabaseError(BOSException):
    """Database operation error (503)."""
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    error_code = "DATABASE_ERROR"
    message = "Database operation failed."


class ExternalAPIError(BOSException):
    """Error calling an external API like TMDb/OMDb (502)."""
    status_code = status.HTTP_502_BAD_GATEWAY
    error_code = "EXTERNAL_API_ERROR"
    message = "External API request failed."


# ─────────────────────────────────────────────────────────
# Response Helpers
# ─────────────────────────────────────────────────────────

def _error_response(
    status_code: int,
    error_code: str,
    message: str,
    detail: str | None = None,
) -> JSONResponse:
    body = {
        "success": False,
        "error": {
            "code": error_code,
            "message": message,
        },
    }
    if detail:
        body["error"]["detail"] = detail
    return JSONResponse(status_code=status_code, content=body)


# ─────────────────────────────────────────────────────────
# Exception Handlers (register these on the FastAPI app)
# ─────────────────────────────────────────────────────────

async def bos_exception_handler(request: Request, exc: BOSException) -> JSONResponse:
    logger.warning(
        "BOSException [%s] %s — %s %s",
        exc.error_code, exc.message, request.method, request.url,
    )
    return _error_response(exc.status_code, exc.error_code, exc.message, exc.detail)


async def database_exception_handler(request: Request, exc: PyMongoError) -> JSONResponse:
    logger.error("MongoDB error: %s — %s %s", exc, request.method, request.url)
    return _error_response(
        status.HTTP_503_SERVICE_UNAVAILABLE,
        "DATABASE_ERROR",
        "A database error occurred. Please try again.",
        str(exc.__class__.__name__),
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    errors = [
        {"field": ".".join(str(loc) for loc in e["loc"]), "msg": e["msg"]}
        for e in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed.",
                "fields": errors,
            },
        },
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception on %s %s", request.method, request.url)
    return _error_response(
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        "INTERNAL_ERROR",
        "An unexpected error occurred. Please try again.",
    )


# ─────────────────────────────────────────────────────────
# Registration Helper
# ─────────────────────────────────────────────────────────

def register_exception_handlers(app: FastAPI) -> None:
    """Call this in main.py to attach all handlers to the app."""
    app.add_exception_handler(BOSException, bos_exception_handler)
    app.add_exception_handler(PyMongoError, database_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)
