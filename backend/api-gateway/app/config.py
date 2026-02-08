"""Configuration settings for API Gateway."""
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings."""
    
    # Application
    APP_NAME: str = "Speech-to-Speech AI API Gateway"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=False, env="DEBUG")
    
    # Server
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")
    
    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"],
        env="CORS_ORIGINS"
    )
    
    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    REDIS_POOL_SIZE: int = Field(default=10, env="REDIS_POOL_SIZE")
    SESSION_TTL: int = Field(default=3600, env="SESSION_TTL")  # 1 hour
    
    # Service URLs
    STT_SERVICE_URL: str = Field(default="http://localhost:8001", env="STT_SERVICE_URL")
    LLM_SERVICE_URL: str = Field(default="http://localhost:8002", env="LLM_SERVICE_URL")
    TTS_SERVICE_URL: str = Field(default="http://localhost:8003", env="TTS_SERVICE_URL")
    
    # Authentication
    JWT_SECRET: str = Field(default="your-secret-key-change-in-production", env="JWT_SECRET")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    JWT_EXPIRATION_HOURS: int = Field(default=24, env="JWT_EXPIRATION_HOURS")
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    RATE_LIMIT_WINDOW: int = Field(default=60, env="RATE_LIMIT_WINDOW")  # seconds
    
    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = Field(default=30, env="WS_HEARTBEAT_INTERVAL")
    WS_MAX_MESSAGE_SIZE: int = Field(default=10 * 1024 * 1024, env="WS_MAX_MESSAGE_SIZE")  # 10MB
    
    # Audio
    MAX_AUDIO_SIZE_MB: int = Field(default=50, env="MAX_AUDIO_SIZE_MB")
    SUPPORTED_AUDIO_FORMATS: List[str] = Field(
        default=["wav", "mp3", "ogg", "webm", "pcm"],
        env="SUPPORTED_AUDIO_FORMATS"
    )
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FORMAT: str = Field(default="json", env="LOG_FORMAT")
    
    # Performance
    REQUEST_TIMEOUT: int = Field(default=30, env="REQUEST_TIMEOUT")
    STREAM_CHUNK_SIZE: int = Field(default=1024, env="STREAM_CHUNK_SIZE")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
