"""Edge-TTS engine for text-to-speech."""
import time
from typing import Optional, Dict, Any, List
import structlog

logger = structlog.get_logger()


class TTSEngine:
    """Edge-TTS engine."""
    
    def __init__(self):
        self.is_initialized = False
        self.sample_rate = 24000
        self._voices = []
    
    async def initialize(self):
        """Initialize the TTS engine."""
        import edge_tts
        
        logger.info("Initializing Edge-TTS")
        
        # List available voices
        all_voices = await edge_tts.VoicesManager.create()
        self._voices = [
            {"id": v["ShortName"], "name": v["FriendlyName"], "language": v["Locale"]}
            for v in all_voices.voices
        ]
        
        self.is_initialized = True
        logger.info("Edge-TTS initialized", voice_count=len(self._voices))
    
    async def shutdown(self):
        """Shutdown the engine."""
        self.is_initialized = False
        logger.info("TTS engine shutdown")
    
    async def synthesize(
        self,
        text: str,
        voice_id: Optional[str] = "default",
        speed: float = 1.0,
    ) -> Dict[str, Any]:
        """Synthesize text to speech using Edge-TTS."""
        import edge_tts
        from app.config import settings
        
        if not self.is_initialized:
            raise RuntimeError("Engine not initialized")
        
        start_time = time.time()
        
        voice = voice_id if voice_id and voice_id != "default" else settings.EDGE_TTS_VOICE
        
        # Edge-TTS expects speed in a specific format like "+0%"
        speed_pct = int((speed - 1.0) * 100)
        speed_str = f"{'+' if speed_pct >= 0 else ''}{speed_pct}%"
        
        communicate = edge_tts.Communicate(text, voice, rate=speed_str)
        
        audio_data = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
        
        latency_ms = (time.time() - start_time) * 1000
        duration_ms = (len(audio_data) / (self.sample_rate * 2)) * 1000  # Rough estimate
        
        return {
            "audio_data": audio_data,
            "format": "wav",
            "sample_rate": self.sample_rate,
            "duration_ms": round(duration_ms, 2),
            "latency_ms": round(latency_ms, 2),
        }
    
    def get_voices(self) -> List[Dict[str, Any]]:
        """Get available voices."""
        return self._voices
    
    def get_info(self) -> Dict[str, Any]:
        """Get engine information."""
        return {
            "initialized": self.is_initialized,
            "provider": "edge-tts",
            "voice_count": len(self._voices),
        }


# Global engine instance
tts_engine = TTSEngine()
