"""Main FastAPI application for TTS Service."""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

from app.config import settings
from app.routers import synthesize, health, voices
from app.models.tts_engine import tts_engine

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Application lifespan manager."""
    # Startup
    logger.info("Starting TTS Service", version="1.0.0")
    
    # Initialize TTS engine
    logger.info("Initializing TTS engine", model=settings.TTS_MODEL)
    await tts_engine.initialize()
    logger.info("TTS engine initialized successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down TTS Service")
    await tts_engine.shutdown()
    logger.info("TTS Service shutdown complete")


app = FastAPI(
    title="Text-to-Speech Service",
    description="Text-to-speech synthesis service",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(synthesize.router, prefix="/synthesize", tags=["Synthesis"])
app.include_router(voices.router, prefix="/voices", tags=["Voices"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Text-to-Speech Service",
        "version": "1.0.0",
        "model": settings.TTS_MODEL,
        "status": "operational",
    }
