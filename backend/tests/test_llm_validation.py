"""Tests for LLM service input validation.

Tests the Pydantic validators on GenerateRequest without needing
a running LLM engine. These are pure validation tests.
"""
import pytest
from pydantic import ValidationError


def _valid_messages(n=1):
    """Helper to create n valid messages."""
    return [{"role": "user", "content": f"Hello {i}"} for i in range(n)]


def test_generate_request_valid():
    """Valid request should pass validation."""
    from app.routers.generate import GenerateRequest

    req = GenerateRequest(
        session_id="test-session",
        messages=[{"role": "user", "content": "Hello"}],
        stream=False,
    )
    assert req.session_id == "test-session"
    assert len(req.messages) == 1


def test_generate_request_empty_messages():
    """Empty messages list should fail validation."""
    from app.routers.generate import GenerateRequest

    with pytest.raises(ValidationError, match="Messages list must not be empty"):
        GenerateRequest(
            session_id="test-session",
            messages=[],
        )


def test_generate_request_too_many_messages():
    """More than MAX_MESSAGES should fail validation."""
    from app.routers.generate import GenerateRequest, MAX_MESSAGES

    with pytest.raises(ValidationError, match="Too many messages"):
        GenerateRequest(
            session_id="test-session",
            messages=_valid_messages(MAX_MESSAGES + 1),
        )


def test_generate_request_max_messages_boundary():
    """Exactly MAX_MESSAGES should pass validation."""
    from app.routers.generate import GenerateRequest, MAX_MESSAGES

    req = GenerateRequest(
        session_id="test-session",
        messages=_valid_messages(MAX_MESSAGES),
    )
    assert len(req.messages) == MAX_MESSAGES


def test_generate_request_message_missing_role():
    """Message without 'role' field should fail."""
    from app.routers.generate import GenerateRequest

    with pytest.raises(ValidationError, match="must have 'role' and 'content'"):
        GenerateRequest(
            session_id="test-session",
            messages=[{"content": "hello"}],
        )


def test_generate_request_message_missing_content():
    """Message without 'content' field should fail."""
    from app.routers.generate import GenerateRequest

    with pytest.raises(ValidationError, match="must have 'role' and 'content'"):
        GenerateRequest(
            session_id="test-session",
            messages=[{"role": "user"}],
        )


def test_generate_request_invalid_role():
    """Invalid role should fail validation."""
    from app.routers.generate import GenerateRequest

    with pytest.raises(ValidationError, match="invalid role"):
        GenerateRequest(
            session_id="test-session",
            messages=[{"role": "admin", "content": "hello"}],
        )


def test_generate_request_valid_roles():
    """All valid roles (system, user, assistant) should pass."""
    from app.routers.generate import GenerateRequest

    req = GenerateRequest(
        session_id="test-session",
        messages=[
            {"role": "system", "content": "You are helpful"},
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there"},
        ],
    )
    assert len(req.messages) == 3


def test_generate_request_message_content_too_long():
    """Message content exceeding MAX_MESSAGE_CONTENT_LENGTH should fail."""
    from app.routers.generate import GenerateRequest, MAX_MESSAGE_CONTENT_LENGTH

    with pytest.raises(ValidationError, match="exceeds max length"):
        GenerateRequest(
            session_id="test-session",
            messages=[
                {"role": "user", "content": "x" * (MAX_MESSAGE_CONTENT_LENGTH + 1)}
            ],
        )


def test_generate_request_message_content_at_boundary():
    """Message content at exactly MAX_MESSAGE_CONTENT_LENGTH should pass."""
    from app.routers.generate import GenerateRequest, MAX_MESSAGE_CONTENT_LENGTH

    req = GenerateRequest(
        session_id="test-session",
        messages=[
            {"role": "user", "content": "x" * MAX_MESSAGE_CONTENT_LENGTH}
        ],
    )
    assert len(req.messages[0]["content"]) == MAX_MESSAGE_CONTENT_LENGTH


def test_generate_request_temperature_too_low():
    """Temperature below 0.0 should fail."""
    from app.routers.generate import GenerateRequest

    with pytest.raises(ValidationError, match="Temperature must be between"):
        GenerateRequest(
            session_id="test-session",
            messages=_valid_messages(),
            temperature=-0.1,
        )


def test_generate_request_temperature_too_high():
    """Temperature above 2.0 should fail."""
    from app.routers.generate import GenerateRequest

    with pytest.raises(ValidationError, match="Temperature must be between"):
        GenerateRequest(
            session_id="test-session",
            messages=_valid_messages(),
            temperature=2.1,
        )


def test_generate_request_temperature_valid_range():
    """Temperature at boundaries (0.0 and 2.0) should pass."""
    from app.routers.generate import GenerateRequest

    req_low = GenerateRequest(
        session_id="test-session",
        messages=_valid_messages(),
        temperature=0.0,
    )
    assert req_low.temperature == 0.0

    req_high = GenerateRequest(
        session_id="test-session",
        messages=_valid_messages(),
        temperature=2.0,
    )
    assert req_high.temperature == 2.0


def test_generate_request_temperature_none_is_valid():
    """Temperature=None (default) should pass."""
    from app.routers.generate import GenerateRequest

    req = GenerateRequest(
        session_id="test-session",
        messages=_valid_messages(),
    )
    assert req.temperature is None


def test_generate_request_max_tokens_too_low():
    """max_tokens below 1 should fail."""
    from app.routers.generate import GenerateRequest

    with pytest.raises(ValidationError, match="max_tokens must be between"):
        GenerateRequest(
            session_id="test-session",
            messages=_valid_messages(),
            max_tokens=0,
        )


def test_generate_request_max_tokens_too_high():
    """max_tokens above 8192 should fail."""
    from app.routers.generate import GenerateRequest

    with pytest.raises(ValidationError, match="max_tokens must be between"):
        GenerateRequest(
            session_id="test-session",
            messages=_valid_messages(),
            max_tokens=8193,
        )


def test_generate_request_max_tokens_valid_range():
    """max_tokens at boundaries (1 and 8192) should pass."""
    from app.routers.generate import GenerateRequest

    req = GenerateRequest(
        session_id="test-session",
        messages=_valid_messages(),
        max_tokens=1,
    )
    assert req.max_tokens == 1

    req = GenerateRequest(
        session_id="test-session",
        messages=_valid_messages(),
        max_tokens=8192,
    )
    assert req.max_tokens == 8192


def test_generate_request_max_tokens_none_is_valid():
    """max_tokens=None (default) should pass."""
    from app.routers.generate import GenerateRequest

    req = GenerateRequest(
        session_id="test-session",
        messages=_valid_messages(),
    )
    assert req.max_tokens is None
