"""
app/core/config.py
──────────────────
Single source of truth for all environment variables.
Loaded once at startup; injected via FastAPI dependency where needed.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Supabase
    supabase_url: str
    supabase_service_role_key: str  # NEVER log or return in any response

    # Model paths
    tumor_model_path: str = "./models/brain_tumor_model.h5"
    stroke_model_path: str = "./models/stroke_model.h5"

    # CORS
    allowed_origin: str = "http://localhost:5173"

    # App
    app_env: str = "development"
    log_level: str = "INFO"

    # Rate limiting
    predict_rate_limit: str = "10/minute"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    """Cache settings — loaded once per process."""
    return Settings()
