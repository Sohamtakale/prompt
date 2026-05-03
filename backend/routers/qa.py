"""Q&A router for VoteWise — handles Indian election education questions."""

import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from middleware.auth import get_optional_user
from models.schemas import QARequest, QAResponse
from routers._cached_endpoint import cached_gemini_call
from services.cache_service import CacheService
from services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Q&A"])

gemini_service = GeminiService()
cache_service = CacheService()

limiter = Limiter(key_func=get_remote_address)


@router.post("/qa", response_model=QAResponse)
@limiter.limit("30/minute")
async def ask_question(
    request: Request,  # noqa: ARG001 — consumed by @limiter.limit decorator
    body: QARequest,
    background_tasks: BackgroundTasks,
    user: dict | None = Depends(get_optional_user),
) -> QAResponse:
    """Answer a question about Indian elections and civic education.

    Uses Gemini with Google Search grounding and caching to reduce API calls.
    Responses are cached for 1 hour. Saves to Firestore history when authenticated.
    """
    try:
        cache_key = f"{body.question.strip().lower()}:{(body.context or '').strip().lower()}"
        return await cached_gemini_call(
            endpoint="qa",
            cache_key=cache_key,
            cache_service=cache_service,
            gemini_fn=lambda: gemini_service.get_answer(body.question, body.context),
            response_model=QAResponse,
            user=user,
            background_tasks=background_tasks,
            history_data_fn=lambda r: {"question": body.question, **r.model_dump()},
        )

    except ValueError as e:
        logger.warning("Input validation error in /qa: %s", str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error in /qa: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred")
