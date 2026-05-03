"""LRU cache with TTL for VoteWise API responses.

Caches QA and myth-check responses to reduce Gemini API calls.
Quiz responses are never cached (always fresh).
"""

import asyncio
import hashlib
import logging
import time
from typing import Any


class CacheService:
    """In-memory LRU cache with time-to-live expiration.

    Attributes:
        ttl: Time-to-live in seconds for cache entries (default: 3600).
        max_size: Maximum number of entries in the cache (default: 256).
    """

    def __init__(self, ttl: int = 3600, max_size: int = 256) -> None:
        self._cache: dict[str, dict[str, Any]] = {}
        self._ttl = ttl
        self._max_size = max_size
        self._hits = 0
        self._misses = 0
        self._lock = asyncio.Lock()
        self.logger = logging.getLogger(__name__)

    @staticmethod
    def _make_key(endpoint: str, input_text: str) -> str:
        """Generate a SHA-256 cache key from endpoint and input."""
        raw = f"{endpoint}:{input_text}"
        return hashlib.sha256(raw.encode()).hexdigest()

    async def get(self, endpoint: str, input_text: str) -> Any | None:
        """Retrieve a cached value if it exists and hasn't expired."""
        key = self._make_key(endpoint, input_text)
        async with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                self._misses += 1
                return None

            if time.monotonic() - entry["timestamp"] > self._ttl:
                del self._cache[key]
                self._misses += 1
                return None

            self._hits += 1
            # Move to end (most recently used)
            val = self._cache.pop(key)
            self._cache[key] = val
            return val["value"]

    async def set(self, endpoint: str, input_text: str, value: Any) -> None:
        """Store a value in the cache with current timestamp."""
        key = self._make_key(endpoint, input_text)
        async with self._lock:
            # If key exists, pop it so it's re-inserted at the end
            if key in self._cache:
                self._cache.pop(key)
            elif len(self._cache) >= self._max_size:
                # Evict LRU entry (first key in dict)
                oldest_key = next(iter(self._cache))
                del self._cache[oldest_key]

            self._cache[key] = {
                "value": value,
                "timestamp": time.monotonic(),
            }

    async def invalidate(self, endpoint: str, input_text: str) -> bool:
        """Remove a specific entry from the cache."""
        key = self._make_key(endpoint, input_text)
        async with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False

    def stats(self) -> dict[str, int]:
        """Return cache performance statistics."""
        return {
            "hits": self._hits,
            "misses": self._misses,
            "size": len(self._cache),
        }

