"""Myth/fact-check router for VoteWise — verifies claims about Indian elections."""

import logging

from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from models.schemas import MythCheckRequest, MythCheckResponse
from services.cache_service import CacheService
from services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Myth Check"])

gemini_service = GeminiService()
cache_service = CacheService()

limiter = Limiter(key_func=get_remote_address)


@router.post("/mythcheck", response_model=MythCheckResponse)
@limiter.limit("30/minute")
async def check_myth(request: Request, body: MythCheckRequest) -> MythCheckResponse:
    """Fact-check a claim about Indian elections.

    Uses Gemini 1.5 Flash to evaluate claims against ECI rules,
    Indian Constitution, and verified electoral law.
    Responses are cached for 1 hour.
    """
    try:
        # Check cache first
        cached = await cache_service.get("mythcheck", body.claim)
        if cached is not None:
            logger.info("Serving cached myth-check response")
            return MythCheckResponse.model_validate(cached)

        # Call Gemini
        response = await gemini_service.check_myth(body.claim)

        # Cache the response
        await cache_service.set("mythcheck", body.claim, response.model_dump())

        return response

    except ValueError as e:
        logger.warning("Input validation error in /mythcheck: %s", str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error in /mythcheck: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred")
