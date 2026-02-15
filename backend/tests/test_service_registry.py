"""Tests for the service registry.

Tests ServiceInstance and ServiceRegistry behavior without network calls.
"""
import pytest


def test_service_instance_defaults():
    """ServiceInstance should have correct defaults."""
    from app.services.service_registry import ServiceInstance

    svc = ServiceInstance(name="test", url="http://localhost:8001")
    assert svc.name == "test"
    assert svc.url == "http://localhost:8001"
    assert svc.status == "unknown"
    assert svc.last_heartbeat is None
    assert svc.latency_ms is None
    assert svc.metadata == {}


def test_service_instance_metadata_default():
    """ServiceInstance metadata should default to empty dict (not None)."""
    from app.services.service_registry import ServiceInstance

    svc = ServiceInstance(name="test", url="http://localhost:8001")
    assert isinstance(svc.metadata, dict)


def test_service_registry_get_service_missing():
    """get_service should return None for unregistered service."""
    from app.services.service_registry import ServiceRegistry

    registry = ServiceRegistry()
    assert registry.get_service("nonexistent") is None


def test_service_registry_get_healthy_service_returns_none_if_unhealthy():
    """get_healthy_service should return None if service is not healthy."""
    from app.services.service_registry import ServiceRegistry, ServiceInstance

    registry = ServiceRegistry()
    registry._services["test"] = ServiceInstance(
        name="test", url="http://localhost:8001", status="unhealthy"
    )

    assert registry.get_healthy_service("test") is None


def test_service_registry_get_healthy_service_returns_service_if_healthy():
    """get_healthy_service should return the service if it's healthy."""
    from app.services.service_registry import ServiceRegistry, ServiceInstance

    registry = ServiceRegistry()
    svc = ServiceInstance(
        name="test", url="http://localhost:8001", status="healthy"
    )
    registry._services["test"] = svc

    result = registry.get_healthy_service("test")
    assert result is svc


def test_service_registry_get_all_services():
    """get_all_services should return a copy of all services."""
    from app.services.service_registry import ServiceRegistry, ServiceInstance

    registry = ServiceRegistry()
    registry._services["stt"] = ServiceInstance(name="stt", url="http://localhost:8001")
    registry._services["llm"] = ServiceInstance(name="llm", url="http://localhost:8002")

    all_services = registry.get_all_services()
    assert len(all_services) == 2
    assert "stt" in all_services
    assert "llm" in all_services


def test_service_registry_get_healthy_services():
    """get_healthy_services should return only healthy services."""
    from app.services.service_registry import ServiceRegistry, ServiceInstance

    registry = ServiceRegistry()
    registry._services["stt"] = ServiceInstance(
        name="stt", url="http://localhost:8001", status="healthy"
    )
    registry._services["llm"] = ServiceInstance(
        name="llm", url="http://localhost:8002", status="unhealthy"
    )
    registry._services["tts"] = ServiceInstance(
        name="tts", url="http://localhost:8003", status="healthy"
    )

    healthy = registry.get_healthy_services()
    assert len(healthy) == 2
    assert "stt" in healthy
    assert "tts" in healthy
    assert "llm" not in healthy


def test_service_registry_get_all_returns_copy():
    """get_all_services should return a copy, not a reference."""
    from app.services.service_registry import ServiceRegistry, ServiceInstance

    registry = ServiceRegistry()
    registry._services["stt"] = ServiceInstance(name="stt", url="http://localhost:8001")

    copy = registry.get_all_services()
    copy["new"] = ServiceInstance(name="new", url="http://localhost:9999")

    # Original should be unaffected
    assert "new" not in registry._services
