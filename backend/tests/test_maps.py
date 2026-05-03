"""Tests for the /api/maps-config endpoint."""

import os


def test_maps_config_returns_key(client, monkeypatch):
    """When MAPS_API_KEY is set, endpoint returns it."""
    monkeypatch.setenv("MAPS_API_KEY", "test-maps-key-abc")
    response = client.get("/api/maps-config")
    assert response.status_code == 200
    data = response.json()
    assert data["api_key"] == "test-maps-key-abc"


def test_maps_config_missing_key_returns_503(client, monkeypatch):
    """When MAPS_API_KEY is not set, endpoint returns 503."""
    monkeypatch.delenv("MAPS_API_KEY", raising=False)
    # Also clear it if it was set via os.environ directly
    os.environ.pop("MAPS_API_KEY", None)
    response = client.get("/api/maps-config")
    assert response.status_code == 503
    assert "Maps service not configured" in response.json()["detail"]


def test_maps_config_response_shape(client, monkeypatch):
    """Response body contains exactly the api_key field."""
    monkeypatch.setenv("MAPS_API_KEY", "test-maps-key-xyz")
    response = client.get("/api/maps-config")
    assert response.status_code == 200
    data = response.json()
    assert set(data.keys()) == {"api_key"}
    assert data["api_key"] == "test-maps-key-xyz"
