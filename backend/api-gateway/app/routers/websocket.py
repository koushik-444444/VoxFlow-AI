"""WebSocket endpoints for real-time communication."""
import asyncio
import base64
import json
from typing import Dict, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException
import httpx
import structlog

from app.config import settings
from app.services.session_manager import session_manager
from app.services.service_registry import service_registry

logger = structlog.get_logger()
router = APIRouter()


class ConnectionManager:
    """Manage WebSocket connections."""
    
    def __init__(self):
        self._connections: Dict[str, WebSocket] = {}
    
    async def connect(self, session_id: str, websocket: WebSocket):
        """Accept and store connection."""
        await websocket.accept()
        self._connections[session_id] = websocket
        logger.info("WebSocket connected", session_id=session_id)
    
    def disconnect(self, session_id: str):
        """Remove connection."""
        if session_id in self._connections:
            del self._connections[session_id]
            logger.info("WebSocket disconnected", session_id=session_id)
    
    async def send_message(self, session_id: str, message: dict):
        """Send message to specific session."""
        if session_id in self._connections:
            await self._connections[session_id].send_json(message)
    
    async def broadcast(self, message: dict):
        """Broadcast to all connections."""
        for session_id, ws in self._connections.items():
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.error(
                    "Failed to broadcast",
                    session_id=session_id,
                    error=str(e),
                )


manager = ConnectionManager()


@router.websocket("/audio-stream")
async def audio_stream_websocket(
    websocket: WebSocket,
    session_id: str = Query(...),
    token: Optional[str] = Query(None),
):
    """WebSocket endpoint for real-time audio streaming."""
    
    # Validate session
    session = await session_manager.get_session(session_id)
    if not session:
        await websocket.close(code=4001, reason="Invalid session")
        return
    
    await manager.connect(session_id, websocket)
    
    # Get STT service
    stt_service = service_registry.get_healthy_service("stt")
    if not stt_service:
        await websocket.close(code=4002, reason="STT service unavailable")
        return
    
    # Audio buffer for the current session
    audio_buffer = bytearray()
    chunk_counter = 0
    
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            while True:
                # Receive message
                message = await websocket.receive()
                
                if message["type"] == "websocket.disconnect":
                    break
                
                if "bytes" in message:
                    # Append binary audio data to buffer
                    chunk = message["bytes"]
                    audio_buffer.extend(chunk)
                    if chunk_counter % 10 == 0:  # Log every 10 chunks to avoid spam
                        logger.debug("Received audio chunk", size=len(chunk), total_buffer=len(audio_buffer))
                    chunk_counter += 1
                
                elif "text" in message:
                    # JSON control message
                    data = json.loads(message["text"])
                    msg_type = data.get("type")
                    
                    if msg_type == "ping":
                        await websocket.send_json({"type": "pong"})
                    
                    elif msg_type == "start_recording":
                        logger.info("Starting new recording session, clearing buffer")
                        audio_buffer.clear()
                        chunk_counter = 0
                    
                    elif msg_type == "end_of_speech":
                        # Process the entire accumulated buffer
                        buffer_size = len(audio_buffer)
                        if buffer_size > 0:
                            logger.info("Processing end of speech", size=buffer_size)
                            try:
                                # Ensure we use the trailing slash for the STT service endpoint
                                response = await client.post(
                                    f"{stt_service.url}/transcribe/",
                                    files={"audio": ("speech.webm", bytes(audio_buffer), "audio/webm")},
                                    data={
                                        "session_id": session_id,
                                        "is_partial": False,
                                    },
                                    timeout=60.0,
                                )
                                
                                if response.status_code == 200:
                                    result = response.json()
                                    text = result.get("text", "").strip()
                                    logger.info("Transcription success", text=text)
                                    
                                    if text:
                                        await websocket.send_json({
                                            "type": "transcription",
                                            "text": text,
                                            "is_partial": False,
                                        })
                                        # Forward to LLM
                                        await process_complete_transcription(
                                            session_id, text, websocket
                                        )
                                    else:
                                        logger.warn("Transcription returned empty text")
                                        await websocket.send_json({
                                            "type": "error",
                                            "message": "Could not understand audio",
                                        })
                                else:
                                    logger.error("STT service error", status=response.status_code, body=response.text)
                                    await websocket.send_json({"type": "error", "message": f"STT error: {response.status_code}"})
                                
                            except Exception as e:
                                logger.error("STT processing error", error=str(e))
                                await websocket.send_json({"type": "error", "message": "Transcription failed"})
                            finally:
                                # ALWAYS clear buffer after an attempt to process end of speech
                                audio_buffer.clear()
                                chunk_counter = 0
                        else:
                            logger.warn("Received end_of_speech but audio buffer is empty")
                        
                    elif msg_type == "interrupt":
                        audio_buffer.clear()
                        await websocket.send_json({"type": "interrupted"})
    
    except WebSocketDisconnect:
        logger.info("Client disconnected", session_id=session_id)
    except Exception as e:
        logger.error("WebSocket error", session_id=session_id, error=str(e))
    finally:
        manager.disconnect(session_id)


async def process_complete_transcription(
    session_id: str,
    text: str,
    websocket: WebSocket,
):
    """Process complete transcription through LLM and TTS."""
    
    # Add user message to session
    await session_manager.add_message(session_id, "user", text)
    
    # Get conversation context
    context = await session_manager.get_conversation_context(session_id)
    
    # Get LLM service
    llm_service = service_registry.get_healthy_service("llm")
    if not llm_service:
        await websocket.send_json({
            "type": "error",
            "message": "LLM service unavailable",
        })
        return
    
    # Stream LLM response
    full_response = ""
    
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            async with client.stream(
                "POST",
                f"{llm_service.url}/generate/",
                json={
                    "session_id": session_id,
                    "messages": context,
                    "stream": True,
                },
                timeout=60.0,
            ) as response:
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = json.loads(line[6:])
                        
                        if data.get("chunk"):
                            chunk = data["chunk"]
                            full_response += chunk
                            
                            # Stream to client
                            await websocket.send_json({
                                "type": "llm_chunk",
                                "content": chunk,
                                "is_final": False,
                            })
                        
                        if data.get("done"):
                            break
        
        # Send final message
        await websocket.send_json({
            "type": "llm_chunk",
            "content": "",
            "is_final": True,
            "full_response": full_response,
        })
        
        # Add assistant message to session
        await session_manager.add_message(session_id, "assistant", full_response)
        
        # Generate TTS
        await generate_tts(session_id, full_response, websocket)
        
    except Exception as e:
        logger.error("LLM processing error", error=str(e))
        await websocket.send_json({
            "type": "error",
            "message": "LLM processing failed",
        })


async def generate_tts(
    session_id: str,
    text: str,
    websocket: WebSocket,
):
    """Generate TTS and send to client."""
    
    tts_service = service_registry.get_healthy_service("tts")
    if not tts_service:
        await websocket.send_json({
            "type": "error",
            "message": "TTS service unavailable",
        })
        return
    
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.post(
                f"{tts_service.url}/synthesize/",
                json={
                    "session_id": session_id,
                    "text": text,
                    "voice_id": "default",
                },
                timeout=30.0,
            )
            
            if response.status_code == 200:
                # Encode audio as base64 for WebSocket transmission
                audio_base64 = base64.b64encode(response.content).decode("utf-8")
                
                await websocket.send_json({
                    "type": "tts_audio",
                    "audio": audio_base64,
                    "format": "wav",
                })
            else:
                await websocket.send_json({
                    "type": "error",
                    "message": "TTS generation failed",
                })
                
    except Exception as e:
        logger.error("TTS processing error", error=str(e))
        await websocket.send_json({
            "type": "error",
            "message": "TTS processing failed",
        })


async def handle_interrupt(session_id: str):
    """Handle user interrupt (barge-in)."""
    logger.info("Handling interrupt", session_id=session_id)
    # Cancel any ongoing TTS/LLM operations
    # This would integrate with a task cancellation system
