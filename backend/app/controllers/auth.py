"""
Auth Controller — Register, Login, Me, Logout

Sets the JWT as an HttpOnly cookie (bos_session) on register AND login — the
Next.js middleware reads this cookie to verify auth on protected routes.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.auth_deps import require_auth
from app.models.auth_schemas import (
    RegisterRequest, LoginRequest, TokenResponse, UserPublic, MeResponse
)
from app.models.documents import User
from app.services.auth_service import (
    create_user, get_user_by_email, verify_password,
    create_access_token, stamp_last_login
)
from app.core.config import settings

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

SESSION_COOKIE = "bos_session"


def _set_auth_cookie(response: Response, token: str, expires_in: int) -> None:
    """
    Set JWT as an HttpOnly cookie from the server.
    HttpOnly = JS cannot read it (XSS-safe).
    SameSite=Lax = CSRF protection for cross-site navigations.
    Secure flag = HTTPS only in production.
    """
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        max_age=expires_in,
        httponly=True,
        samesite="lax",
        secure=not settings.DEBUG,  # False in dev (HTTP), True in prod (HTTPS)
        path="/",
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def register(
    request: Request,
    response: Response,
    body: RegisterRequest,
):
    """
    Create a new user account.
    Returns JWT in response body AND sets it as HttpOnly cookie.
    Rate-limited: 10 registrations/minute per IP.
    """
    existing = await get_user_by_email(body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Force all public registrations to the 'Analyst' tier.
    user = await create_user(body.email, body.display_name, body.password, tier="Analyst")

    token, expires_in = create_access_token(
        str(user.id), extra={"email": user.email, "tier": user.tier}
    )
    _set_auth_cookie(response, token, expires_in)

    return TokenResponse(
        access_token=token,
        expires_in=expires_in,
        user=UserPublic(
            id=str(user.id),
            email=user.email,
            display_name=user.display_name,
            tier=user.tier,
            is_active=user.is_active,
        ),
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("20/minute")
async def login(
    request: Request,
    response: Response,
    body: LoginRequest,
):
    """
    Authenticate with email + password.
    Returns JWT in response body AND sets it as HttpOnly cookie.
    Constant-time comparison prevents timing attacks + user enumeration.
    Rate-limited: 20 attempts/minute per IP.
    """
    user = await get_user_by_email(body.email)
    # Constant-time check even when user doesn't exist (prevents timing attacks)
    dummy_hash = "$2b$12$placeholder.placeholder.placeholder.placeholder.placeholderX"
    pw_ok = verify_password(body.password, user.hashed_pw if user else dummy_hash)

    if not user or not pw_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Contact support.",
        )

    await stamp_last_login(user.id)
    token, expires_in = create_access_token(
        str(user.id), extra={"email": user.email, "tier": user.tier}
    )
    _set_auth_cookie(response, token, expires_in)

    return TokenResponse(
        access_token=token,
        expires_in=expires_in,
        user=UserPublic(
            id=str(user.id),
            email=user.email,
            display_name=user.display_name,
            tier=user.tier,
            is_active=user.is_active,
        ),
    )


@router.get("/me", response_model=MeResponse)
async def me(current_user: User = Depends(require_auth)):
    """Return the profile of the currently authenticated user."""
    return MeResponse(
        id=str(current_user.id),
        email=current_user.email,
        display_name=current_user.display_name,
        tier=current_user.tier,
        is_active=current_user.is_active,
    )


@router.patch("/me")
async def update_me(
    body: dict,
    current_user: User = Depends(require_auth),
):
    """Update the authenticated user's profile (currently: display_name)."""
    if "display_name" in body:
        new_name = str(body["display_name"]).strip()
        if len(new_name) < 2 or len(new_name) > 80:
            raise HTTPException(
                status_code=422,
                detail="display_name must be 2-80 characters.",
            )
        current_user.display_name = new_name
        await current_user.save()

    return {"message": "Profile updated."}


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    current_user: User = Depends(require_auth),
):
    """
    Server-side logout: clears the HttpOnly bos_session cookie.
    The JWT remains technically valid until expiry (stateless JWT).
    For full revocation, add a Redis blocklist here in production.
    """
    response.delete_cookie(
        key=SESSION_COOKIE,
        path="/",
        samesite="lax",
        secure=not settings.DEBUG,
        httponly=True,
    )
    return None
