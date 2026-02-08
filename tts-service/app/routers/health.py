"""Health check endpoints."""
from fastapi import APIRouter
from pydantic import BaseModel
import structlog

from app.models.tts_engine import tts_engine

logger = structlog.get_logger()
router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    initialized: bool
    provider: str


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    info = tts_engine.get_info()
    
    return HealthResponse(
        status="healthy" if info["initialized"] else "degraded",
        initialized=info["initialized"],
        provider=info.get("provider", "unknown"),
    )


@router.get("/health/ready")
async def readiness_check():
    """Readiness probe."""
    if tts_engine.is_initialized:
        return {"status": "ready"}
    return {"status": "not_ready"}


@router.get("/health/live")
async def liveness_check():
    """Liveness probe."""
    return {"status": "alive"}
