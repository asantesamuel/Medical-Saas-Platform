"""
app/core/exceptions.py
───────────────────────
Centralised exception classes and FastAPI exception handlers.
"""
from fastapi import Request
from fastapi.responses import JSONResponse


class AppException(Exception):
    """Base exception — all domain exceptions inherit from this."""

    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Unauthorized") -> None:
        super().__init__(status_code=401, detail=detail)


class ForbiddenException(AppException):
    def __init__(self, detail: str = "Forbidden") -> None:
        super().__init__(status_code=403, detail=detail)


class NotFoundException(AppException):
    def __init__(self, detail: str = "Not found") -> None:
        super().__init__(status_code=404, detail=detail)


class ValidationException(AppException):
    def __init__(self, detail: str) -> None:
        super().__init__(status_code=422, detail=detail)


class InferenceException(AppException):
    def __init__(self, detail: str = "Model inference failed") -> None:
        super().__init__(status_code=500, detail=detail)


# ── FastAPI exception handlers ────────────────────────────────────────────────

async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )
