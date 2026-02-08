"""Groq LLM engine for language generation."""
import time
from typing import AsyncGenerator, List, Dict, Any, Optional
import structlog

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

logger = structlog.get_logger()


class LLMEngine:
    """LLM engine focused on Groq Cloud."""
    
    def __init__(self):
        self.model = None
        self.is_initialized = False
        self._first_token_latency_ms = 0
    
    async def initialize(self):
        """Initialize the Groq engine."""
        from langchain_groq import ChatGroq
        from app.config import settings
        
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY not set")
            
        self.model = ChatGroq(
            temperature=settings.DEFAULT_TEMPERATURE,
            model_name=settings.GROQ_MODEL,
            groq_api_key=settings.GROQ_API_KEY,
            max_tokens=settings.DEFAULT_MAX_TOKENS,
        )
        self.is_initialized = True
        logger.info("Groq LLM initialized successfully", model=settings.GROQ_MODEL)

    async def shutdown(self):
        """Shutdown the engine."""
        self.model = None
        self.is_initialized = False
        logger.info("LLM engine shutdown")
    
    def _convert_messages(self, messages: List[Dict[str, str]]) -> List:
        """Convert dict messages to LangChain message objects."""
        from app.config import settings
        
        lc_messages = [SystemMessage(content=settings.SYSTEM_PROMPT)]
        
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            
            if role == "user":
                lc_messages.append(HumanMessage(content=content))
            elif role == "assistant":
                lc_messages.append(AIMessage(content=content))
            elif role == "system":
                lc_messages.append(SystemMessage(content=content))
        
        return lc_messages
    
    async def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Generate a complete response."""
        if not self.is_initialized:
            raise RuntimeError("Engine not initialized")
        
        start_time = time.time()
        lc_messages = self._convert_messages(messages)
        
        # Note: ChatGroq parameters are usually set at initialization, 
        # but we can pass them in the invoke call if needed or use bind
        response = await self.model.ainvoke(lc_messages)
        
        latency_ms = (time.time() - start_time) * 1000
        
        return {
            "text": response.content,
            "latency_ms": round(latency_ms, 2),
            "tokens_used": None,
        }
    
    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> AsyncGenerator[str, None]:
        """Generate streaming response."""
        if not self.is_initialized:
            raise RuntimeError("Engine not initialized")
        
        lc_messages = self._convert_messages(messages)
        start_request_time = time.time()
        first_token = True
        
        async for chunk in self.model.astream(lc_messages):
            if first_token:
                self._first_token_latency_ms = (time.time() - start_request_time) * 1000
                first_token = False
            
            content = chunk.content if hasattr(chunk, 'content') else str(chunk)
            if content:
                yield content
    
    def get_info(self) -> Dict[str, Any]:
        """Get engine information."""
        from app.config import settings
        return {
            "initialized": self.is_initialized,
            "provider": "groq",
            "model": settings.GROQ_MODEL,
            "first_token_latency_ms": round(self._first_token_latency_ms, 2) if self._first_token_latency_ms else None,
        }


# Global engine instance
llm_engine = LLMEngine()
