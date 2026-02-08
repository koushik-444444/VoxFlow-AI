"""Session management endpoints."""
from typing import Optional, Dict, Any

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import structlog

from app.services.session_manager import session_manager

logger = structlog.get_logger()
router = APIRouter()


class CreateSessionRequest(BaseModel):
    """Create session request."""
    user_id: Optional[str] = None
    config: Optional[Dict[str, Any]] = None


class SessionResponse(BaseModel):
    """Session response."""
    id: str
    user_id: Optional[str]
    created_at: str
    last_activity: str
    message_count: int


class UpdateConfigRequest(BaseModel):
    """Update config request."""
    config: Dict[str, Any]


@router.post("/", response_model=SessionResponse)
async def create_session(request: CreateSessionRequest):
    """Create a new session."""
    session = await session_manager.create_session(
        user_id=request.user_id,
        config=request.config,
    )
    
    return SessionResponse(
        id=session["id"],
        user_id=session.get("user_id"),
        created_at=session["created_at"],
        last_activity=session["last_activity"],
        message_count=len(session["memory"]["messages"]),
    )


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    """Get session details."""
    session = await session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return SessionResponse(
        id=session["id"],
        user_id=session.get("user_id"),
        created_at=session["created_at"],
        last_activity=session["last_activity"],
        message_count=len(session["memory"]["messages"]),
    )


@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """Delete a session."""
    result = await session_manager.delete_session(session_id)
    if not result:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"status": "deleted", "session_id": session_id}


@router.get("/{session_id}/history")
async def get_conversation_history(session_id: str, limit: int = 50):
    """Get conversation history."""
    session = await session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = session["memory"]["messages"]
    if limit:
        messages = messages[-limit:]
    
    return {
        "session_id": session_id,
        "messages": messages,
        "total": len(session["memory"]["messages"]),
    }


@router.post("/{session_id}/clear")
async def clear_conversation(session_id: str):
    """Clear conversation history."""
    result = await session_manager.clear_memory(session_id)
    if not result:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"status": "cleared", "session_id": session_id}


@router.put("/{session_id}/config")
async def update_config(session_id: str, request: UpdateConfigRequest):
    """Update session configuration."""
    result = await session_manager.update_config(session_id, request.config)
    if not result:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"status": "updated", "session_id": session_id}


@router.post("/{session_id}/export")
async def export_conversation(session_id: str):
    """Export conversation as JSON."""
    session = await session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session_id,
        "exported_at": datetime.utcnow().isoformat(),
        "session": session,
    }


from datetime import datetime
