"""Health check endpoints."""
from fastapi import APIRouter
from pydantic import BaseModel
import structlog

from app.models.whisper_model import whisper_engine

logger = structlog.get_logger()
router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_loaded: bool
    device: str


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    info = whisper_engine.get_model_info()
    
    return HealthResponse(
        status="healthy" if info["loaded"] else "degraded",
        model_loaded=info["loaded"],
        device=info.get("device", "unknown"),
    )


@router.get("/health/ready")
async def readiness_check():
    """Readiness probe."""
    if whisper_engine.is_loaded:
        return {"status": "ready"}
    return {"status": "not_ready"}


@router.get("/health/live")
async def liveness_check():
    """Liveness probe."""
    return {"status": "alive"}
