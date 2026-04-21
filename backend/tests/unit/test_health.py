"""
tests/unit/test_health.py
"""


def test_liveness(client):
    response = client.get("/health/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_readiness_with_loaded_models(client, mock_supabase, mock_model_registry):
    mock_supabase.table.return_value.select.return_value \
        .limit.return_value.execute.return_value = None
    response = client.get("/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["models_loaded"]["tumor"] is True
    assert data["models_loaded"]["stroke"] is True
