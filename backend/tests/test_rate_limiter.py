"""Tests for the rate limiter service.

These are pure unit tests — no external dependencies required.
"""
import time
from unittest.mock import patch
from datetime import datetime, timedelta


def test_rate_limiter_allows_requests():
    """Rate limiter should allow requests under the limit."""
    from app.services.rate_limiter import RateLimiter

    limiter = RateLimiter()
    # Default is 100 requests per 60s window
    assert limiter.is_allowed("test-client") is True


def test_rate_limiter_blocks_after_limit():
    """Rate limiter should block requests after the limit is reached."""
    from app.services.rate_limiter import RateLimiter

    limiter = RateLimiter()
    # Exhaust the limit
    for _ in range(limiter._max_requests):
        assert limiter.is_allowed("test-client") is True

    # Next request should be blocked
    assert limiter.is_allowed("test-client") is False


def test_rate_limiter_get_remaining():
    """get_remaining should return correct remaining count."""
    from app.services.rate_limiter import RateLimiter

    limiter = RateLimiter()

    assert limiter.get_remaining("new-client") == limiter._max_requests

    limiter.is_allowed("new-client")
    assert limiter.get_remaining("new-client") == limiter._max_requests - 1


def test_rate_limiter_reset():
    """reset should clear the entry for a client."""
    from app.services.rate_limiter import RateLimiter

    limiter = RateLimiter()

    # Make some requests
    for _ in range(5):
        limiter.is_allowed("reset-client")

    assert limiter.get_remaining("reset-client") == limiter._max_requests - 5

    limiter.reset("reset-client")
    assert limiter.get_remaining("reset-client") == limiter._max_requests


def test_rate_limiter_independent_clients():
    """Different clients should have independent rate limits."""
    from app.services.rate_limiter import RateLimiter

    limiter = RateLimiter()

    for _ in range(5):
        limiter.is_allowed("client-a")

    assert limiter.get_remaining("client-a") == limiter._max_requests - 5
    assert limiter.get_remaining("client-b") == limiter._max_requests


def test_rate_limiter_cleanup():
    """cleanup should remove stale entries."""
    from app.services.rate_limiter import RateLimiter

    limiter = RateLimiter()
    limiter.is_allowed("stale-client")

    # Entries exist
    assert "stale-client" in limiter._entries

    # Move all request timestamps to the past so cleanup removes them
    past = datetime.utcnow() - timedelta(seconds=limiter._window_seconds * 3)
    limiter._entries["stale-client"].requests = [past]

    limiter.cleanup()
    assert "stale-client" not in limiter._entries


def test_rate_limit_entry_clean_old():
    """RateLimitEntry.clean_old should remove expired timestamps."""
    from app.services.rate_limiter import RateLimitEntry

    entry = RateLimitEntry()
    old_time = datetime.utcnow() - timedelta(seconds=120)
    recent_time = datetime.utcnow()
    entry.requests = [old_time, recent_time]

    entry.clean_old(60)
    assert len(entry.requests) == 1
    assert entry.requests[0] == recent_time


def test_rate_limit_entry_count():
    """RateLimitEntry.count should return count within window."""
    from app.services.rate_limiter import RateLimitEntry

    entry = RateLimitEntry()
    old_time = datetime.utcnow() - timedelta(seconds=120)
    entry.requests = [old_time]
    entry.add()

    # Only the recent one should be counted in a 60s window
    assert entry.count(60) == 1
