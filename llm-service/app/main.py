"""Main FastAPI application for LLM Service."""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

from app.config import settings
from app.routers import generate, health
from app.models.llm_engine import llm_engine

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Application lifespan manager."""
    # Startup
    logger.info("Starting LLM Service", version=__version__)
    
    # Initialize LLM engine
    logger.info("Initializing LLM engine", provider=settings.LLM_PROVIDER)
    await llm_engine.initialize()
    logger.info("LLM engine initialized successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down LLM Service")
    await llm_engine.shutdown()
    logger.info("LLM Service shutdown complete")


app = FastAPI(
    title="LLM Service",
    description="Language model service with streaming support",
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
app.include_router(generate.router, prefix="/generate", tags=["Generation"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "LLM Service",
        "version": "1.0.0",
        "provider": settings.LLM_PROVIDER,
        "status": "operational",
    }
