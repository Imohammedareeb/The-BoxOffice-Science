"""
Authentication Service
Handles password hashing, JWT creation/verification, and user lookups.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from beanie import PydanticObjectId
from beanie.operators import Set
from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.models.documents import User

logger = logging.getLogger("bos.auth")

# ─────────────────────────────────────────────────────────
# Password hashing
# ─────────────────────────────────────────────────────────

_pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
ALGORITHM = "HS256"


def hash_password(plain: str) -> str:
    return _pwd_ctx.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_ctx.verify(plain, hashed)


# ─────────────────────────────────────────────────────────
# JWT
# ─────────────────────────────────────────────────────────

def create_access_token(subject: str, extra: dict | None = None) -> tuple[str, int]:
    """
    Returns (token, expires_in_seconds).
    subject = user id string.
    """
    expires = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expires, "iat": datetime.now(timezone.utc)}
    if extra:
        payload.update(extra)
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)
    return token, ACCESS_TOKEN_EXPIRE_MINUTES * 60


def decode_token(token: str) -> dict:
    """Decode and validate a JWT. Raises JWTError on failure."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])


# ─────────────────────────────────────────────────────────
# DB helpers
# ─────────────────────────────────────────────────────────

async def get_user_by_email(email: str) -> Optional[User]:
    return await User.find_one(User.email == email.lower())


async def get_user_by_id(user_id: str) -> Optional[User]:
    try:
        oid = PydanticObjectId(user_id)
    except Exception:
        return None
    return await User.get(oid)


async def create_user(
    email: str, display_name: str, password: str, tier: str = "Analyst"
) -> User:
    user = User(
        email=email.lower(),
        display_name=display_name,
        hashed_pw=hash_password(password),
        tier=tier,
    )
    await user.insert()
    return user


async def stamp_last_login(user_id: PydanticObjectId) -> None:
    await User.find_one(User.id == user_id).update(
        Set({User.last_login: datetime.now(timezone.utc)})
    )
