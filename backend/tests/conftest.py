"""
tests/conftest.py
──────────────────
Shared pytest fixtures for unit and integration tests.
Uses httpx.AsyncClient with FastAPI's ASGI transport (no real HTTP server needed).
Supabase calls are mocked via unittest.mock to avoid real network calls in unit tests.
"""
from __future__ import annotations

import io
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient
from PIL import Image

from app.main import create_app

# ── Helpers ────────────────────────────────────────────────────────────────────

def _make_png_bytes(size: tuple[int, int] = (224, 224)) -> bytes:
    """Generate a minimal valid PNG image in memory."""
    img = Image.fromarray(np.random.randint(0, 255, (*size, 3), dtype=np.uint8))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


VALID_USER_ID = str(uuid.uuid4())
VALID_TOKEN = "eyJfake.token.for_tests"


# ── Mocks ──────────────────────────────────────────────────────────────────────

@pytest.fixture
def mock_supabase():
    """Return a fully mocked Supabase client."""
    client = MagicMock()

    # auth.get_user — returns a user object
    mock_user = MagicMock()
    mock_user.id = VALID_USER_ID
    mock_user.email = "clinician@hospital.org"
    mock_user.user_metadata = {"role": "user"}
    client.auth.get_user.return_value = MagicMock(user=mock_user)

    # storage — upload and signed URL
    client.storage.from_.return_value.upload.return_value = {"Key": "gradcam-maps/path.png"}
    client.storage.from_.return_value.create_signed_url.return_value = {
        "signedURL": "https://fake-supabase.co/storage/signed/scan.png"
    }

    # table inserts / selects
    client.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[])
    client.table.return_value.select.return_value.eq.return_value \
        .order.return_value.range.return_value.execute.return_value = MagicMock(data=[])

    return client


@pytest.fixture
def mock_model_registry():
    """Return a ModelRegistry with a mock TF model."""
    registry = MagicMock()
    registry.is_loaded.return_value = True

    # Fake model that returns deterministic predictions
    mock_model = MagicMock()
    mock_model.predict.return_value = np.array([[0.85, 0.10, 0.03, 0.02]])

    registry.get.return_value = (
        mock_model,
        ["No Tumor", "Glioma Detected", "Meningioma Detected", "Pituitary Detected"],
        "tumor_v2",
    )
    return registry


@pytest.fixture
def app(mock_supabase, mock_model_registry):
    """
    FastAPI app with Supabase and ModelRegistry overridden for testing.
    """
    from app.core.supabase_client import get_supabase_client
    from app.models.loader import get_model_registry

    application = create_app()
    application.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    application.dependency_overrides[get_model_registry] = lambda: mock_model_registry
    return application


@pytest.fixture
def client(app):
    return TestClient(app)


@pytest_asyncio.fixture
async def async_client(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
def auth_headers():
    return {"Authorization": f"Bearer {VALID_TOKEN}"}


@pytest.fixture
def png_bytes():
    return _make_png_bytes()
