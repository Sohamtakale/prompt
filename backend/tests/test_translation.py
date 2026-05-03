"""Tests for the Translation router and TranslationService."""

import pytest


@pytest.fixture(autouse=True)
def mock_translation(monkeypatch):
    """Patch TranslationService so no real Google Cloud calls are made."""
    from models.schemas import TranslateResponse
    from services.translation_service import TranslationService

    def fake_translate(self, text: str, target: str) -> TranslateResponse:
        return TranslateResponse(
            translated_text=f"[{target}] {text}",
            detected_source="en" if target == "hi" else "hi",
        )

    monkeypatch.setattr(TranslationService, "translate_text", fake_translate)


def test_translate_to_hindi(client):
    r = client.post("/api/translate", json={"text": "Hello", "target_lang": "hi"})
    assert r.status_code == 200
    data = r.json()
    assert "translated_text" in data
    assert "detected_source" in data
    assert data["translated_text"] != ""


def test_translate_to_english(client):
    r = client.post("/api/translate", json={"text": "नमस्ते", "target_lang": "en"})
    assert r.status_code == 200
    assert r.json()["detected_source"] != ""


def test_translate_invalid_language(client):
    r = client.post("/api/translate", json={"text": "Hello", "target_lang": "fr"})
    assert r.status_code == 422


def test_translate_empty_text(client):
    """Empty string passes schema validation (no min_length) but returns translated empty."""
    r = client.post("/api/translate", json={"text": "", "target_lang": "hi"})
    # Schema allows empty string — service handles it
    assert r.status_code in (200, 400)


def test_translate_too_long(client):
    r = client.post("/api/translate", json={"text": "x" * 1001, "target_lang": "hi"})
    assert r.status_code == 422


def test_translate_missing_target_lang(client):
    r = client.post("/api/translate", json={"text": "Hello"})
    assert r.status_code == 422


def test_translate_response_structure(client):
    r = client.post("/api/translate", json={"text": "What is ECI?", "target_lang": "hi"})
    assert r.status_code == 200
    data = r.json()
    assert set(data.keys()) == {"translated_text", "detected_source"}
    assert isinstance(data["translated_text"], str)
    assert isinstance(data["detected_source"], str)
