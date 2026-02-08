"""Configuration for TTS Service."""
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """TTS Service settings."""
    
    # Application
    APP_NAME: str = "TTS Service"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    
    # Server
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8003, env="PORT")
    
    # TTS Model
    TTS_MODEL: str = Field(default="tts_models/en/ljspeech/tacotron2-DDC", env="TTS_MODEL")
    # Coqui TTS model name or "microsoft/speecht5_tts" for HuggingFace
    
    VOCODER_MODEL: str = Field(default="vocoder_models/en/ljspeech/hifigan_v2", env="VOCODER_MODEL")
    
    PROVIDER: str = Field(default="coqui", env="PROVIDER")
    # Options: coqui, huggingface, pyttsx3, edge-tts
    
    # Edge-TTS Configuration
    EDGE_TTS_VOICE: str = Field(default="en-US-AndrewNeural", env="EDGE_TTS_VOICE")
    
    # Device
    DEVICE: str = Field(default="auto", env="DEVICE")
    # auto, cpu, cuda
    
    # Audio Output
    SAMPLE_RATE: int = Field(default=22050, env="SAMPLE_RATE")
    OUTPUT_FORMAT: str = Field(default="wav", env="OUTPUT_FORMAT")
    # wav, mp3, ogg
    
    # Performance
    USE_GPU: bool = Field(default=True, env="USE_GPU")
    
    # Voice Cloning (for Coqui)
    SPEAKER_WAV: str = Field(default="", env="SPEAKER_WAV")
    LANGUAGE_IDX: str = Field(default="", env="LANGUAGE_IDX")
    
    # Default Voice Settings
    DEFAULT_SPEED: float = Field(default=1.0, env="DEFAULT_SPEED")
    DEFAULT_PITCH: float = Field(default=1.0, env="DEFAULT_PITCH")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
