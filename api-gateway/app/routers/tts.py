"""TTS API endpoints."""
from typing import Optional
import base64

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
import httpx
import structlog

from app.services.service_registry import service_registry

logger = structlog.get_logger()
router = APIRouter()


class TTSRequest(BaseModel):
    """TTS request model."""
    session_id: str
    text: str
    voice_id: Optional[str] = "default"
    speed: float = 1.0
    format: str = "wav"


class TTSResponse(BaseModel):
    """TTS response model."""
    session_id: str
    audio_base64: str
    format: str
    duration_ms: Optional[float]


@router.post("/", response_model=TTSResponse)
async def text_to_speech(request: TTSRequest):
    """Convert text to speech."""
    
    # Get TTS service
    tts_service = service_registry.get_healthy_service("tts")
    if not tts_service:
        raise HTTPException(status_code=503, detail="TTS service unavailable")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{tts_service.url}/synthesize",
                json={
                    "session_id": request.session_id,
                    "text": request.text,
                    "voice_id": request.voice_id,
                    "speed": request.speed,
                    "format": request.format,
                },
                timeout=30.0,
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"TTS service error: {response.text}"
                )
            
            result = response.json()
            
            return TTSResponse(
                session_id=request.session_id,
                audio_base64=base64.b64encode(result["audio_data"]).decode("utf-8"),
                format=result.get("format", "wav"),
                duration_ms=result.get("duration_ms"),
            )
            
    except httpx.RequestError as e:
        logger.error("TTS request failed", error=str(e))
        raise HTTPException(status_code=502, detail="TTS service unreachable")


@router.post("/stream")
async def text_to_speech_stream(request: TTSRequest):
    """Stream TTS audio."""
    
    # Get TTS service
    tts_service = service_registry.get_healthy_service("tts")
    if not tts_service:
        raise HTTPException(status_code=503, detail="TTS service unavailable")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{tts_service.url}/synthesize",
                json={
                    "session_id": request.session_id,
                    "text": request.text,
                    "voice_id": request.voice_id,
                    "speed": request.speed,
                    "format": request.format,
                },
                timeout=30.0,
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"TTS service error: {response.text}"
                )
            
            result = response.json()
            
            return Response(
                content=result["audio_data"],
                media_type=f"audio/{request.format}",
                headers={
                    "Content-Disposition": f"attachment; filename=tts.{request.format}",
                    "X-Duration-Ms": str(result.get("duration_ms", "")),
                },
            )
            
    except httpx.RequestError as e:
        logger.error("TTS request failed", error=str(e))
        raise HTTPException(status_code=502, detail="TTS service unreachable")


@router.get("/voices")
async def list_voices():
    """List available TTS voices."""
    
    # Get TTS service
    tts_service = service_registry.get_healthy_service("tts")
    if not tts_service:
        raise HTTPException(status_code=503, detail="TTS service unavailable")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{tts_service.url}/voices",
                timeout=10.0,
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(status_code=502, detail="Failed to fetch voices")
                
    except httpx.RequestError as e:
        logger.error("Failed to fetch voices", error=str(e))
        raise HTTPException(status_code=502, detail="TTS service unreachable")
