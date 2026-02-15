"""Conftest for backend tests.

These tests use FastAPI's TestClient to test HTTP endpoints
without needing actual service instances running.
"""
import sys
import os

# Add service paths so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'api-gateway'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'stt-service'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'llm-service'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'tts-service'))
