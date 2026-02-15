"""Synthesis endpoints."""
from typing import AsyncGenerator, Optional

from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator
import structlog

from app.models.tts_engine import tts_engine

logger = structlog.get_logger()
router = APIRouter()

# Maximum text length for TTS synthesis (characters)
MAX_TTS_TEXT_LENGTH = 5000


class SynthesizeRequest(BaseModel):
    """Synthesis request."""
    session_id: str
    text: str
    voice_id: Optional[str] = "default"
    speed: float = 1.0
    format: str = "wav"

    @field_validator('text')
    @classmethod
    def validate_text_length(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Text must not be empty")
        if len(v) > MAX_TTS_TEXT_LENGTH:
            raise ValueError(f"Text exceeds maximum length of {MAX_TTS_TEXT_LENGTH} characters")
        return v

    @field_validator('speed')
    @classmethod
    def validate_speed(cls, v: float) -> float:
        if v < 0.25 or v > 4.0:
            raise ValueError("Speed must be between 0.25 and 4.0")
        return v


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
        
        return Response(
            content=result["audio_data"],
            media_type="audio/wav",
            headers={
                "X-Session-ID": request.session_id,
                "X-Duration-Ms": str(result.get("duration_ms", "")),
                "X-Latency-Ms": str(result["latency_ms"]),
            },
        )
        
    except Exception as e:
        logger.error("Synthesis failed", error=str(e), session_id=request.session_id)
        raise HTTPException(status_code=500, detail="Synthesis failed. Please try again.")


@router.post("/stream")
async def synthesize_stream(request: SynthesizeRequest):
    """Stream synthesized audio chunks as they are generated.

    Returns a chunked HTTP response so the gateway (or any caller)
    can forward audio to the client with lower time-to-first-byte.
    """

    async def audio_generator() -> AsyncGenerator[bytes, None]:
        async for chunk in tts_engine.synthesize_stream(
            text=request.text,
            voice_id=request.voice_id,
            speed=request.speed,
        ):
            yield chunk

    try:
        return StreamingResponse(
            audio_generator(),
            media_type=f"audio/{request.format}",
            headers={
                "X-Session-ID": request.session_id,
                "Transfer-Encoding": "chunked",
            },
        )
    except Exception as e:
        logger.error("Stream synthesis failed", error=str(e))
        raise HTTPException(status_code=500, detail="Synthesis failed. Please try again.")
