"""Tests for API Gateway configuration.

Tests the validate_security() method and settings behavior.
"""
import pytest


def test_validate_security_raises_on_default_secret_in_production():
    """Should raise ValueError when using default JWT secret in production."""
    from app.config import Settings

    s = Settings(
        ENVIRONMENT="production",
        JWT_SECRET="your-secret-key-change-in-production",
    )
    with pytest.raises(ValueError, match="JWT_SECRET must be changed"):
        s.validate_security()


def test_validate_security_raises_on_old_default_secret_in_production():
    """Should raise ValueError for the other default secret value."""
    from app.config import Settings

    s = Settings(
        ENVIRONMENT="production",
        JWT_SECRET="your-super-secret-jwt-key-change-in-production",
    )
    with pytest.raises(ValueError, match="JWT_SECRET must be changed"):
        s.validate_security()


def test_validate_security_passes_with_real_secret_in_production():
    """Should not raise when JWT_SECRET is a non-default value in production."""
    from app.config import Settings

    s = Settings(
        ENVIRONMENT="production",
        JWT_SECRET="a-real-strong-secret-key-abc123",
    )
    # Should not raise
    s.validate_security()


def test_validate_security_passes_in_development_with_default():
    """Should not raise in development even with default secret."""
    from app.config import Settings

    s = Settings(
        ENVIRONMENT="development",
        JWT_SECRET="your-secret-key-change-in-production",
    )
    # Should not raise
    s.validate_security()


def test_default_cors_origins():
    """Default CORS origins should include localhost:3000."""
    from app.config import Settings

    s = Settings()
    assert "http://localhost:3000" in s.CORS_ORIGINS


def test_settings_defaults():
    """Settings should have sensible defaults."""
    from app.config import Settings

    s = Settings()
    assert s.RATE_LIMIT_REQUESTS == 100
    assert s.RATE_LIMIT_WINDOW == 60
    assert s.WS_HEARTBEAT_INTERVAL == 30
    assert s.SESSION_TTL == 3600
    assert s.MAX_AUDIO_SIZE_MB == 50
