"""
app/main.py
────────────
FastAPI application factory.
Registers routers, middleware, exception handlers, and lifespan events.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import get_settings
from app.core.exceptions import AppException, app_exception_handler
from app.core.logging import setup_logging
from app.models.loader import ModelRegistry, set_model_registry
from app.features.predictions.router import router as predictions_router, limiter
from app.features.admin.router import router as admin_router
from app.features.health.router import router as health_router

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan: load TF models on startup, clean up on shutdown.
    Models are loaded once and reused across all requests.
    """
    settings = get_settings()
    registry = ModelRegistry()
    registry.load_all(settings)
    set_model_registry(registry)
    yield
    # Shutdown: nothing to clean up for in-memory TF models


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="AI Medical SaaS — Inference API",
        description=(
            "Brain Tumor & Ischemic Stroke detection API. "
            "Supabase handles auth, storage, and DB. "
            "This service handles TensorFlow inference only."
        ),
        version="0.1.0",
        docs_url="/docs" if not settings.is_production else None,  # hide in prod
        redoc_url="/redoc" if not settings.is_production else None,
        lifespan=lifespan,
    )

    # ── Rate limiter ───────────────────────────────────────────────────────────
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    # ── CORS ───────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.allowed_origin],
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["*"],  # allows Authorization, Content-Type, and anything else the browser sends
    )

    # ── Exception handlers ─────────────────────────────────────────────────────
    app.add_exception_handler(AppException, app_exception_handler)

    # ── Routers ────────────────────────────────────────────────────────────────
    prefix = "/api/v1"
    app.include_router(health_router)                          # /health
    app.include_router(predictions_router, prefix=prefix)      # /api/v1/predictions
    app.include_router(admin_router, prefix=prefix)            # /api/v1/admin

    return app


app = create_app()
