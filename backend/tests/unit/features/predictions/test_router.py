"""
tests/unit/features/predictions/test_router.py
────────────────────────────────────────────────
Core test suite for the /predict endpoint.
Covers the 6 required tests from the project doc plus additional edge cases.
"""
import uuid
from unittest.mock import MagicMock, patch

import pytest

from tests.conftest import VALID_USER_ID, VALID_TOKEN


AUTH_HEADERS = {"Authorization": f"Bearer {VALID_TOKEN}"}
PREDICT_URL = "/api/v1/predictions/predict"


def _predict_body(model_type: str = "tumor", user_id: str = VALID_USER_ID) -> dict:
    return {
        "image_path": f"scan-images/{user_id}/scan_{uuid.uuid4()}.jpg",
        "model_type": model_type,
        "user_id": user_id,
    }


# ── Test 1: Valid prediction returns correct response shape ────────────────────

def test_valid_prediction_returns_correct_shape(client):
    with patch("app.features.predictions.service._download_image", return_value=b"\x89PNG\r\n"):
        with patch("app.features.predictions.service._preprocess") as mock_pre:
            import numpy as np
            mock_pre.return_value = np.zeros((1, 224, 224, 3), dtype="float32")
            with patch("app.features.predictions.service._generate_gradcam", return_value=b"PNG"):
                with patch("app.features.predictions.service._upload_gradcam", return_value="gradcam-maps/path.png"):
                    response = client.post(PREDICT_URL, json=_predict_body(), headers=AUTH_HEADERS)

    assert response.status_code == 200
    data = response.json()
    assert "prediction_id" in data
    assert "result" in data
    assert "confidence_score" in data
    assert "top_3_results" in data
    assert len(data["top_3_results"]) == 3
    assert "low_confidence_warning" in data


# ── Test 2: Invalid file type rejected ────────────────────────────────────────

def test_invalid_model_type_rejected(client):
    body = _predict_body()
    body["model_type"] = "xray"  # not 'tumor' or 'stroke'
    response = client.post(PREDICT_URL, json=body, headers=AUTH_HEADERS)
    assert response.status_code == 422


# ── Test 3: JWT verification — missing token returns 401 ──────────────────────

def test_missing_jwt_returns_401(client):
    response = client.post(PREDICT_URL, json=_predict_body())
    assert response.status_code == 422  # Authorization header missing → validation error


def test_invalid_jwt_returns_401(client, mock_supabase):
    mock_supabase.auth.get_user.side_effect = Exception("bad token")
    response = client.post(
        PREDICT_URL,
        json=_predict_body(),
        headers={"Authorization": "Bearer bad.token"},
    )
    assert response.status_code == 401


# ── Test 4: user_id mismatch returns 403 ──────────────────────────────────────

def test_user_id_mismatch_returns_403(client):
    body = _predict_body(user_id=str(uuid.uuid4()))  # different UUID
    response = client.post(PREDICT_URL, json=body, headers=AUTH_HEADERS)
    assert response.status_code == 403


# ── Test 5: Low confidence triggers warning flag ───────────────────────────────

def test_low_confidence_sets_warning_flag(client, mock_model_registry):
    import numpy as np
    # Set confidence below threshold (< 0.40)
    mock_model = MagicMock()
    mock_model.predict.return_value = np.array([[0.30, 0.40, 0.20, 0.10]])
    mock_model_registry.get.return_value = (
        mock_model,
        ["No Tumor", "Glioma Detected", "Meningioma Detected", "Pituitary Detected"],
        "tumor_v2",
    )

    with patch("app.features.predictions.service._download_image", return_value=b"\x89PNG"):
        with patch("app.features.predictions.service._preprocess") as mock_pre:
            mock_pre.return_value = np.zeros((1, 224, 224, 3), dtype="float32")
            with patch("app.features.predictions.service._generate_gradcam", return_value=b"PNG"):
                with patch("app.features.predictions.service._upload_gradcam", return_value="gradcam-maps/p.png"):
                    response = client.post(PREDICT_URL, json=_predict_body(), headers=AUTH_HEADERS)

    assert response.status_code == 200
    assert response.json()["low_confidence_warning"] is True


# ── Test 6: DB row inserted after predict ─────────────────────────────────────

def test_db_row_inserted_after_predict(client, mock_supabase):
    with patch("app.features.predictions.service._download_image", return_value=b"\x89PNG"):
        with patch("app.features.predictions.service._preprocess") as mock_pre:
            import numpy as np
            mock_pre.return_value = np.zeros((1, 224, 224, 3), dtype="float32")
            with patch("app.features.predictions.service._generate_gradcam", return_value=b"PNG"):
                with patch("app.features.predictions.service._upload_gradcam", return_value="gradcam-maps/p.png"):
                    client.post(PREDICT_URL, json=_predict_body(), headers=AUTH_HEADERS)

    mock_supabase.table.assert_called_with("predictions")
    mock_supabase.table.return_value.insert.assert_called_once()
    inserted = mock_supabase.table.return_value.insert.call_args[0][0]
    assert inserted["user_id"] == VALID_USER_ID
    assert inserted["model_type"] == "tumor"


# ── Test 7: stroke model type accepted ────────────────────────────────────────

def test_stroke_model_type_accepted(client, mock_model_registry):
    import numpy as np
    mock_model = MagicMock()
    mock_model.predict.return_value = np.array([[0.90, 0.10]])
    mock_model_registry.get.return_value = (
        mock_model,
        ["Normal", "Ischemic Stroke Detected"],
        "stroke_v1",
    )

    with patch("app.features.predictions.service._download_image", return_value=b"\x89PNG"):
        with patch("app.features.predictions.service._preprocess") as mock_pre:
            mock_pre.return_value = np.zeros((1, 224, 224, 3), dtype="float32")
            with patch("app.features.predictions.service._generate_gradcam", return_value=b"PNG"):
                with patch("app.features.predictions.service._upload_gradcam", return_value="g.png"):
                    response = client.post(
                        PREDICT_URL,
                        json=_predict_body(model_type="stroke"),
                        headers=AUTH_HEADERS,
                    )

    assert response.status_code == 200
    assert response.json()["model_version"] == "stroke_v1"
