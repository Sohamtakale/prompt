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
        """Generate a SHA-256 cache key from endpoint and input.

        Args:
            endpoint: The API endpoint name (e.g., "qa", "mythcheck").
            input_text: The user input string.

        Returns:
            A hex-encoded SHA-256 hash string.
        """
        raw = f"{endpoint}:{input_text}"
        return hashlib.sha256(raw.encode()).hexdigest()

    async def get(self, endpoint: str, input_text: str) -> Any | None:
        """Retrieve a cached value if it exists and hasn't expired.

        Args:
            endpoint: The API endpoint name.
            input_text: The user input string.

        Returns:
            The cached value, or None if not found or expired.
        """
        key = self._make_key(endpoint, input_text)
        async with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                self._misses += 1
                self.logger.debug("Cache MISS for key=%s endpoint=%s", key[:12], endpoint)
                return None

            if time.monotonic() - entry["timestamp"] > self._ttl:
                # Entry has expired — remove it
                del self._cache[key]
                self._misses += 1
                self.logger.debug(
                    "Cache EXPIRED for key=%s endpoint=%s", key[:12], endpoint
                )
                return None

            self._hits += 1
            self.logger.debug("Cache HIT for key=%s endpoint=%s", key[:12], endpoint)

            # Move to end for LRU ordering (most recently used)
            self._cache.move_to_end(key)  # type: ignore[attr-defined]
            return entry["value"]

    async def set(self, endpoint: str, input_text: str, value: Any) -> None:
        """Store a value in the cache with current timestamp.

        If the cache is at max capacity, the least recently used entry
        is evicted before inserting.

        Args:
            endpoint: The API endpoint name.
            input_text: The user input string.
            value: The value to cache (typically a Pydantic model dict).
        """
        key = self._make_key(endpoint, input_text)
        async with self._lock:
            # Evict LRU entry if at capacity
            if len(self._cache) >= self._max_size and key not in self._cache:
                oldest_key = next(iter(self._cache))
                del self._cache[oldest_key]
                self.logger.debug("Cache EVICT oldest key=%s", oldest_key[:12])

            self._cache[key] = {
                "value": value,
                "timestamp": time.monotonic(),
            }
            # Move to end for LRU ordering
            if hasattr(self._cache, "move_to_end"):
                self._cache.move_to_end(key)  # type: ignore[attr-defined]
            self.logger.debug("Cache SET key=%s endpoint=%s", key[:12], endpoint)

    async def invalidate(self, endpoint: str, input_text: str) -> bool:
        """Remove a specific entry from the cache.

        Args:
            endpoint: The API endpoint name.
            input_text: The user input string.

        Returns:
            True if the entry was found and removed, False otherwise.
        """
        key = self._make_key(endpoint, input_text)
        async with self._lock:
            if key in self._cache:
                del self._cache[key]
                self.logger.debug("Cache INVALIDATE key=%s", key[:12])
                return True
            return False

    def stats(self) -> dict[str, int]:
        """Return cache performance statistics.

        Returns:
            Dictionary with hits, misses, and current size.
        """
        return {
            "hits": self._hits,
            "misses": self._misses,
            "size": len(self._cache),
        }
