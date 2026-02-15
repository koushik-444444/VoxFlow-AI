"""Main FastAPI application for API Gateway."""
import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import structlog

from app.config import settings
from app.middleware import LoggingMiddleware, TimingMiddleware, ErrorHandlingMiddleware, RateLimitMiddleware
from app.routers import websocket, chat, health, session, tts
from app.services.redis_client import redis_client
from app.services.service_registry import service_registry

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Application lifespan manager."""
    # Startup
    logger.info("Starting API Gateway", version="1.0.0")
    
    # Validate security-critical settings
    settings.validate_security()
    
    # Initialize Redis connection
    await redis_client.connect()
    
    # Initialize service registry
    await service_registry.discover_services()
    
    # Start background tasks
    heartbeat_task = asyncio.create_task(service_registry.heartbeat_loop())
    
    logger.info("API Gateway started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down API Gateway")
    
    # Cancel background tasks
    heartbeat_task.cancel()
    try:
        await heartbeat_task
    except asyncio.CancelledError:
        pass
    
    # Close Redis connection
    await redis_client.disconnect()
    
    logger.info("API Gateway shutdown complete")


app = FastAPI(
    title="Speech-to-Speech AI API Gateway",
    description="Real-time speech-to-speech AI platform API Gateway",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Process-Time", "X-Response-Time", "X-RateLimit-Remaining"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(TimingMiddleware)
app.add_middleware(ErrorHandlingMiddleware)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(session.router, prefix="/api/v1/session", tags=["Session"])
app.include_router(tts.router, prefix="/api/v1/tts", tags=["TTS"])


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(
        "Unhandled exception",
        error=str(exc),
        path=request.url.path,
        method=request.method,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": "internal_error"}
    )


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Speech-to-Speech AI API Gateway",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }
