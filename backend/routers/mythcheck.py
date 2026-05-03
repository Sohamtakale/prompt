"""Myth/fact-check router for VoteWise — verifies claims about Indian elections."""

import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from middleware.auth import get_optional_user
from models.schemas import MythCheckRequest, MythCheckResponse
from routers._cached_endpoint import cached_gemini_call
from services.cache_service import CacheService
from services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Myth Check"])

gemini_service = GeminiService()
cache_service = CacheService()

limiter = Limiter(key_func=get_remote_address)


@router.post("/mythcheck", response_model=MythCheckResponse)
@limiter.limit("30/minute")
async def check_myth(
    request: Request,  # noqa: ARG001 — consumed by @limiter.limit decorator
    body: MythCheckRequest,
    background_tasks: BackgroundTasks,
    user: dict | None = Depends(get_optional_user),
) -> MythCheckResponse:
    """Fact-check a claim about Indian elections.

    Uses Gemini with Google Search grounding against ECI rules,
    Indian Constitution, and verified electoral law.
    Responses are cached for 1 hour. Saves to Firestore history when authenticated.
    """
    try:
        cache_key = body.claim.strip().lower()
        return await cached_gemini_call(
            endpoint="mythcheck",
            cache_key=cache_key,
            cache_service=cache_service,
            gemini_fn=lambda: gemini_service.check_myth(body.claim),
            response_model=MythCheckResponse,
            user=user,
            background_tasks=background_tasks,
            history_data_fn=lambda r: {"claim": body.claim, **r.model_dump()},
        )

    except ValueError as e:
        logger.warning("Input validation error in /mythcheck: %s", str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error in /mythcheck: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred")
