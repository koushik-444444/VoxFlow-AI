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
        self.model_with_tools = None
        self.is_initialized = False
        self._first_token_latency_ms = 0
    
    async def initialize(self):
        """Initialize the Groq engine."""
        from langchain_groq import ChatGroq
        from app.config import settings
        from app.tools.base import TOOLS
        
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY not set")
            
        self.model = ChatGroq(
            temperature=settings.DEFAULT_TEMPERATURE,
            model_name=settings.GROQ_MODEL,
            groq_api_key=settings.GROQ_API_KEY,
            max_tokens=settings.DEFAULT_MAX_TOKENS,
        )
        
        # Bind tools
        self.model_with_tools = self.model.bind_tools(TOOLS)
        
        self.is_initialized = True
        logger.info("Groq LLM initialized successfully", model=settings.GROQ_MODEL)

    async def shutdown(self):
        """Shutdown the engine."""
        self.model = None
        self.model_with_tools = None
        self.is_initialized = False
        logger.info("LLM engine shutdown")
    
    def _convert_messages(self, messages: List[Dict[str, str]]) -> List:
        """Convert dict messages to LangChain message objects."""
        from app.config import settings
        from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
        
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

    async def _handle_tool_calls(self, response, lc_messages):
        """Execute tool calls if present and return updated messages."""
        from app.tools.base import TOOLS
        from langchain_core.messages import ToolMessage
        
        if not hasattr(response, 'tool_calls') or not response.tool_calls:
            return lc_messages, False
            
        # Add assistant message with tool calls to context
        lc_messages.append(response)
        
        tool_map = {tool.name: tool for tool in TOOLS}
        
        for tool_call in response.tool_calls:
            tool_name = tool_call["name"]
            tool_args = tool_call["args"]
            
            logger.info("Executing tool", tool=tool_name, args=tool_args)
            
            if tool_name in tool_map:
                try:
                    tool_result = await tool_map[tool_name].ainvoke(tool_args)
                    lc_messages.append(ToolMessage(
                        content=str(tool_result),
                        tool_call_id=tool_call["id"]
                    ))
                except Exception as e:
                    logger.error("Tool execution failed", tool=tool_name, error=str(e))
                    lc_messages.append(ToolMessage(
                        content=f"Error: {str(e)}",
                        tool_call_id=tool_call["id"]
                    ))
            else:
                logger.warn("Tool not found", tool=tool_name)
                lc_messages.append(ToolMessage(
                    content=f"Error: Tool {tool_name} not found",
                    tool_call_id=tool_call["id"]
                ))
        
        return lc_messages, True

    async def generate(
        self,
        messages: List[Dict[str, str]],
        session_id: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Generate a complete response with tool support and memory."""
        if not self.is_initialized:
            raise RuntimeError("Engine not initialized")
        
        start_time = time.time()
        
        # Step 1: Add new user message to memory
        from app.services.memory import memory_manager
        if session_id and messages and messages[-1]["role"] == "user":
            memory_manager.add_message(session_id, "user", messages[-1]["content"])
        
        # Step 2: Retrieve relevant context (RAG)
        context_str = ""
        if session_id and messages:
            past_messages = memory_manager.retrieve_context(session_id, messages[-1]["content"])
            if past_messages:
                context_str = "\nRelevant past information:\n" + "\n".join([f"- {m}" for m in past_messages])

        lc_messages = self._convert_messages(messages)
        
        # Inject RAG context into system prompt or as a new message
        if context_str:
            from langchain_core.messages import SystemMessage
            lc_messages.insert(1, SystemMessage(content=f"Context from memory: {context_str}"))

        # Step 3: Check for tool calls
        response = await self.model_with_tools.ainvoke(lc_messages)
        lc_messages, tool_executed = await self._handle_tool_calls(response, lc_messages)
        
        if tool_executed:
            response = await self.model.ainvoke(lc_messages)
        
        # Step 4: Add AI response to memory
        if session_id:
            memory_manager.add_message(session_id, "assistant", response.content)
        
        latency_ms = (time.time() - start_time) * 1000
        
        return {
            "text": response.content,
            "latency_ms": round(latency_ms, 2),
            "tokens_used": None,
        }
    
    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        session_id: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> AsyncGenerator[str, None]:
        """Generate streaming response with tool support and memory."""
        if not self.is_initialized:
            raise RuntimeError("Engine not initialized")
        
        # Step 1: Add new user message to memory
        from app.services.memory import memory_manager
        if session_id and messages and messages[-1]["role"] == "user":
            memory_manager.add_message(session_id, "user", messages[-1]["content"])

        # Step 2: Retrieve relevant context (RAG)
        context_str = ""
        if session_id and messages:
            past_messages = memory_manager.retrieve_context(session_id, messages[-1]["content"])
            if past_messages:
                context_str = "\nRelevant past information:\n" + "\n".join([f"- {m}" for m in past_messages])

        lc_messages = self._convert_messages(messages)

        if context_str:
            from langchain_core.messages import SystemMessage
            lc_messages.insert(1, SystemMessage(content=f"Context from memory: {context_str}"))
        
        # Step 3: Check for tool calls
        response = await self.model_with_tools.ainvoke(lc_messages)
        lc_messages, tool_executed = await self._handle_tool_calls(response, lc_messages)
        
        # Step 4: Stream the final response
        start_request_time = time.time()
        first_token = True
        full_response = ""
        
        async for chunk in self.model.astream(lc_messages):
            if first_token:
                self._first_token_latency_ms = (time.time() - start_request_time) * 1000
                first_token = False
            
            content = chunk.content if hasattr(chunk, 'content') else str(chunk)
            if content:
                full_response += content
                yield content
        
        # Step 5: Add AI response to memory
        if session_id:
            memory_manager.add_message(session_id, "assistant", full_response)
    
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
