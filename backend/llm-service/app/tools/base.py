from langchain_core.tools import tool
import datetime
import structlog

logger = structlog.get_logger()

@tool
def get_current_time():
    """Returns the current date and time."""
    now = datetime.datetime.now()
    return f"Current time is {now.strftime('%Y-%m-%d %H:%M:%S')}."

@tool
def get_weather(location: str):
    """Get the current weather in a given location."""
    # This is a placeholder tool. In a real app, it would call an external API.
    logger.info("Getting weather", location=location)
    return f"The weather in {location} is currently sunny and 22°C (mock data)."

@tool
def search_memory(query: str):
    """Search for relevant information from past conversations in this session."""
    from app.services.memory import memory_manager
    # In a real app, we'd need to pass session_id here. 
    # For this implementation, we'll assume current context is handled.
    # Note: Tool calling often needs additional context injected.
    logger.info("Searching memory", query=query)
    # This is a simplified version; real RAG would inject session_id
    return "Found related past info: [Mock memory result for demo]"

# List of available tools
TOOLS = [get_current_time, get_weather, search_memory]
