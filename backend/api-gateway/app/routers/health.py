"""Health check endpoints."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict
import structlog

from app.services.redis_client import redis_client
from app.services.service_registry import service_registry

logger = structlog.get_logger()
router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    services: Dict[str, str]
    redis: str


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Basic health check endpoint."""
    # Check Redis
    redis_status = "healthy"
    try:
        await redis_client._client.ping()
    except Exception:
        redis_status = "unhealthy"
    
    # Get service statuses
    services = service_registry.get_all_services()
    service_statuses = {
        name: svc.status for name, svc in services.items()
    }
    
    # Overall status
    overall = "healthy"
    if redis_status != "healthy" or any(s != "healthy" for s in service_statuses.values()):
        overall = "degraded"
    
    return HealthResponse(
        status=overall,
        version="1.0.0",
        services=service_statuses,
        redis=redis_status,
    )


@router.get("/health/ready")
async def readiness_check():
    """Kubernetes readiness probe."""
    services = service_registry.get_healthy_services()
    
    if len(services) < 2:  # Need at least 2 services
        return {"status": "not_ready", "healthy_services": len(services)}
    
    return {"status": "ready", "healthy_services": len(services)}


@router.get("/health/live")
async def liveness_check():
    """Kubernetes liveness probe."""
    return {"status": "alive"}
