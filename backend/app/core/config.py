from pydantic_settings import BaseSettings, SettingsConfigDict, NoDecode
from pydantic import field_validator
from typing import Annotated, List
import json
import logging

logger = logging.getLogger("bos.config")

_WEAK_SECRET = "dev-secret-change-in-production"


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Box Office Science API"
    DEBUG: bool = False

    # Database — MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "boxoffice"

    # Security
    SECRET_KEY: str = _WEAK_SECRET

    # CORS — accepts a JSON array, a comma-separated list, or a single origin.
    ALLOWED_ORIGINS: Annotated[List[str], NoDecode] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def _parse_origins(cls, v):
        if isinstance(v, str):
            s = v.strip()
            if s.startswith("["):
                return json.loads(s)
            return [o.strip() for o in s.split(",") if o.strip()]
        return v

    # External APIs
    TMDB_API_KEY: str = ""
    OMDB_API_KEY: str = ""

    # AI / ML (optional)
    OPENAI_API_KEY: str = ""
    HUGGINGFACE_TOKEN: str = ""

    # Rate limiting
    RATE_LIMIT_PREDICTION: str = "30/minute"   # POST /api/predictions/revenue
    RATE_LIMIT_NLP: str = "20/minute"           # POST /api/nlp/match

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )

    def validate_security(self) -> None:
        """
        Verify that security-critical settings are properly configured.
        Raises RuntimeError if defaults are used.
        """
        if self.SECRET_KEY == _WEAK_SECRET:
            raise RuntimeError(
                "SECRET_KEY must be changed from the development default. "
                "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
            )


settings = Settings()
