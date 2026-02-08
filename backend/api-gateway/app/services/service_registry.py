"""Service registry for microservice discovery."""
import asyncio
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime

import httpx
import structlog

from app.config import settings

logger = structlog.get_logger()


@dataclass
class ServiceInstance:
    """Service instance information."""
    name: str
    url: str
    status: str = "unknown"
    last_heartbeat: Optional[datetime] = None
    latency_ms: Optional[float] = None
    metadata: Dict = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class ServiceRegistry:
    """Registry for backend microservices."""
    
    def __init__(self):
        self._services: Dict[str, ServiceInstance] = {}
        self._client: Optional[httpx.AsyncClient] = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=10.0)
        return self._client
    
    async def discover_services(self) -> None:
        """Discover and register all services."""
        logger.info("Discovering services")
        
        services_config = {
            "stt": settings.STT_SERVICE_URL,
            "llm": settings.LLM_SERVICE_URL,
            "tts": settings.TTS_SERVICE_URL,
        }
        
        for name, url in services_config.items():
            instance = ServiceInstance(name=name, url=url)
            self._services[name] = instance
            
            # Check service health
            await self._check_service_health(name)
        
        logger.info(
            "Service discovery complete",
            services=list(self._services.keys()),
        )
    
    async def _check_service_health(self, name: str) -> bool:
        """Check health of a service."""
        service = self._services.get(name)
        if not service:
            return False
        
        try:
            client = await self._get_client()
            start = asyncio.get_event_loop().time()
            
            response = await client.get(f"{service.url}/health")
            
            elapsed = (asyncio.get_event_loop().time() - start) * 1000
            
            if response.status_code == 200:
                service.status = "healthy"
                service.last_heartbeat = datetime.utcnow()
                service.latency_ms = elapsed
                logger.debug(
                    f"Service {name} is healthy",
                    latency_ms=round(elapsed, 2),
                )
                return True
            else:
                service.status = "unhealthy"
                logger.warning(
                    f"Service {name} returned non-200 status",
                    status_code=response.status_code,
                )
                return False
                
        except Exception as e:
            service.status = "unreachable"
            logger.error(
                f"Service {name} is unreachable",
                error=str(e),
            )
            return False
    
    async def heartbeat_loop(self) -> None:
        """Continuously check service health."""
        while True:
            try:
                await asyncio.sleep(30)  # Check every 30 seconds
                
                for name in self._services:
                    await self._check_service_health(name)
                    
            except asyncio.CancelledError:
                logger.info("Heartbeat loop cancelled")
                break
            except Exception as e:
                logger.error("Error in heartbeat loop", error=str(e))
    
    def get_service(self, name: str) -> Optional[ServiceInstance]:
        """Get service instance by name."""
        return self._services.get(name)
    
    def get_healthy_service(self, name: str) -> Optional[ServiceInstance]:
        """Get healthy service instance."""
        service = self._services.get(name)
        if service and service.status == "healthy":
            return service
        return None
    
    def get_all_services(self) -> Dict[str, ServiceInstance]:
        """Get all registered services."""
        return self._services.copy()
    
    def get_healthy_services(self) -> Dict[str, ServiceInstance]:
        """Get all healthy services."""
        return {
            name: svc for name, svc in self._services.items()
            if svc.status == "healthy"
        }


# Global service registry instance
service_registry = ServiceRegistry()
