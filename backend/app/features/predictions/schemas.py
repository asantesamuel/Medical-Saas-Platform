"""
app/features/predictions/schemas.py
──────────────────────────────────────
Request and response models for the /predict endpoint.
"""
from enum import Enum
from typing import Annotated

from pydantic import BaseModel, Field, field_validator

# ── Constants ─────────────────────────────────────────────────────────────────
ALLOWED_MODEL_TYPES = {"tumor", "stroke"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}
LOW_CONFIDENCE_THRESHOLD = 0.40         # below this → warning banner in frontend


# ── Enums ─────────────────────────────────────────────────────────────────────
class ModelType(str, Enum):
    tumor = "tumor"
    stroke = "stroke"


# ── Request ───────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    image_path: Annotated[str, Field(min_length=1, max_length=500)]
    model_type: ModelType
    user_id: Annotated[str, Field(min_length=36, max_length=36)]  # UUID


# ── Response sub-models ───────────────────────────────────────────────────────
class TopResult(BaseModel):
    label: str
    confidence: float = Field(ge=0.0, le=1.0)


class PredictResponse(BaseModel):
    prediction_id: str
    result: str
    confidence_score: float = Field(ge=0.0, le=1.0)
    top_3_results: list[TopResult]
    image_path: str
    gradcam_path: str | None = None
    model_version: str
    low_confidence_warning: bool  # True if confidence_score < LOW_CONFIDENCE_THRESHOLD


# ── History item (returned by GET /predictions) ───────────────────────────────
class PredictionRecord(BaseModel):
    id: str
    model_type: ModelType
    result: str
    confidence_score: float
    top_3_results: list[TopResult]
    image_path: str
    gradcam_path: str | None
    model_version: str
    created_at: str
