"""
app/features/predictions/router.py
──────────────────────────────────────
Routes:
  POST /api/v1/predictions/predict   — run inference (rate-limited: 10/min/user)
  GET  /api/v1/predictions/          — list current user's prediction history
"""
import logging

from fastapi import APIRouter, Depends, Request
from supabase import Client
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.supabase_client import get_supabase_client
from app.core.config import get_settings
from app.features.auth.dependencies import get_current_user
from app.features.auth.schemas import AuthenticatedUser
from app.features.predictions.schemas import (
    PredictRequest,
    PredictResponse,
    PredictionRecord,
)
from app.features.predictions.service import run_inference
from app.models.loader import get_model_registry, ModelRegistry

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/predictions", tags=["predictions"])
limiter = Limiter(key_func=get_remote_address)


@router.post(
    "/predict",
    response_model=PredictResponse,
    summary="Run AI inference on a scan image",
    description=(
        "Accepts a Supabase Storage image path and model type. "
        "Downloads the image, runs the TensorFlow model, generates a Grad-CAM heatmap, "
        "persists the result to Supabase DB, and returns structured prediction JSON."
    ),
)
@limiter.limit(get_settings().predict_rate_limit)
async def predict(
    request: Request,             # required by slowapi limiter
    body: PredictRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
    registry: ModelRegistry = Depends(get_model_registry),
) -> PredictResponse:
    # Ensure the user_id in the request body matches the authenticated user
    if body.user_id != current_user.id:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("user_id does not match authenticated user")

    return await run_inference(body, supabase, registry)


@router.get(
    "/",
    response_model=list[PredictionRecord],
    summary="List prediction history for the current user",
    description=(
        "Server-side fetch via supabase-py. "
        "Supabase RLS guarantees only the authenticated user's rows are returned. "
        "The React frontend may also subscribe to real-time updates via supabase-js."
    ),
)
async def list_predictions(
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
    limit: int = 50,
    offset: int = 0,
) -> list[PredictionRecord]:
    response = (
        supabase.table("predictions")
        .select("*")
        .eq("user_id", current_user.id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return [PredictionRecord(**row) for row in (response.data or [])]
