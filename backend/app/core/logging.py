"""
app/core/logging.py
────────────────────
Structured logging setup.

HIPAA REQUIREMENT: Logs must NEVER contain:
  - Patient image data or paths that identify individuals
  - Supabase service role keys
  - User email addresses or full names
  - Prediction content tied to an identifiable individual

Safe to log: user_id (UUID), model_type, confidence_score, request duration,
             error codes, and anonymised request metadata.
"""
import logging
import sys

from app.core.config import get_settings


def setup_logging() -> None:
    settings = get_settings()
    level = getattr(logging, settings.log_level.upper(), logging.INFO)

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)

    fmt = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    handler.setFormatter(fmt)

    root = logging.getLogger()
    root.setLevel(level)
    root.addHandler(handler)

    # Suppress noisy third-party loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("supabase").setLevel(logging.WARNING)
