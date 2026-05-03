"""Tests for the CacheService."""

import pytest

from services.cache_service import CacheService


@pytest.fixture
def cache():
    """Create a fresh CacheService instance for each test."""
    return CacheService(ttl=3600, max_size=10)


@pytest.mark.asyncio
async def test_cache_set_and_get(cache):
    """Test that a cached value can be retrieved."""
    await cache.set("qa", "test-input", {"answer": "test"})
    result = await cache.get("qa", "test-input")
    assert result == {"answer": "test"}


@pytest.mark.asyncio
async def test_cache_miss_returns_none(cache):
    """Test that a cache miss returns None."""
    result = await cache.get("qa", "nonexistent")
    assert result is None


@pytest.mark.asyncio
async def test_cache_stats(cache):
    """Test that cache stats track hits and misses correctly."""
    await cache.set("qa", "input1", {"answer": "a"})
    await cache.get("qa", "input1")  # hit
    await cache.get("qa", "input2")  # miss

    stats = cache.stats()
    assert stats["hits"] == 1
    assert stats["misses"] == 1
    assert stats["size"] == 1


@pytest.mark.asyncio
async def test_cache_invalidate(cache):
    """Test that invalidating a key removes it from cache."""
    await cache.set("qa", "input1", {"answer": "a"})
    removed = await cache.invalidate("qa", "input1")
    assert removed is True

    result = await cache.get("qa", "input1")
    assert result is None


@pytest.mark.asyncio
async def test_cache_invalidate_nonexistent(cache):
    """Test that invalidating a nonexistent key returns False."""
    removed = await cache.invalidate("qa", "nonexistent")
    assert removed is False


@pytest.mark.asyncio
async def test_cache_eviction(cache):
    """Test that LRU eviction works when cache is full."""
    # Fill the cache (max_size=10)
    for i in range(10):
        await cache.set("qa", f"input-{i}", {"answer": f"answer-{i}"})

    # Add one more — should evict the first
    await cache.set("qa", "input-new", {"answer": "new"})

    # First entry should be evicted
    result = await cache.get("qa", "input-0")
    assert result is None

    # New entry should be present
    result = await cache.get("qa", "input-new")
    assert result == {"answer": "new"}


def test_cache_hit_skips_gemini(client, mock_gemini, mocker):
    """Test that a repeated identical QA request is served from cache.

    The second call should NOT invoke GeminiService.get_answer again.
    """
    from services.gemini_service import GeminiService

    spy = mocker.spy(GeminiService, "get_answer")
    payload = {"question": "What is VVPAT?"}

    r1 = client.post("/api/qa", json=payload)
    assert r1.status_code == 200

    r2 = client.post("/api/qa", json=payload)
    assert r2.status_code == 200

    # Second call should be served from cache
    assert spy.call_count == 1
