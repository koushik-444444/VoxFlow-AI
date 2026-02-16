import chromadb
from chromadb.config import Settings
import uuid
import structlog
from typing import List, Dict, Any

logger = structlog.get_logger()

class MemoryManager:
    def __init__(self):
        self.client = chromadb.Client(Settings(allow_reset=True))
        self.collection = self.client.get_or_create_collection(name="conversation_history")

    def add_message(self, session_id: str, role: str, content: str):
        """Add a message to the vector database for long-term retrieval."""
        try:
            self.collection.add(
                ids=[str(uuid.uuid4())],
                documents=[content],
                metadatas=[{"session_id": session_id, "role": role}],
            )
            logger.info("Message added to long-term memory", session_id=session_id)
        except Exception as e:
            logger.error("Failed to add message to memory", error=str(e))

    def retrieve_context(self, session_id: str, query: str, n_results: int = 3) -> List[str]:
        """Retrieve relevant past messages for context."""
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results,
                where={"session_id": session_id}
            )
            return results['documents'][0] if results['documents'] else []
        except Exception as e:
            logger.error("Memory retrieval failed", error=str(e))
            return []

memory_manager = MemoryManager()
