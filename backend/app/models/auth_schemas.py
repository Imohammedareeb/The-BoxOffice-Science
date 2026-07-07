"""
Pydantic schemas for authentication request/response payloads.
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class RegisterRequest(BaseModel):
    email: EmailStr
    display_name: str = Field(..., min_length=2, max_length=80, example="Areeb Khan")
    password: str = Field(..., min_length=8, max_length=128)
    tier: str = Field(default="Analyst", pattern="^(Analyst|Executive)$")

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int          # seconds
    user: "UserPublic"


class UserPublic(BaseModel):
    id: str
    email: str
    display_name: str
    tier: str
    is_active: bool

    model_config = {"from_attributes": True}


class MeResponse(BaseModel):
    id: str
    email: str
    display_name: str
    tier: str
    is_active: bool

    model_config = {"from_attributes": True}


# Update forward ref
TokenResponse.model_rebuild()
