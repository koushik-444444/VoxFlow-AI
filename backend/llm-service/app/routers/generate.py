"""Text generation endpoints."""
from typing import List, Dict, Any, Optional
import json
import time

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator
import structlog

from app.models.llm_engine import llm_engine
from app.config import settings

logger = structlog.get_logger()
router = APIRouter()

# Validation limits
MAX_MESSAGES = 50
MAX_MESSAGE_CONTENT_LENGTH = 10000


class GenerateRequest(BaseModel):
    """Generation request."""
    session_id: str
    messages: List[Dict[str, str]]
    stream: bool = True
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None

    @field_validator('messages')
    @classmethod
    def validate_messages(cls, v: List[Dict[str, str]]) -> List[Dict[str, str]]:
        if not v:
            raise ValueError("Messages list must not be empty")
        if len(v) > MAX_MESSAGES:
            raise ValueError(f"Too many messages (max {MAX_MESSAGES})")
        for i, msg in enumerate(v):
            if 'role' not in msg or 'content' not in msg:
                raise ValueError(f"Message {i} must have 'role' and 'content' fields")
            if msg['role'] not in ('system', 'user', 'assistant'):
                raise ValueError(f"Message {i} has invalid role '{msg['role']}'")
            if len(msg['content']) > MAX_MESSAGE_CONTENT_LENGTH:
                raise ValueError(
                    f"Message {i} content exceeds max length of {MAX_MESSAGE_CONTENT_LENGTH} characters"
                )
        return v

    @field_validator('temperature')
    @classmethod
    def validate_temperature(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (v < 0.0 or v > 2.0):
            raise ValueError("Temperature must be between 0.0 and 2.0")
        return v

    @field_validator('max_tokens')
    @classmethod
    def validate_max_tokens(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 1 or v > 8192):
            raise ValueError("max_tokens must be between 1 and 8192")
        return v


class GenerateResponse(BaseModel):
    """Generation response."""
    text: str
    latency_ms: float
    tokens_used: Optional[int] = None


@router.post("/")
async def generate(request: GenerateRequest):
    """Generate text response."""
    
    start_time = time.time()
    
    try:
        if request.stream:
            # Return streaming response
            async def stream_generator():
                full_text = ""
                
                async for chunk in llm_engine.generate_stream(
                    messages=request.messages,
                    temperature=request.temperature,
                    max_tokens=request.max_tokens,
                ):
                    full_text += chunk
                    yield f"data: {json.dumps({'chunk': chunk, 'done': False})}\n\n"
                
                yield f"data: {json.dumps({'chunk': '', 'done': True, 'full_response': full_text})}\n\n"
            
            return StreamingResponse(
                stream_generator(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                },
            )
        else:
            # Return complete response
            result = await llm_engine.generate(
                messages=request.messages,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
            )
            
            latency_ms = (time.time() - start_time) * 1000
            
            return GenerateResponse(
                text=result["text"],
                latency_ms=round(latency_ms, 2),
                tokens_used=result.get("tokens_used"),
            )
            
    except Exception as e:
        logger.error("Generation failed", error=str(e), session_id=request.session_id)
        raise HTTPException(status_code=500, detail="Generation failed. Please try again.")


@router.post("/chat")
async def chat_completion(request: GenerateRequest):
    """OpenAI-compatible chat completion endpoint."""
    
    try:
        result = await llm_engine.generate(
            messages=request.messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )
        
        return {
            "id": f"chatcmpl-{request.session_id}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": settings.OPENAI_MODEL if settings.LLM_PROVIDER == "openai" else settings.LLM_PROVIDER,
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": result["text"],
                    },
                    "finish_reason": "stop",
                }
            ],
            "usage": {
                "prompt_tokens": None,
                "completion_tokens": None,
                "total_tokens": result.get("tokens_used"),
            },
        }
        
    except Exception as e:
        logger.error("Chat completion failed", error=str(e))
        raise HTTPException(status_code=500, detail="Completion failed. Please try again.")


@router.get("/models")
async def list_models():
    """List available models."""
    return {
        "models": [
            {
                "id": settings.OPENAI_MODEL if settings.LLM_PROVIDER == "openai" else settings.LLM_PROVIDER,
                "object": "model",
                "created": int(time.time()),
                "owned_by": settings.LLM_PROVIDER,
            }
        ],
        "current_provider": settings.LLM_PROVIDER,
    }
