"""Redis client for session management."""
import json
from typing import Optional, Dict, Any
import redis.asyncio as redis
import structlog

from app.config import settings

logger = structlog.get_logger()


class RedisClient:
    """Async Redis client wrapper."""
    
    def __init__(self):
        self._client: Optional[redis.Redis] = None
        self._url = settings.REDIS_URL
    
    async def connect(self) -> None:
        """Establish Redis connection."""
        try:
            self._client = redis.from_url(
                self._url,
                encoding="utf-8",
                decode_responses=True,
                max_connections=settings.REDIS_POOL_SIZE,
            )
            # Test connection
            await self._client.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.error("Failed to connect to Redis", error=str(e))
            raise
    
    async def disconnect(self) -> None:
        """Close Redis connection."""
        if self._client:
            await self._client.close()
            logger.info("Redis connection closed")
    
    async def get(self, key: str) -> Optional[str]:
        """Get value by key."""
        if not self._client:
            raise RuntimeError("Redis not connected")
        return await self._client.get(key)
    
    async def set(
        self,
        key: str,
        value: str,
        ttl: Optional[int] = None
    ) -> None:
        """Set value with optional TTL."""
        if not self._client:
            raise RuntimeError("Redis not connected")
        await self._client.set(key, value, ex=ttl)
    
    async def delete(self, key: str) -> None:
        """Delete key."""
        if not self._client:
            raise RuntimeError("Redis not connected")
        await self._client.delete(key)
    
    async def exists(self, key: str) -> bool:
        """Check if key exists."""
        if not self._client:
            raise RuntimeError("Redis not connected")
        return await self._client.exists(key) > 0
    
    async def expire(self, key: str, seconds: int) -> None:
        """Set expiration on key."""
        if not self._client:
            raise RuntimeError("Redis not connected")
        await self._client.expire(key, seconds)
    
    async def hget(self, key: str, field: str) -> Optional[str]:
        """Get hash field value."""
        if not self._client:
            raise RuntimeError("Redis not connected")
        return await self._client.hget(key, field)
    
    async def hset(self, key: str, field: str, value: str) -> None:
        """Set hash field value."""
        if not self._client:
            raise RuntimeError("Redis not connected")
        await self._client.hset(key, field, value)
    
    async def hgetall(self, key: str) -> Dict[str, str]:
        """Get all hash fields."""
        if not self._client:
            raise RuntimeError("Redis not connected")
        return await self._client.hgetall(key)
    
    async def publish(self, channel: str, message: str) -> None:
        """Publish message to channel."""
        if not self._client:
            raise RuntimeError("Redis not connected")
        await self._client.publish(channel, message)
    
    # Session-specific methods
    
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data."""
        key = f"session:{session_id}"
        data = await self.get(key)
        if data:
            return json.loads(data)
        return None
    
    async def set_session(
        self,
        session_id: str,
        data: Dict[str, Any],
        ttl: int = None
    ) -> None:
        """Set session data."""
        key = f"session:{session_id}"
        ttl = ttl or settings.SESSION_TTL
        await self.set(key, json.dumps(data), ttl)
    
    async def delete_session(self, session_id: str) -> None:
        """Delete session."""
        key = f"session:{session_id}"
        await self.delete(key)
    
    async def touch_session(self, session_id: str) -> None:
        """Update session TTL."""
        key = f"session:{session_id}"
        await self.expire(key, settings.SESSION_TTL)


# Global Redis client instance
redis_client = RedisClient()
