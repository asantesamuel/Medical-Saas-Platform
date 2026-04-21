"""
app/features/auth/schemas.py
──────────────────────────────
Pydantic models for auth domain.
"""
from pydantic import BaseModel, EmailStr


class AuthenticatedUser(BaseModel):
    id: str           # UUID string — safe to log
    email: str        # HIPAA: do NOT include in prediction logs
    role: str         # 'user' | 'admin'
