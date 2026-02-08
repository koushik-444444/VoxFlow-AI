"""Text generation endpoints."""
from typing import List, Dict, Any, Optional
import json
import time

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import structlog

from app.models.llm_engine import llm_engine
from app.config import settings

logger = structlog.get_logger()
router = APIRouter()


class GenerateRequest(BaseModel):
    """Generation request."""
    session_id: str
    messages: List[Dict[str, str]]
    stream: bool = True
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None


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
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


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
        raise HTTPException(status_code=500, detail=f"Completion failed: {str(e)}")


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
