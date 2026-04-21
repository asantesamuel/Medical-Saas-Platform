"""
tests/unit/features/auth/test_dependencies.py
───────────────────────────────────────────────
Tests for JWT verification dependency.
"""
import pytest
from fastapi import HTTPException
from unittest.mock import MagicMock

from app.core.exceptions import UnauthorizedException
from app.features.auth.dependencies import get_current_user


@pytest.mark.asyncio
async def test_valid_jwt_returns_user(mock_supabase):
    user = await get_current_user(
        authorization="Bearer valid.token.here",
        supabase=mock_supabase,
    )
    assert user.id is not None
    assert user.role == "user"


@pytest.mark.asyncio
async def test_missing_bearer_prefix_raises_401(mock_supabase):
    with pytest.raises(UnauthorizedException):
        await get_current_user(
            authorization="invalid-no-bearer",
            supabase=mock_supabase,
        )


@pytest.mark.asyncio
async def test_expired_token_raises_401(mock_supabase):
    mock_supabase.auth.get_user.side_effect = Exception("JWT expired")
    with pytest.raises(UnauthorizedException):
        await get_current_user(
            authorization="Bearer expired.token",
            supabase=mock_supabase,
        )


@pytest.mark.asyncio
async def test_supabase_returns_none_user_raises_401(mock_supabase):
    mock_supabase.auth.get_user.return_value = MagicMock(user=None)
    with pytest.raises(UnauthorizedException):
        await get_current_user(
            authorization="Bearer token.with.no.user",
            supabase=mock_supabase,
        )
