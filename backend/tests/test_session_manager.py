"""Tests for the session manager.

Uses a mock Redis client to test session CRUD operations
without requiring an actual Redis server.
"""
import pytest
import json
from unittest.mock import AsyncMock, patch, MagicMock


class FakeRedisClient:
    """In-memory fake of RedisClient for testing."""

    def __init__(self):
        self._store = {}

    async def get_session(self, session_id):
        key = f"session:{session_id}"
        data = self._store.get(key)
        if data:
            return json.loads(data)
        return None

    async def set_session(self, session_id, data, ttl=None):
        key = f"session:{session_id}"
        self._store[key] = json.dumps(data)

    async def delete_session(self, session_id):
        key = f"session:{session_id}"
        self._store.pop(key, None)


@pytest.fixture
def session_mgr():
    """Create a SessionManager with a fake Redis client."""
    from app.services.session_manager import SessionManager

    mgr = SessionManager()
    # Patch the redis_client used inside the module
    fake_redis = FakeRedisClient()
    with patch("app.services.session_manager.redis_client", fake_redis):
        mgr._fake_redis = fake_redis
        yield mgr


@pytest.mark.asyncio
async def test_create_session(session_mgr):
    """create_session should return a valid session dict."""
    with patch("app.services.session_manager.redis_client", session_mgr._fake_redis):
        session = await session_mgr.create_session(user_id="user1")

    assert "id" in session
    assert session["user_id"] == "user1"
    assert session["memory"]["messages"] == []
    assert "created_at" in session
    assert "last_activity" in session


@pytest.mark.asyncio
async def test_get_session_existing(session_mgr):
    """get_session should return session data for existing session."""
    with patch("app.services.session_manager.redis_client", session_mgr._fake_redis):
        session = await session_mgr.create_session(user_id="user1")
        retrieved = await session_mgr.get_session(session["id"])

    assert retrieved is not None
    assert retrieved["id"] == session["id"]
    assert retrieved["user_id"] == "user1"


@pytest.mark.asyncio
async def test_get_session_nonexistent(session_mgr):
    """get_session should return None for nonexistent session."""
    with patch("app.services.session_manager.redis_client", session_mgr._fake_redis):
        result = await session_mgr.get_session("nonexistent-id")

    assert result is None


@pytest.mark.asyncio
async def test_add_message(session_mgr):
    """add_message should append to session memory."""
    with patch("app.services.session_manager.redis_client", session_mgr._fake_redis):
        session = await session_mgr.create_session()
        result = await session_mgr.add_message(session["id"], "user", "Hello")

    assert result is True

    with patch("app.services.session_manager.redis_client", session_mgr._fake_redis):
        updated = await session_mgr.get_session(session["id"])

    assert len(updated["memory"]["messages"]) == 1
    assert updated["memory"]["messages"][0]["role"] == "user"
    assert updated["memory"]["messages"][0]["content"] == "Hello"


@pytest.mark.asyncio
async def test_add_message_to_nonexistent_session(session_mgr):
    """add_message should return False for nonexistent session."""
    with patch("app.services.session_manager.redis_client", session_mgr._fake_redis):
        result = await session_mgr.add_message("nonexistent", "user", "Hello")

    assert result is False


@pytest.mark.asyncio
async def test_get_conversation_context(session_mgr):
    """get_conversation_context should return recent messages."""
    with patch("app.services.session_manager.redis_client", session_mgr._fake_redis):
        session = await session_mgr.create_session()
        await session_mgr.add_message(session["id"], "user", "Hello")
        await session_mgr.add_message(session["id"], "assistant", "Hi there")
        await session_mgr.add_message(session["id"], "user", "How are you?")

        context = await session_mgr.get_conversation_context(session["id"])

    assert len(context) == 3
    assert context[0] == {"role": "user", "content": "Hello"}
    assert context[1] == {"role": "assistant", "content": "Hi there"}
    assert context[2] == {"role": "user", "content": "How are you?"}


@pytest.mark.asyncio
async def test_get_conversation_context_max_messages(session_mgr):
    """get_conversation_context should respect max_messages limit."""
    with patch("app.services.session_manager.redis_client", session_mgr._fake_redis):
        session = await session_mgr.create_session()
        for i in range(15):
            await session_mgr.add_message(session["id"], "user", f"Message {i}")

        context = await session_mgr.get_conversation_context(
            session["id"], max_messages=5
        )

    assert len(context) == 5
    # Should be the last 5 messages
    assert context[0]["content"] == "Message 10"
    assert context[4]["content"] == "Message 14"


@pytest.mark.asyncio
async def test_get_conversation_context_nonexistent(session_mgr):
    """get_conversation_context should return empty list for nonexistent session."""
    with patch("app.services.session_manager.redis_client", session_mgr._fake_redis):
        context = await session_mgr.get_conversation_context("nonexistent")

    assert context == []


@pytest.mark.asyncio
async def test_clear_memory(session_mgr):
    """clear_memory should remove all messages."""
    with patch("app.services.session_manager.redis_client", session_mgr._fake_redis):
        session = await session_mgr.create_session()
        await session_mgr.add_message(session["id"], "user", "Hello")
        await session_mgr.add_message(session["id"], "assistant", "Hi")

        result = await session_mgr.clear_memory(session["id"])
        assert result is True

        updated = await session_mgr.get_session(session["id"])

    assert updated["memory"]["messages"] == []
    assert updated["memory"]["summary"] is None


@pytest.mark.asyncio
async def test_clear_memory_nonexistent(session_mgr):
    """clear_memory should return False for nonexistent session."""
    with patch("app.services.session_manager.redis_client", session_mgr._fake_redis):
        result = await session_mgr.clear_memory("nonexistent")

    assert result is False


@pytest.mark.asyncio
async def test_update_config(session_mgr):
    """update_config should merge new config into session."""
    with patch("app.services.session_manager.redis_client", session_mgr._fake_redis):
        session = await session_mgr.create_session(config={"voice": "default"})
        result = await session_mgr.update_config(
            session["id"], {"voice": "en-US-AndrewNeural", "speed": 1.2}
        )

        assert result is True

        updated = await session_mgr.get_session(session["id"])

    assert updated["config"]["voice"] == "en-US-AndrewNeural"
    assert updated["config"]["speed"] == 1.2


@pytest.mark.asyncio
async def test_update_config_nonexistent(session_mgr):
    """update_config should return False for nonexistent session."""
    with patch("app.services.session_manager.redis_client", session_mgr._fake_redis):
        result = await session_mgr.update_config("nonexistent", {"key": "val"})

    assert result is False


@pytest.mark.asyncio
async def test_delete_session_always_returns_true_bug(session_mgr):
    """BUG: delete_session always returns True even for nonexistent sessions.

    This documents the known bug in session_manager.delete_session().
    The method calls redis_client.delete_session() (which does not raise
    if the key doesn't exist) and always returns True.
    """
    with patch("app.services.session_manager.redis_client", session_mgr._fake_redis):
        # Deleting a nonexistent session still returns True
        result = await session_mgr.delete_session("nonexistent-session-id")

    # This documents the bug — ideally this should return False
    assert result is True


@pytest.mark.asyncio
async def test_delete_session_removes_data(session_mgr):
    """delete_session should remove the session from storage."""
    with patch("app.services.session_manager.redis_client", session_mgr._fake_redis):
        session = await session_mgr.create_session()
        await session_mgr.delete_session(session["id"])
        retrieved = await session_mgr.get_session(session["id"])

    assert retrieved is None
