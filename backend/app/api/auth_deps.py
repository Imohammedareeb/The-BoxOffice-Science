"""
Auth dependency — extracts and validates the JWT.

Reads the JWT from the HttpOnly cookie (bos_session) set by the server, and
falls back to the Authorization Bearer header for API clients / Swagger /docs.

Use as:  current_user: User = Depends(require_auth)
"""
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError

from app.services.auth_service import decode_token, get_user_by_id
from app.models.documents import User

_bearer = HTTPBearer(auto_error=False)

SESSION_COOKIE = "bos_session"


async def require_auth(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> User:
    """
    Validate the JWT and return the active User.
    Token sources (in priority order):
      1. HttpOnly cookie 'bos_session' (set by server after login)
      2. Authorization: Bearer <token> header (for API clients / Swagger)

    Raises 401 if the token is missing, expired, or invalid.
    Raises 403 if the user account is inactive.
    """
    # Priority 1: HttpOnly cookie (secure — JS cannot read this)
    token: Optional[str] = request.cookies.get(SESSION_COOKIE)

    # Priority 2: Bearer header (API clients, Swagger docs)
    if not token and creds:
        token = creds.credentials

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_token(token)
        user_id: str = payload["sub"]
    except (JWTError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive.")
    return user


async def optional_auth(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> Optional[User]:
    """Like require_auth but returns None instead of raising for unauthenticated requests."""
    try:
        return await require_auth(request, creds)
    except HTTPException:
        return None
