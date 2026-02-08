"""Custom middleware for API Gateway."""
import time
import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import structlog

from app.config import settings
from app.services.rate_limiter import rate_limiter

logger = structlog.get_logger()


class LoggingMiddleware(BaseHTTPMiddleware):
    """Request/response logging middleware."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and log details."""
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Add request ID to logger context
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)
        
        start_time = time.time()
        
        logger.info(
            "Request started",
            method=request.method,
            path=request.url.path,
            client_ip=request.client.host if request.client else None,
        )
        
        try:
            response = await call_next(request)
            
            process_time = (time.time() - start_time) * 1000
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = str(process_time)
            
            logger.info(
                "Request completed",
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                latency_ms=round(process_time, 2),
            )
            
            return response
            
        except Exception as e:
            process_time = (time.time() - start_time) * 1000
            logger.error(
                "Request failed",
                method=request.method,
                path=request.url.path,
                error=str(e),
                latency_ms=round(process_time, 2),
            )
            raise


class TimingMiddleware(BaseHTTPMiddleware):
    """Request timing middleware."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Add timing headers to response."""
        start_time = time.perf_counter()
        
        response = await call_next(request)
        
        process_time = (time.perf_counter() - start_time) * 1000
        response.headers["X-Response-Time"] = f"{process_time:.2f}ms"
        
        return response


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Global error handling middleware."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Handle exceptions gracefully."""
        try:
            return await call_next(request)
        except Exception as exc:
            logger.exception("Unhandled exception in request")
            return Response(
                content=f'{{"detail": "{str(exc)}"}}',
                status_code=500,
                media_type="application/json"
            )


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Check rate limit before processing."""
        # Skip rate limiting for health checks
        if request.url.path == "/health":
            return await call_next(request)
        
        # Get client identifier
        client_id = request.headers.get("X-API-Key") or request.client.host
        
        if not rate_limiter.is_allowed(client_id):
            return Response(
                content='{"detail": "Rate limit exceeded"}',
                status_code=429,
                media_type="application/json",
                headers={"X-RateLimit-Remaining": "0"}
            )
        
        response = await call_next(request)
        response.headers["X-RateLimit-Remaining"] = str(
            rate_limiter.get_remaining(client_id)
        )
        
        return response
