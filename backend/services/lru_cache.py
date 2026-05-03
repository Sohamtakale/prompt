"""Simple in-process LRU cache utility shared across services."""

import hashlib
import threading
from collections import OrderedDict
from typing import Generic, TypeVar

V = TypeVar("V")


class LRUCache(Generic[V]):
    """Thread-safe LRU cache backed by OrderedDict.

    Uses a threading.Lock so it is safe to call from multiple async tasks
    within a single Cloud Run instance. For multi-instance deployments,
    replace with a shared Redis cache.
    """

    def __init__(self, max_size: int) -> None:
        self._store: OrderedDict[str, V] = OrderedDict()
        self._max_size = max_size
        self._lock = threading.Lock()

    @staticmethod
    def make_key(*parts: str) -> str:
        """SHA-256 hash of colon-joined parts — safe for any string content."""
        raw = ":".join(parts)
        return hashlib.sha256(raw.encode()).hexdigest()

    def get(self, key: str) -> V | None:
        with self._lock:
            if key not in self._store:
                return None
            self._store.move_to_end(key)
            return self._store[key]

    def set(self, key: str, value: V) -> None:
        with self._lock:
            self._store[key] = value
            self._store.move_to_end(key)
            if len(self._store) > self._max_size:
                self._store.popitem(last=False)

    def __len__(self) -> int:
        with self._lock:
            return len(self._store)
