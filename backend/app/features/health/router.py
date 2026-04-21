"""
app/features/health/router.py
──────────────────────────────
/health — liveness probe for Render/Railway.
/health/ready — readiness probe: checks models are loaded and Supabase is reachable.
"""
import logging
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from supabase import Client

from app.core.supabase_client import get_supabase_client
from app.models.loader import get_model_registry, ModelRegistry

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["health"])


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    models_loaded: dict[str, bool]
    supabase_reachable: bool


@router.get("/", summary="Liveness probe")
async def liveness() -> dict:
    return {"status": "ok"}


@router.get("/ready", response_model=HealthResponse, summary="Readiness probe")
async def readiness(
    supabase: Client = Depends(get_supabase_client),
    registry: ModelRegistry = Depends(get_model_registry),
) -> HealthResponse:
    # Check models
    models_loaded = {
        "tumor": registry.is_loaded("tumor"),
        "stroke": registry.is_loaded("stroke"),
    }

    # Check Supabase connectivity (lightweight ping)
    supabase_ok = False
    try:
        supabase.table("profiles").select("id").limit(1).execute()
        supabase_ok = True
    except Exception as exc:
        logger.warning("Supabase readiness check failed: %s", exc)

    all_ok = all(models_loaded.values()) and supabase_ok

    return HealthResponse(
        status="ok" if all_ok else "degraded",
        models_loaded=models_loaded,
        supabase_reachable=supabase_ok,
    )
