"""Tests for the Text-to-Speech endpoint."""

import base64

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch


@pytest.fixture
def client_with_tts(client):
    return client


def make_fake_audio() -> bytes:
    return b"FAKE_MP3_AUDIO_BYTES"


@pytest.fixture(autouse=True)
def mock_tts(monkeypatch):
    """Patch TTSService so no real Google Cloud calls are made."""
    from services.tts_service import TTSService

    def fake_synthesize(self, text: str, language_code: str = "en-IN") -> str:
        return base64.b64encode(make_fake_audio()).decode("utf-8")

    monkeypatch.setattr(TTSService, "synthesize", fake_synthesize)


def test_tts_english(client):
    resp = client.post("/api/tts", json={"text": "Hello India", "language_code": "en-IN"})
    assert resp.status_code == 200
    data = resp.json()
    assert "audio_base64" in data
    assert data["language_code"] == "en-IN"
    # Verify it's valid base64
    decoded = base64.b64decode(data["audio_base64"])
    assert len(decoded) > 0


def test_tts_hindi(client):
    resp = client.post("/api/tts", json={"text": "नमस्ते भारत", "language_code": "hi-IN"})
    assert resp.status_code == 200
    assert resp.json()["language_code"] == "hi-IN"


def test_tts_empty_text_rejected(client):
    resp = client.post("/api/tts", json={"text": "", "language_code": "en-IN"})
    assert resp.status_code == 422


def test_tts_text_too_long_rejected(client):
    resp = client.post("/api/tts", json={"text": "a" * 1001, "language_code": "en-IN"})
    assert resp.status_code == 422


def test_tts_invalid_language_rejected(client):
    resp = client.post("/api/tts", json={"text": "Hello", "language_code": "fr-FR"})
    assert resp.status_code == 422


def test_tts_missing_text_rejected(client):
    resp = client.post("/api/tts", json={"language_code": "en-IN"})
    assert resp.status_code == 422
