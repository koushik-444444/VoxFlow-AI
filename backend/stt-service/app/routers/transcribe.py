"""Transcription endpoints."""
from typing import Optional
import time

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
import structlog

from app.models.whisper_model import whisper_engine
from app.config import settings

logger = structlog.get_logger()
router = APIRouter()


class TranscriptionResponse(BaseModel):
    """Transcription response."""
    text: str
    is_partial: bool = False
    confidence: Optional[float] = None
    language: Optional[str] = None
    latency_ms: float


@router.post("/", response_model=TranscriptionResponse)
async def transcribe_audio(
    audio: UploadFile = File(...),
    session_id: str = Form(...),
    chunk_id: Optional[int] = Form(None),
    language: Optional[str] = Form(None),
    is_partial: bool = Form(True),
):
    """Transcribe audio file to text."""
    
    start_time = time.time()
    
    # Validate file type
    content_type = audio.content_type
    if content_type and not content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Expected audio.")
    
    try:
        # Read audio data
        audio_data = await audio.read()
        
        if len(audio_data) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file")
        
        # Check file size (max 50MB)
        if len(audio_data) > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Audio file too large (max 50MB)")
        
        # Transcribe
        result = await whisper_engine.transcribe_streaming(
            audio_data,
            partial=is_partial,
            language=language or (None if settings.AUTO_DETECT_LANGUAGE else settings.LANGUAGE),
        )
        
        latency_ms = (time.time() - start_time) * 1000
        
        logger.info(
            "Transcription completed",
            session_id=session_id,
            chunk_id=chunk_id,
            latency_ms=round(latency_ms, 2),
            text_length=len(result["text"]),
        )
        
        return TranscriptionResponse(
            text=result["text"],
            is_partial=is_partial,
            confidence=result.get("confidence"),
            language=result.get("language"),
            latency_ms=round(latency_ms, 2),
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Transcription failed", error=str(e), session_id=session_id)
        raise HTTPException(status_code=500, detail="Transcription failed. Please try again.")


@router.post("/file", response_model=TranscriptionResponse)
async def transcribe_file(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None),
):
    """Transcribe complete audio file (non-streaming)."""
    
    start_time = time.time()
    
    try:
        audio_data = await audio.read()
        
        result = await whisper_engine.transcribe(
            audio_data,
            language=language,
        )
        
        latency_ms = (time.time() - start_time) * 1000
        
        return TranscriptionResponse(
            text=result["text"],
            is_partial=False,
            confidence=result.get("confidence"),
            language=result.get("language"),
            latency_ms=round(latency_ms, 2),
        )
        
    except Exception as e:
        logger.error("File transcription failed", error=str(e))
        raise HTTPException(status_code=500, detail="Transcription failed. Please try again.")


@router.get("/languages")
async def list_languages():
    """List supported languages."""
    # Whisper supports many languages
    return {
        "languages": [
            "en", "zh", "de", "es", "ru", "ko", "fr", "ja", "pt", "tr",
            "pl", "ca", "nl", "ar", "sv", "it", "id", "hi", "fi", "vi",
            "he", "uk", "el", "ms", "cs", "ro", "da", "hu", "ta", "no",
            "th", "ur", "hr", "bg", "lt", "la", "mi", "ml", "cy", "sk",
            "te", "fa", "lv", "bn", "sr", "az", "sl", "kn", "et", "mk",
            "br", "eu", "is", "hy", "ne", "mn", "bs", "kk", "sq", "sw",
            "gl", "mr", "pa", "si", "km", "sn", "yo", "so", "af", "oc",
            "ka", "be", "tg", "sd", "gu", "am", "yi", "lo", "uz", "fo",
            "ht", "ps", "tk", "nn", "mt", "sa", "lb", "my", "bo", "tl",
            "mg", "as", "tt", "haw", "ln", "ha", "ba", "jw", "su",
        ],
        "auto_detect": settings.AUTO_DETECT_LANGUAGE,
    }
