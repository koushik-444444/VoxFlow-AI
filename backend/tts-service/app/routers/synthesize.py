"""Synthesis endpoints."""
from typing import Optional

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
import structlog

from app.models.tts_engine import tts_engine

logger = structlog.get_logger()
router = APIRouter()


class SynthesizeRequest(BaseModel):
    """Synthesis request."""
    session_id: str
    text: str
    voice_id: Optional[str] = "default"
    speed: float = 1.0
    format: str = "wav"


class SynthesizeResponse(BaseModel):
    """Synthesis response."""
    session_id: str
    audio_data: bytes
    format: str
    duration_ms: Optional[float]
    latency_ms: float


@router.post("/")
async def synthesize(request: SynthesizeRequest):
    """Synthesize text to speech."""
    
    try:
        result = await tts_engine.synthesize(
            text=request.text,
            voice_id=request.voice_id,
            speed=request.speed,
        )
        
        logger.info(
            "Synthesis completed",
            session_id=request.session_id,
            text_length=len(request.text),
            latency_ms=result["latency_ms"],
        )
        
        return SynthesizeResponse(
            session_id=request.session_id,
            audio_data=result["audio_data"],
            format=result["format"],
            duration_ms=result["duration_ms"],
            latency_ms=result["latency_ms"],
        )
        
    except Exception as e:
        logger.error("Synthesis failed", error=str(e), session_id=request.session_id)
        raise HTTPException(status_code=500, detail=f"Synthesis failed: {str(e)}")


@router.post("/stream")
async def synthesize_stream(request: SynthesizeRequest):
    """Stream synthesized audio."""
    
    try:
        result = await tts_engine.synthesize(
            text=request.text,
            voice_id=request.voice_id,
            speed=request.speed,
        )
        
        return Response(
            content=result["audio_data"],
            media_type=f"audio/{request.format}",
            headers={
                "Content-Disposition": f"attachment; filename=tts.{request.format}",
                "X-Duration-Ms": str(result.get("duration_ms", "")),
                "X-Latency-Ms": str(result["latency_ms"]),
            },
        )
        
    except Exception as e:
        logger.error("Stream synthesis failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Synthesis failed: {str(e)}")
