"""Rate limiting service."""
from typing import Dict, List
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import threading

import structlog

from app.config import settings

logger = structlog.get_logger()


@dataclass
class RateLimitEntry:
    """Rate limit tracking entry."""
    requests: List[datetime] = field(default_factory=list)
    
    def clean_old(self, window_seconds: int):
        """Remove old requests outside the window."""
        cutoff = datetime.utcnow() - timedelta(seconds=window_seconds)
        self.requests = [r for r in self.requests if r > cutoff]
    
    def count(self, window_seconds: int) -> int:
        """Count requests in the current window."""
        self.clean_old(window_seconds)
        return len(self.requests)
    
    def add(self):
        """Add a new request."""
        self.requests.append(datetime.utcnow())


class RateLimiter:
    """In-memory rate limiter."""
    
    def __init__(self):
        self._entries: Dict[str, RateLimitEntry] = {}
        self._lock = threading.Lock()
        self._max_requests = settings.RATE_LIMIT_REQUESTS
        self._window_seconds = settings.RATE_LIMIT_WINDOW
    
    def is_allowed(self, key: str) -> bool:
        """Check if request is allowed under rate limit."""
        with self._lock:
            entry = self._entries.get(key)
            if entry is None:
                entry = RateLimitEntry()
                self._entries[key] = entry
            
            count = entry.count(self._window_seconds)
            
            if count >= self._max_requests:
                logger.warning(
                    "Rate limit exceeded",
                    key=key,
                    count=count,
                    limit=self._max_requests,
                )
                return False
            
            entry.add()
            return True
    
    def get_remaining(self, key: str) -> int:
        """Get remaining requests in current window."""
        with self._lock:
            entry = self._entries.get(key)
            if entry is None:
                return self._max_requests
            
            count = entry.count(self._window_seconds)
            return max(0, self._max_requests - count)
    
    def reset(self, key: str):
        """Reset rate limit for a key."""
        with self._lock:
            if key in self._entries:
                del self._entries[key]
    
    def cleanup(self):
        """Clean up old entries."""
        with self._lock:
            cutoff = datetime.utcnow() - timedelta(seconds=self._window_seconds * 2)
            keys_to_remove = [
                key for key, entry in self._entries.items()
                if not any(r > cutoff for r in entry.requests)
            ]
            for key in keys_to_remove:
                del self._entries[key]


# Global rate limiter instance
rate_limiter = RateLimiter()
