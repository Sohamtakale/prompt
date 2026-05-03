"""Q&A router for VoteWise — handles Indian election education questions."""

import logging

from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from models.schemas import QARequest, QAResponse
from services.cache_service import CacheService
from services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Q&A"])

# Service singletons (initialized on first import)
gemini_service = GeminiService()
cache_service = CacheService()

limiter = Limiter(key_func=get_remote_address)


@router.post("/qa", response_model=QAResponse)
@limiter.limit("30/minute")
async def ask_question(request: Request, body: QARequest) -> QAResponse:
    """Answer a question about Indian elections and civic education.

    Uses Gemini 1.5 Flash with caching to reduce API calls.
    Responses are cached for 1 hour.
    """
    try:
        # Check cache first
        cache_key_input = f"{body.question}:{body.context or ''}"
        cached = await cache_service.get("qa", cache_key_input)
        if cached is not None:
            logger.info("Serving cached QA response")
            return QAResponse.model_validate(cached)

        # Call Gemini
        response = await gemini_service.get_answer(body.question, body.context)

        # Cache the response
        await cache_service.set("qa", cache_key_input, response.model_dump())

        return response

    except ValueError as e:
        logger.warning("Input validation error in /qa: %s", str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error in /qa: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred")
