"""Shared utility for cached Gemini endpoints.

Both /api/qa and /api/mythcheck follow the same pattern:
  1. Check cache
  2. Call Gemini
  3. Store in cache
  4. Optionally save to Firestore history (background task)
  5. Return result

This helper centralises that flow so the routers stay thin.
"""

from __future__ import annotations

import logging
from collections.abc import Awaitable, Callable
from typing import TypeVar

from fastapi import BackgroundTasks
from pydantic import BaseModel

from services.cache_service import CacheService
from services.history_service import save_history

logger = logging.getLogger(__name__)

M = TypeVar("M", bound=BaseModel)


async def cached_gemini_call(
    *,
    endpoint: str,
    cache_key: str,
    cache_service: CacheService,
    gemini_fn: Callable[[], Awaitable[M]],
    response_model: type[M],
    user: dict | None,
    background_tasks: BackgroundTasks,
    history_data_fn: Callable[[M], dict] | None = None,
) -> M:
    """Execute a cached Gemini call with optional Firestore history save.

    Args:
        endpoint: Cache namespace (e.g. "qa", "mythcheck").
        cache_key: Normalised string used as the cache lookup key.
        cache_service: Shared CacheService instance.
        gemini_fn: Zero-argument async callable that calls Gemini and returns M.
        response_model: Pydantic model class used to re-validate cached dicts.
        user: Decoded Firebase token dict, or None for anonymous callers.
        background_tasks: FastAPI BackgroundTasks for non-blocking history writes.
        history_data_fn: Optional callable that receives the response and returns
            the dict to persist in Firestore. Omit to skip history saving.
    """
    cached = await cache_service.get(endpoint, cache_key)
    if cached is not None:
        logger.info("Serving cached %s response", endpoint)
        return response_model.model_validate(cached)

    result = await gemini_fn()
    await cache_service.set(endpoint, cache_key, result.model_dump())

    if user and history_data_fn is not None:
        background_tasks.add_task(
            save_history, user["uid"], endpoint, history_data_fn(result)
        )

    return result
