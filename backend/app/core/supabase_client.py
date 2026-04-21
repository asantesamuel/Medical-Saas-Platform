"""
app/core/supabase_client.py
────────────────────────────
Singleton Supabase client using the SERVICE ROLE key.
This client bypasses RLS — it is for server-side writes only.

HIPAA NOTE: The service role key must never appear in logs, API responses,
or error messages. Config values are loaded from environment, never hardcoded.
"""
from functools import lru_cache

from supabase import Client, create_client

from app.core.config import get_settings


@lru_cache
def get_supabase_client() -> Client:
    """
    Returns a cached Supabase client initialised with the service role key.
    Called once at startup; reused across all requests.
    """
    settings = get_settings()
    return create_client(
        supabase_url=settings.supabase_url,
        supabase_key=settings.supabase_service_role_key,
    )
