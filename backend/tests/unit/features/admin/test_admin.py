"""
tests/unit/features/admin/test_router.py
──────────────────────────────────────────
Tests for admin-only endpoints.
"""
import pytest
from unittest.mock import MagicMock

from tests.conftest import VALID_TOKEN, VALID_USER_ID

AUTH_HEADERS = {"Authorization": f"Bearer {VALID_TOKEN}"}


def test_non_admin_cannot_access_users(client, mock_supabase):
    """Regular user role should receive 403."""
    mock_user = MagicMock()
    mock_user.id = VALID_USER_ID
    mock_user.email = "user@hospital.org"
    mock_user.user_metadata = {"role": "user"}
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)

    response = client.get("/api/v1/admin/users", headers=AUTH_HEADERS)
    assert response.status_code == 403


def test_admin_can_access_users(client, mock_supabase):
    """Admin role should return 200."""
    mock_user = MagicMock()
    mock_user.id = VALID_USER_ID
    mock_user.email = "admin@hospital.org"
    mock_user.user_metadata = {"role": "admin"}
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)

    mock_supabase.table.return_value.select.return_value \
        .range.return_value.execute.return_value = MagicMock(data=[])

    response = client.get("/api/v1/admin/users", headers=AUTH_HEADERS)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_admin_stats_returns_expected_keys(client, mock_supabase):
    mock_user = MagicMock()
    mock_user.id = VALID_USER_ID
    mock_user.email = "admin@hospital.org"
    mock_user.user_metadata = {"role": "admin"}
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)

    mock_supabase.table.return_value.select.return_value \
        .execute.return_value = MagicMock(data=[], count=0)

    response = client.get("/api/v1/admin/stats", headers=AUTH_HEADERS)
    assert response.status_code == 200
    keys = response.json().keys()
    for expected in ["total_users", "total_predictions", "avg_confidence"]:
        assert expected in keys
