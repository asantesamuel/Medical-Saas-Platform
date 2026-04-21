"""
app/features/admin/router.py
──────────────────────────────
Admin-only endpoints (require role='admin' in profiles table).
Powers the admin dashboard: user list, aggregate stats, audit log.

HIPAA: Aggregate stats do not expose individual scan data.
       Audit log records access events without PHI payload.
"""
import logging
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from supabase import Client

from app.core.supabase_client import get_supabase_client
from app.features.auth.dependencies import require_admin
from app.features.auth.schemas import AuthenticatedUser

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])


# ── Response schemas ───────────────────────────────────────────────────────────

class UserSummary(BaseModel):
    id: str
    full_name: str | None
    role: str
    created_at: str
    scan_count: int


class PlatformStats(BaseModel):
    total_users: int
    total_predictions: int
    tumor_predictions: int
    stroke_predictions: int
    avg_confidence: float
    predictions_today: int


class AuditEvent(BaseModel):
    id: str
    event_type: str           # 'predict' | 'login' | 'admin_access'
    user_id: str              # UUID only — no email
    metadata: dict            # model_type, confidence range — no PHI
    created_at: str


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get(
    "/users",
    response_model=list[UserSummary],
    summary="List all users with scan counts",
)
async def list_users(
    _admin: AuthenticatedUser = Depends(require_admin),
    supabase: Client = Depends(get_supabase_client),
    limit: int = 100,
    offset: int = 0,
) -> list[UserSummary]:
    profiles = (
        supabase.table("profiles")
        .select("id, full_name, role, created_at")
        .range(offset, offset + limit - 1)
        .execute()
    )

    result: list[UserSummary] = []
    for p in profiles.data or []:
        count_resp = (
            supabase.table("predictions")
            .select("id", count="exact")
            .eq("user_id", p["id"])
            .execute()
        )
        result.append(UserSummary(
            id=p["id"],
            full_name=p.get("full_name"),
            role=p.get("role", "user"),
            created_at=p["created_at"],
            scan_count=count_resp.count or 0,
        ))
    return result


@router.get(
    "/stats",
    response_model=PlatformStats,
    summary="Platform-wide aggregate statistics",
)
async def platform_stats(
    _admin: AuthenticatedUser = Depends(require_admin),
    supabase: Client = Depends(get_supabase_client),
) -> PlatformStats:
    total_users = (
        supabase.table("profiles").select("id", count="exact").execute().count or 0
    )
    all_preds = supabase.table("predictions").select("model_type, confidence_score, created_at").execute()
    rows = all_preds.data or []

    tumor = [r for r in rows if r["model_type"] == "tumor"]
    stroke = [r for r in rows if r["model_type"] == "stroke"]
    today_str = datetime.utcnow().date().isoformat()
    today_preds = [r for r in rows if r["created_at"].startswith(today_str)]
    avg_conf = (
        sum(r["confidence_score"] for r in rows) / len(rows) if rows else 0.0
    )

    return PlatformStats(
        total_users=total_users,
        total_predictions=len(rows),
        tumor_predictions=len(tumor),
        stroke_predictions=len(stroke),
        avg_confidence=round(avg_conf, 4),
        predictions_today=len(today_preds),
    )


@router.get(
    "/audit",
    response_model=list[AuditEvent],
    summary="Audit log — HIPAA access tracking",
)
async def audit_log(
    _admin: AuthenticatedUser = Depends(require_admin),
    supabase: Client = Depends(get_supabase_client),
    limit: int = 200,
) -> list[AuditEvent]:
    """
    Returns the most recent audit events from the `audit_log` table.
    Table must be created separately (see scripts/sql/audit_log.sql).
    Audit events are inserted by DB triggers and FastAPI middleware.
    """
    resp = (
        supabase.table("audit_log")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return [AuditEvent(**row) for row in (resp.data or [])]
