"""Configuration for STT Service."""
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """STT Service settings."""
    
    # Application
    APP_NAME: str = "STT Service"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    
    # Server
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8001, env="PORT")
    
    # STT Provider
    STT_PROVIDER: str = Field(default="whisper", env="STT_PROVIDER")
    # Options: whisper, groq
    
    # Whisper Model
    WHISPER_MODEL: str = Field(default="base", env="WHISPER_MODEL")
    # Options: tiny, base, small, medium, large, large-v2, large-v3
    
    # Groq Configuration
    GROQ_API_KEY: str = Field(default="", env="GROQ_API_KEY")
    GROQ_MODEL: str = Field(default="whisper-large-v3", env="GROQ_MODEL")
    
    DEVICE: str = Field(default="auto", env="DEVICE")
    # auto, cpu, cuda
    
    COMPUTE_TYPE: str = Field(default="float16", env="COMPUTE_TYPE")
    # float16, int8, float32
    
    # Audio Processing
    SAMPLE_RATE: int = Field(default=16000, env="SAMPLE_RATE")
    CHUNK_DURATION_MS: int = Field(default=1000, env="CHUNK_DURATION_MS")
    
    # Language
    LANGUAGE: str = Field(default="en", env="LANGUAGE")
    AUTO_DETECT_LANGUAGE: bool = Field(default=True, env="AUTO_DETECT_LANGUAGE")
    
    # Performance
    BATCH_SIZE: int = Field(default=1, env="BATCH_SIZE")
    BEAM_SIZE: int = Field(default=5, env="BEAM_SIZE")
    BEST_OF: int = Field(default=5, env="BEST_OF")
    
    # VAD (Voice Activity Detection)
    USE_VAD: bool = Field(default=True, env="USE_VAD")
    VAD_THRESHOLD: float = Field(default=0.5, env="VAD_THRESHOLD")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
