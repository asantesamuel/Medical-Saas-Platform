"""
app/features/predictions/service.py
──────────────────────────────────────
Orchestrates the full inference pipeline:
  1. Download image from Supabase Storage via presigned URL
  2. Preprocess image (resize → normalize → batch dim)
  3. Run TensorFlow model inference
  4. Generate Grad-CAM heatmap
  5. Upload Grad-CAM to Supabase Storage
  6. Persist prediction row to Supabase DB
  7. Return structured result

HIPAA: image bytes are held in memory only for the duration of the request.
       No PHI is written to disk or logged.
"""
from __future__ import annotations

import io
import logging
import uuid
from typing import TYPE_CHECKING

import numpy as np
from PIL import Image

from app.features.predictions.schemas import (
    LOW_CONFIDENCE_THRESHOLD,
    PredictRequest,
    PredictResponse,
    TopResult,
)
from app.models.loader import ModelRegistry

if TYPE_CHECKING:
    from supabase import Client

logger = logging.getLogger(__name__)

# Model input dimensions
INPUT_SIZE = (224, 224)


# ── Image helpers ──────────────────────────────────────────────────────────────

def _download_image(supabase: "Client", image_path: str) -> bytes:
    """Generate a short-lived presigned URL and download image bytes."""
    bucket, *parts = image_path.split("/", 1)
    object_path = parts[0] if parts else image_path

    signed = supabase.storage.from_(bucket).create_signed_url(object_path, expires_in=60)
    signed_url: str = signed["signedURL"]

    import httpx
    response = httpx.get(signed_url, timeout=15)
    response.raise_for_status()
    return response.content


def _preprocess(image_bytes: bytes) -> np.ndarray:
    """Resize to 224×224, normalise to [0, 1], add batch dimension."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(INPUT_SIZE, Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)  # (1, 224, 224, 3)


# ── Grad-CAM ───────────────────────────────────────────────────────────────────

def _generate_gradcam(model, input_tensor: np.ndarray, class_idx: int) -> bytes:
    """
    Compute Grad-CAM heatmap for the predicted class.
    Returns PNG bytes.
    """
    import tensorflow as tf

    # Find last conv layer
    last_conv = next(
        (l for l in reversed(model.layers) if isinstance(l, tf.keras.layers.Conv2D)),
        None,
    )
    if last_conv is None:
        raise ValueError("No Conv2D layer found — cannot generate Grad-CAM")

    grad_model = tf.keras.Model(
        inputs=model.inputs,
        outputs=[last_conv.output, model.output],
    )

    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(input_tensor, training=False)
        loss = predictions[:, class_idx]

    grads = tape.gradient(loss, conv_outputs)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    conv_outputs = conv_outputs[0]
    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)
    heatmap = tf.maximum(heatmap, 0) / (tf.math.reduce_max(heatmap) + 1e-8)
    heatmap = heatmap.numpy()

    # Resize heatmap to input size and convert to RGB PNG
    hm_img = Image.fromarray(np.uint8(heatmap * 255), "L").resize(INPUT_SIZE)
    hm_rgb = hm_img.convert("RGB")
    buf = io.BytesIO()
    hm_rgb.save(buf, format="PNG")
    return buf.getvalue()


# ── Storage helpers ────────────────────────────────────────────────────────────

def _upload_gradcam(supabase: "Client", user_id: str, prediction_id: str, png_bytes: bytes) -> str:
    path = f"{user_id}/gradcam_{prediction_id}.png"
    supabase.storage.from_("gradcam-maps").upload(
        path=path,
        file=png_bytes,
        file_options={"content-type": "image/png"},
    )
    return f"gradcam-maps/{path}"


def _save_prediction(
    supabase: "Client",
    user_id: str,
    model_type: str,
    result: str,
    confidence: float,
    top3: list[dict],
    image_path: str,
    gradcam_path: str | None,
    model_version: str,
    prediction_id: str,
) -> None:
    supabase.table("predictions").insert({
        "id":               prediction_id,
        "user_id":          user_id,
        "model_type":       model_type,
        "result":           result,
        "confidence_score": confidence,
        "top_3_results":    top3,
        "image_path":       image_path,
        "gradcam_path":     gradcam_path,
        "model_version":    model_version,
    }).execute()


# ── Main orchestrator ──────────────────────────────────────────────────────────

async def run_inference(
    request: PredictRequest,
    supabase: "Client",
    registry: ModelRegistry,
) -> PredictResponse:
    prediction_id = str(uuid.uuid4())
    model_type = request.model_type.value

    logger.info("Inference start | user_id=%s model=%s", request.user_id, model_type)

    # 1. Download image
    image_bytes = _download_image(supabase, request.image_path)

    # 2. Preprocess
    input_tensor = _preprocess(image_bytes)

    # 3. Inference
    model, class_labels, model_version = registry.get(model_type)
    raw_preds = model.predict(input_tensor, verbose=0)[0]

    top3_indices = np.argsort(raw_preds)[::-1][:3]
    top3 = [
        {"label": class_labels[i], "confidence": float(raw_preds[i])}
        for i in top3_indices
    ]
    top_idx = int(top3_indices[0])
    confidence = float(raw_preds[top_idx])
    result_label = class_labels[top_idx]

    # 4. Grad-CAM
    gradcam_path: str | None = None
    try:
        png_bytes = _generate_gradcam(model, input_tensor, top_idx)
        gradcam_path = _upload_gradcam(supabase, request.user_id, prediction_id, png_bytes)
    except Exception as exc:
        logger.warning("Grad-CAM failed (non-fatal): %s", exc)

    # 5. Persist to DB
    _save_prediction(
        supabase=supabase,
        user_id=request.user_id,
        model_type=model_type,
        result=result_label,
        confidence=confidence,
        top3=top3,
        image_path=request.image_path,
        gradcam_path=gradcam_path,
        model_version=model_version,
        prediction_id=prediction_id,
    )

    logger.info(
        "Inference complete | user_id=%s model=%s confidence=%.3f",
        request.user_id, model_type, confidence,
    )

    return PredictResponse(
        prediction_id=prediction_id,
        result=result_label,
        confidence_score=confidence,
        top_3_results=[TopResult(**t) for t in top3],
        image_path=request.image_path,
        gradcam_path=gradcam_path,
        model_version=model_version,
        low_confidence_warning=confidence < LOW_CONFIDENCE_THRESHOLD,
    )
