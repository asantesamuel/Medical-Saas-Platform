"""
app/features/auth/dependencies.py
───────────────────────────────────
FastAPI dependency that verifies a Supabase JWT from the Authorization header.
Returns the authenticated user; raises 401 if the token is invalid or expired.

The verification delegates to Supabase Auth (supabase.auth.get_user(token)),
which is the authoritative source — no local key derivation needed.
"""
import logging

from fastapi import Depends, Header
from supabase import Client

from app.core.exceptions import UnauthorizedException
from app.core.supabase_client import get_supabase_client
from app.features.auth.schemas import AuthenticatedUser

logger = logging.getLogger(__name__)


async def get_current_user(
    authorization: str = Header(..., description="Bearer <supabase_access_token>"),
    supabase: Client = Depends(get_supabase_client),
) -> AuthenticatedUser:
    """
    Validate Supabase JWT and return the authenticated user.
    Inject into any protected route:  user: AuthenticatedUser = Depends(get_current_user)
    """
    if not authorization.startswith("Bearer "):
        raise UnauthorizedException("Authorization header must use Bearer scheme")

    token = authorization.removeprefix("Bearer ").strip()

    try:
        response = supabase.auth.get_user(token)
        user = response.user
        if user is None:
            raise UnauthorizedException("Token is invalid or expired")
    except UnauthorizedException:
        raise
    except Exception:
        # Do NOT log the token — HIPAA compliance
        logger.warning("JWT verification failed for incoming request")
        raise UnauthorizedException("Token is invalid or expired")

    return AuthenticatedUser(
        id=str(user.id),
        email=user.email or "",
        role=user.user_metadata.get("role", "user"),
    )


async def require_admin(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    """Dependency that additionally enforces admin role."""
    from app.core.exceptions import ForbiddenException

    if current_user.role != "admin":
        raise ForbiddenException("Admin access required")
    return current_user
