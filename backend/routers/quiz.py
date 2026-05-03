"""Quiz router for VoteWise — generates multiple-choice election quizzes."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from middleware.auth import get_optional_user
from models.schemas import QuizQuestion, QuizRequest
from services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Quiz"])

gemini_service = GeminiService()

limiter = Limiter(key_func=get_remote_address)


@router.post("/quiz", response_model=list[QuizQuestion])
@limiter.limit("30/minute")
async def generate_quiz(
    request: Request,  # noqa: ARG001 — consumed by @limiter.limit decorator
    body: QuizRequest,
    user: dict | None = Depends(get_optional_user),
) -> list[QuizQuestion]:
    """Generate multiple-choice quiz questions about an Indian election topic.

    Quiz responses are NEVER cached — each request generates fresh questions
    for variety and educational value.
    """
    try:
        questions = await gemini_service.generate_quiz(body.topic, body.count)
        if user:
            logger.info("Quiz generated for uid=%s topic=%r", user["uid"][:8], body.topic)
        return questions

    except ValueError as e:
        logger.warning("Input validation error in /quiz: %s", str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error in /quiz: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred")
