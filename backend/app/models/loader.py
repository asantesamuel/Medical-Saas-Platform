"""
app/models/loader.py
──────────────────────
TensorFlow model registry — loaded once at application startup via lifespan.
Avoids reloading models on every request (expensive for CPU inference).

Usage:
    registry = ModelRegistry()
    registry.load_all(settings)

    model, labels, version = registry.get("tumor")
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from functools import lru_cache

from app.core.config import Settings, get_settings

logger = logging.getLogger(__name__)


# Per-model class label definitions
TUMOR_LABELS = [
    "No Tumor",
    "Glioma Detected",
    "Meningioma Detected",
    "Pituitary Detected",
]

STROKE_LABELS = [
    "Normal",
    "Ischemic Stroke Detected",
]


@dataclass
class LoadedModel:
    model: object          # tf.keras.Model
    labels: list[str]
    version: str
    loaded: bool = False


class ModelRegistry:
    """
    Holds references to loaded TensorFlow models.
    Thread-safe for read-only access after initial load.
    """

    def __init__(self) -> None:
        self._models: dict[str, LoadedModel] = {
            "tumor": LoadedModel(model=None, labels=TUMOR_LABELS, version="tumor_v2"),
            "stroke": LoadedModel(model=None, labels=STROKE_LABELS, version="stroke_v1"),
        }

    def load_all(self, settings: Settings) -> None:
        """Load both TF models from disk. Called once during app lifespan startup."""
        import tensorflow as tf  # deferred import — avoids slow TF init at module load

        paths = {
            "tumor": settings.tumor_model_path,
            "stroke": settings.stroke_model_path,
        }

        for name, path in paths.items():
            logger.info("Loading model '%s' from %s", name, path)
            try:
                self._models[name].model = tf.keras.models.load_model(path)
                self._models[name].loaded = True
                logger.info("Model '%s' loaded successfully", name)
            except Exception as exc:
                logger.error("Failed to load model '%s': %s", name, exc)
                # App starts in degraded state — health/ready will report this

    def get(self, model_type: str) -> tuple:
        """Return (model, labels, version). Raises if model is not loaded."""
        entry = self._models.get(model_type)
        if entry is None or not entry.loaded:
            raise RuntimeError(f"Model '{model_type}' is not loaded")
        return entry.model, entry.labels, entry.version

    def is_loaded(self, model_type: str) -> bool:
        entry = self._models.get(model_type)
        return entry is not None and entry.loaded


# ── FastAPI dependency ─────────────────────────────────────────────────────────

_registry: ModelRegistry | None = None


def get_model_registry() -> ModelRegistry:
    """Dependency that returns the singleton registry populated at startup."""
    global _registry
    if _registry is None:
        raise RuntimeError("ModelRegistry not initialised — check app lifespan")
    return _registry


def set_model_registry(registry: ModelRegistry) -> None:
    """Called by the lifespan handler after loading models."""
    global _registry
    _registry = registry
