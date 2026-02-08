"""Chat API endpoints."""
from typing import AsyncGenerator, Optional
import json

from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx
import structlog

from app.services.session_manager import session_manager
from app.services.service_registry import service_registry
from app.config import settings

logger = structlog.get_logger()
router = APIRouter()


class ChatRequest(BaseModel):
    """Chat request model."""
    session_id: str
    message: str
    model: Optional[str] = "default"
    stream: bool = True
    temperature: float = 0.7
    max_tokens: Optional[int] = None


class ChatResponse(BaseModel):
    """Chat response model."""
    session_id: str
    response: str
    latency_ms: float
    tokens_used: Optional[int] = None


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Send a chat message and get response."""
    
    # Validate session
    session = await session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Add user message
    await session_manager.add_message(
        request.session_id,
        "user",
        request.message,
    )
    
    # Get conversation context
    context = await session_manager.get_conversation_context(request.session_id)
    
    # Get LLM service
    llm_service = service_registry.get_healthy_service("llm")
    if not llm_service:
        raise HTTPException(status_code=503, detail="LLM service unavailable")
    
    # Call LLM service
    import time
    start_time = time.time()
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{llm_service.url}/generate",
                json={
                    "session_id": request.session_id,
                    "messages": context,
                    "stream": False,
                    "temperature": request.temperature,
                    "max_tokens": request.max_tokens,
                },
                timeout=60.0,
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"LLM service error: {response.text}"
                )
            
            result = response.json()
            latency_ms = (time.time() - start_time) * 1000
            
            # Add assistant response to session
            await session_manager.add_message(
                request.session_id,
                "assistant",
                result["text"],
            )
            
            return ChatResponse(
                session_id=request.session_id,
                response=result["text"],
                latency_ms=latency_ms,
                tokens_used=result.get("tokens_used"),
            )
            
    except httpx.RequestError as e:
        logger.error("LLM request failed", error=str(e))
        raise HTTPException(status_code=502, detail="LLM service unreachable")


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """Stream chat response token by token."""
    
    # Validate session
    session = await session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Add user message
    await session_manager.add_message(
        request.session_id,
        "user",
        request.message,
    )
    
    # Get conversation context
    context = await session_manager.get_conversation_context(request.session_id)
    
    # Get LLM service
    llm_service = service_registry.get_healthy_service("llm")
    if not llm_service:
        raise HTTPException(status_code=503, detail="LLM service unavailable")
    
    async def generate_stream() -> AsyncGenerator[str, None]:
        """Generate SSE stream."""
        full_response = ""
        
        try:
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    f"{llm_service.url}/generate",
                    json={
                        "session_id": request.session_id,
                        "messages": context,
                        "stream": True,
                        "temperature": request.temperature,
                        "max_tokens": request.max_tokens,
                    },
                    timeout=60.0,
                ) as response:
                    
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data = json.loads(line[6:])
                            
                            if data.get("chunk"):
                                chunk = data["chunk"]
                                full_response += chunk
                                yield f"data: {json.dumps({'chunk': chunk, 'done': False})}\n\n"
                            
                            if data.get("done"):
                                yield f"data: {json.dumps({'chunk': '', 'done': True, 'full_response': full_response})}\n\n"
                                break
            
            # Save to session
            await session_manager.add_message(
                request.session_id,
                "assistant",
                full_response,
            )
            
        except Exception as e:
            logger.error("Stream error", error=str(e))
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
