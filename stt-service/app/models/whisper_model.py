"""Groq STT engine for speech-to-text."""
import time
from typing import Optional, Dict, Any
import structlog

logger = structlog.get_logger()


class WhisperEngine:
    """Groq STT engine."""
    
    def __init__(self):
        self.is_loaded = False
        self._load_time_ms = 0
    
    async def load_model(self, model_name: str = "base", device: str = "auto"):
        """Initialize STT engine."""
        from app.config import settings
        
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY not set for groq provider")
        
        self.is_loaded = True
        logger.info("STT provider set to Groq", model=settings.GROQ_MODEL)
    
    async def unload_model(self):
        """Unload engine."""
        self.is_loaded = False
        logger.info("STT engine unloaded")
    
    async def transcribe(
        self,
        audio_data: bytes,
        language: Optional[str] = None,
        task: str = "transcribe",
        **kwargs
    ) -> Dict[str, Any]:
        """Transcribe audio to text using Groq Cloud API."""
        import httpx
        from app.config import settings
        
        if not self.is_loaded:
            raise RuntimeError("Engine not loaded")
        
        start_time = time.time()
        
        url = "https://api.groq.com/openai/v1/audio/transcriptions"
        headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}"}
        
        # Groq expects a file-like object
        files = {
            "file": ("audio.wav", audio_data, "audio/wav"),
            "model": (None, settings.GROQ_MODEL),
        }
        
        if language:
            files["language"] = (None, language)
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, files=files, timeout=30.0)
            
        if response.status_code != 200:
            logger.error("Groq STT failed", status=response.status_code, error=response.text)
            raise RuntimeError(f"Groq STT failed: {response.text}")
            
        result = response.json()
        total_time = (time.time() - start_time) * 1000
        
        return {
            "text": result["text"].strip(),
            "language": language,
            "confidence": 1.0,
            "timing": {
                "total_ms": round(total_time, 2),
                "groq_ms": round(total_time, 2),
            }
        }
    
    async def transcribe_streaming(
        self,
        audio_chunks: bytes,
        partial: bool = True,
        language: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Transcribe streaming audio (falls back to regular transcription for Groq)."""
        # Groq doesn't support true streaming STT yet via this endpoint, 
        # but we can simulate it by sending chunks.
        return await self.transcribe(audio_chunks, language=language)

    def get_model_info(self) -> Dict[str, Any]:
        """Get engine information."""
        from app.config import settings
        return {
            "loaded": self.is_loaded,
            "provider": "groq",
            "model": settings.GROQ_MODEL,
        }


# Global engine instance
whisper_engine = WhisperEngine()
