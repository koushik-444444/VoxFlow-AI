"""LLM engine with multiple provider support."""
import asyncio
import time
from typing import AsyncGenerator, List, Dict, Any, Optional
import structlog

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

logger = structlog.get_logger()


class LLMEngine:
    """Unified LLM engine supporting multiple providers."""
    
    def __init__(self):
        self.provider = None
        self.model = None
        self.is_initialized = False
        self._first_token_latency_ms = 0
    
    async def initialize(self):
        """Initialize the LLM engine."""
        from app.config import settings
        
        self.provider = settings.LLM_PROVIDER
        
        if self.provider == "ollama":
            await self._init_ollama()
        elif self.provider == "openai":
            await self._init_openai()
        elif self.provider == "anthropic":
            await self._init_anthropic()
        elif self.provider == "huggingface":
            await self._init_huggingface()
        elif self.provider == "local":
            await self._init_local()
        elif self.provider == "groq":
            await self._init_groq()
        else:
            raise ValueError(f"Unknown provider: {self.provider}")
        
        self.is_initialized = True
        logger.info("LLM engine initialized", provider=self.provider)
    
    async def _init_ollama(self):
        """Initialize Ollama provider (free, local LLM)."""
        from langchain_ollama import ChatOllama
        from app.config import settings
        
        logger.info("Initializing Ollama", 
                    model=settings.OLLAMA_MODEL, 
                    base_url=settings.OLLAMA_BASE_URL)
        
        self.model = ChatOllama(
            model=settings.OLLAMA_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
            temperature=settings.DEFAULT_TEMPERATURE,
            num_predict=settings.DEFAULT_MAX_TOKENS,
        )
        
        logger.info("Ollama initialized successfully")
    
    async def _init_openai(self):
        """Initialize OpenAI provider."""
        from langchain_community.chat_models import ChatOpenAI
        from app.config import settings
        
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not set")
        
        self.model = ChatOpenAI(
            model_name=settings.OPENAI_MODEL,
            temperature=settings.DEFAULT_TEMPERATURE,
            max_tokens=settings.DEFAULT_MAX_TOKENS,
            openai_api_key=settings.OPENAI_API_KEY,
            streaming=True,
        )
    
    async def _init_anthropic(self):
        """Initialize Anthropic provider."""
        from langchain_community.chat_models import ChatAnthropic
        from app.config import settings
        
        if not settings.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY not set")
        
        self.model = ChatAnthropic(
            model=settings.ANTHROPIC_MODEL,
            temperature=settings.DEFAULT_TEMPERATURE,
            max_tokens_to_sample=settings.DEFAULT_MAX_TOKENS,
            anthropic_api_key=settings.ANTHROPIC_API_KEY,
            streaming=True,
        )
    
    async def _init_huggingface(self):
        """Initialize HuggingFace provider."""
        from langchain_community.llms import HuggingFacePipeline
        from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
        import torch
        from app.config import settings
        
        logger.info("Loading HuggingFace model", model=settings.HUGGINGFACE_MODEL)
        
        tokenizer = AutoTokenizer.from_pretrained(
            settings.HUGGINGFACE_MODEL,
            token=settings.HUGGINGFACE_API_TOKEN or None,
        )
        
        model = AutoModelForCausalLM.from_pretrained(
            settings.HUGGINGFACE_MODEL,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            device_map="auto" if torch.cuda.is_available() else None,
            token=settings.HUGGINGFACE_API_TOKEN or None,
        )
        
        pipe = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            max_new_tokens=settings.DEFAULT_MAX_TOKENS,
            temperature=settings.DEFAULT_TEMPERATURE,
            do_sample=True,
        )
        
        self.model = HuggingFacePipeline(pipeline=pipe)
        logger.info("HuggingFace model loaded")
    
    async def _init_local(self):
        """Initialize local model."""
        from langchain_community.llms import LlamaCpp
        from app.config import settings
        
        if not settings.LOCAL_MODEL_PATH:
            raise ValueError("LOCAL_MODEL_PATH not set")
        
        self.model = LlamaCpp(
            model_path=settings.LOCAL_MODEL_PATH,
            temperature=settings.DEFAULT_TEMPERATURE,
            max_tokens=settings.DEFAULT_MAX_TOKENS,
            n_ctx=4096,
            verbose=False,
        )

    async def _init_groq(self):
        """Initialize Groq provider."""
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
        logger.info("Groq initialized successfully", model=settings.GROQ_MODEL)

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
        
        # Update parameters if provided
        if temperature is not None:
            self.model.temperature = temperature
        if max_tokens is not None:
            self.model.max_tokens = max_tokens
        
        # Generate
        response = await self.model.ainvoke(lc_messages)
        
        latency_ms = (time.time() - start_time) * 1000
        
        return {
            "text": response.content,
            "latency_ms": round(latency_ms, 2),
            "tokens_used": None,  # Would need token counting
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
        
        from app.config import settings
        
        lc_messages = self._convert_messages(messages)
        
        # Update parameters
        if temperature is not None:
            self.model.temperature = temperature
        if max_tokens is not None:
            self.model.max_tokens = max_tokens
        
        first_token = True
        first_token_time = None
        
        # Stream generation
        async for chunk in self.model.astream(lc_messages):
            if first_token:
                first_token_time = time.time()
                self._first_token_latency_ms = (first_token_time - time.time()) * 1000
                first_token = False
            
            content = chunk.content if hasattr(chunk, 'content') else str(chunk)
            if content:
                yield content
    
    def get_info(self) -> Dict[str, Any]:
        """Get engine information."""
        from app.config import settings
        
        return {
            "initialized": self.is_initialized,
            "provider": self.provider,
            "model": getattr(settings, f"{self.provider.upper()}_MODEL", "unknown"),
            "first_token_latency_ms": round(self._first_token_latency_ms, 2) if self._first_token_latency_ms else None,
        }


# Global engine instance
llm_engine = LLMEngine()
