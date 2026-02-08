"""Session management service."""
from typing import Optional, Dict, Any
from datetime import datetime
import json
import structlog

from app.services.redis_client import redis_client
from app.config import settings

logger = structlog.get_logger()


class SessionManager:
    """Manage user sessions and conversation memory."""
    
    async def create_session(
        self,
        user_id: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a new session."""
        import uuid
        
        session_id = str(uuid.uuid4())
        session_data = {
            "id": session_id,
            "user_id": user_id,
            "created_at": datetime.utcnow().isoformat(),
            "last_activity": datetime.utcnow().isoformat(),
            "memory": {
                "messages": [],
                "summary": None,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            },
            "config": config or {},
            "metadata": {},
        }
        
        await redis_client.set_session(session_id, session_data)
        
        logger.info(
            "Session created",
            session_id=session_id,
            user_id=user_id,
        )
        
        return session_data
    
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by ID."""
        session = await redis_client.get_session(session_id)
        if session:
            # Update last activity
            session["last_activity"] = datetime.utcnow().isoformat()
            await redis_client.set_session(session_id, session)
        return session
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete a session."""
        await redis_client.delete_session(session_id)
        logger.info("Session deleted", session_id=session_id)
        return True
    
    async def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Add a message to session memory."""
        session = await self.get_session(session_id)
        if not session:
            return False
        
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {},
        }
        
        session["memory"]["messages"].append(message)
        session["memory"]["updated_at"] = datetime.utcnow().isoformat()
        
        await redis_client.set_session(session_id, session)
        return True
    
    async def get_conversation_context(
        self,
        session_id: str,
        max_messages: int = 10
    ) -> list:
        """Get recent conversation context."""
        session = await self.get_session(session_id)
        if not session:
            return []
        
        messages = session["memory"]["messages"]
        recent = messages[-max_messages:] if len(messages) > max_messages else messages
        
        return [{"role": m["role"], "content": m["content"]} for m in recent]
    
    async def clear_memory(self, session_id: str) -> bool:
        """Clear conversation memory."""
        session = await self.get_session(session_id)
        if not session:
            return False
        
        session["memory"]["messages"] = []
        session["memory"]["summary"] = None
        session["memory"]["updated_at"] = datetime.utcnow().isoformat()
        
        await redis_client.set_session(session_id, session)
        return True
    
    async def update_config(
        self,
        session_id: str,
        config: Dict[str, Any]
    ) -> bool:
        """Update session configuration."""
        session = await self.get_session(session_id)
        if not session:
            return False
        
        session["config"].update(config)
        await redis_client.set_session(session_id, session)
        return True


# Global session manager instance
session_manager = SessionManager()
