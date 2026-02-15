"""Tests for TTS service input validation.

Tests the Pydantic validators on SynthesizeRequest without needing
a running TTS engine. These are pure validation tests.
"""
import pytest
from pydantic import ValidationError


def test_synthesize_request_valid():
    """Valid request should pass validation."""
    from app.routers.synthesize import SynthesizeRequest

    req = SynthesizeRequest(
        session_id="test-session",
        text="Hello world",
    )
    assert req.text == "Hello world"
    assert req.speed == 1.0
    assert req.voice_id == "default"


def test_synthesize_request_empty_text():
    """Empty text should fail validation."""
    from app.routers.synthesize import SynthesizeRequest

    with pytest.raises(ValidationError, match="Text must not be empty"):
        SynthesizeRequest(
            session_id="test-session",
            text="",
        )


def test_synthesize_request_whitespace_only_text():
    """Whitespace-only text should fail validation."""
    from app.routers.synthesize import SynthesizeRequest

    with pytest.raises(ValidationError, match="Text must not be empty"):
        SynthesizeRequest(
            session_id="test-session",
            text="   ",
        )


def test_synthesize_request_text_too_long():
    """Text exceeding MAX_TTS_TEXT_LENGTH should fail."""
    from app.routers.synthesize import SynthesizeRequest, MAX_TTS_TEXT_LENGTH

    with pytest.raises(ValidationError, match="exceeds maximum length"):
        SynthesizeRequest(
            session_id="test-session",
            text="x" * (MAX_TTS_TEXT_LENGTH + 1),
        )


def test_synthesize_request_text_at_max_length():
    """Text at exactly MAX_TTS_TEXT_LENGTH should pass."""
    from app.routers.synthesize import SynthesizeRequest, MAX_TTS_TEXT_LENGTH

    req = SynthesizeRequest(
        session_id="test-session",
        text="x" * MAX_TTS_TEXT_LENGTH,
    )
    assert len(req.text) == MAX_TTS_TEXT_LENGTH


def test_synthesize_request_speed_too_low():
    """Speed below 0.25 should fail."""
    from app.routers.synthesize import SynthesizeRequest

    with pytest.raises(ValidationError, match="Speed must be between"):
        SynthesizeRequest(
            session_id="test-session",
            text="hello",
            speed=0.1,
        )


def test_synthesize_request_speed_too_high():
    """Speed above 4.0 should fail."""
    from app.routers.synthesize import SynthesizeRequest

    with pytest.raises(ValidationError, match="Speed must be between"):
        SynthesizeRequest(
            session_id="test-session",
            text="hello",
            speed=4.1,
        )


def test_synthesize_request_speed_at_boundaries():
    """Speed at boundaries (0.25 and 4.0) should pass."""
    from app.routers.synthesize import SynthesizeRequest

    req_low = SynthesizeRequest(
        session_id="test-session",
        text="hello",
        speed=0.25,
    )
    assert req_low.speed == 0.25

    req_high = SynthesizeRequest(
        session_id="test-session",
        text="hello",
        speed=4.0,
    )
    assert req_high.speed == 4.0


def test_synthesize_request_custom_voice_id():
    """Custom voice_id should pass."""
    from app.routers.synthesize import SynthesizeRequest

    req = SynthesizeRequest(
        session_id="test-session",
        text="hello",
        voice_id="en-US-AndrewNeural",
    )
    assert req.voice_id == "en-US-AndrewNeural"


def test_synthesize_request_custom_format():
    """Custom format should pass."""
    from app.routers.synthesize import SynthesizeRequest

    req = SynthesizeRequest(
        session_id="test-session",
        text="hello",
        format="mp3",
    )
    assert req.format == "mp3"
