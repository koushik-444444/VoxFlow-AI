"""Voice management endpoints."""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import structlog

from app.models.tts_engine import tts_engine

logger = structlog.get_logger()
router = APIRouter()


class Voice(BaseModel):
    """Voice model."""
    id: str
    name: str
    language: str
    gender: str = "unknown"
    description: str = ""


class VoicesResponse(BaseModel):
    """Voices response."""
    voices: List[Voice]
    count: int


@router.get("/", response_model=VoicesResponse)
async def list_voices():
    """List available voices."""
    voices_data = tts_engine.get_voices()
    
    voices = [
        Voice(
            id=v["id"],
            name=v["name"],
            language=v.get("language", "en"),
            gender=v.get("gender", "unknown"),
            description=v.get("description", ""),
        )
        for v in voices_data
    ]
    
    return VoicesResponse(
        voices=voices,
        count=len(voices),
    )


@router.get("/{voice_id}")
async def get_voice(voice_id: str):
    """Get voice details."""
    voices = tts_engine.get_voices()
    
    voice = next((v for v in voices if v["id"] == voice_id), None)
    if not voice:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Voice not found")
    
    return Voice(
        id=voice["id"],
        name=voice["name"],
        language=voice.get("language", "en"),
        gender=voice.get("gender", "unknown"),
        description=voice.get("description", ""),
    )
