"""Main FastAPI application for STT Service."""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

from app.config import settings
from app.routers import transcribe, health
from app.models.whisper_model import whisper_engine

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Application lifespan manager."""
    # Startup
    logger.info("Starting STT Service", version="1.0.0")
    
    # Load Whisper model
    logger.info("Loading Whisper model", model=settings.WHISPER_MODEL)
    await whisper_engine.load_model()
    logger.info("Whisper model loaded successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down STT Service")
    await whisper_engine.unload_model()
    logger.info("STT Service shutdown complete")


app = FastAPI(
    title="Speech-to-Text Service",
    description="Real-time speech-to-text using OpenAI Whisper",
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
app.include_router(transcribe.router, prefix="/transcribe", tags=["Transcription"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Speech-to-Text Service",
        "version": "1.0.0",
        "model": settings.WHISPER_MODEL,
        "status": "operational",
    }
