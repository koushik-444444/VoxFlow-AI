"""Configuration for LLM Service."""
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """LLM Service settings."""
    
    # Application
    APP_NAME: str = "LLM Service"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    
    # Server
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8002, env="PORT")
    
    # LLM Provider
    LLM_PROVIDER: str = Field(default="ollama", env="LLM_PROVIDER")
    # Options: ollama, openai, anthropic, huggingface, local, groq
    
    # Ollama Configuration (free, local LLM)
    OLLAMA_BASE_URL: str = Field(default="http://ollama:11434", env="OLLAMA_BASE_URL")
    OLLAMA_MODEL: str = Field(default="llama3.2:3b", env="OLLAMA_MODEL")
    # Popular models: llama3.2:3b (fast), llama3.2:1b (fastest), mistral (good quality)
    
    # API Keys
    OPENAI_API_KEY: str = Field(default="", env="OPENAI_API_KEY")
    ANTHROPIC_API_KEY: str = Field(default="", env="ANTHROPIC_API_KEY")
    HUGGINGFACE_API_TOKEN: str = Field(default="", env="HUGGINGFACE_API_TOKEN")
    GROQ_API_KEY: str = Field(default="", env="GROQ_API_KEY")
    
    # Model Configuration
    OPENAI_MODEL: str = Field(default="gpt-3.5-turbo", env="OPENAI_MODEL")
    ANTHROPIC_MODEL: str = Field(default="claude-instant-1", env="ANTHROPIC_MODEL")
    HUGGINGFACE_MODEL: str = Field(default="microsoft/DialoGPT-medium", env="HUGGINGFACE_MODEL")
    GROQ_MODEL: str = Field(default="llama-3.1-8b-instant", env="GROQ_MODEL")
    LOCAL_MODEL_PATH: str = Field(default="", env="LOCAL_MODEL_PATH")
    
    # Generation Parameters
    DEFAULT_TEMPERATURE: float = Field(default=0.7, env="DEFAULT_TEMPERATURE")
    DEFAULT_MAX_TOKENS: int = Field(default=1024, env="DEFAULT_MAX_TOKENS")
    DEFAULT_TOP_P: float = Field(default=1.0, env="DEFAULT_TOP_P")
    DEFAULT_FREQUENCY_PENALTY: float = Field(default=0.0, env="DEFAULT_FREQUENCY_PENALTY")
    DEFAULT_PRESENCE_PENALTY: float = Field(default=0.0, env="DEFAULT_PRESENCE_PENALTY")
    
    # System Prompt
    SYSTEM_PROMPT: str = Field(
        default="You are a helpful AI assistant. Respond concisely and naturally.",
        env="SYSTEM_PROMPT"
    )
    
    # Performance
    STREAM_CHUNK_SIZE: int = Field(default=10, env="STREAM_CHUNK_SIZE")
    REQUEST_TIMEOUT: int = Field(default=60, env="REQUEST_TIMEOUT")
    
    # Context
    MAX_CONTEXT_MESSAGES: int = Field(default=10, env="MAX_CONTEXT_MESSAGES")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
