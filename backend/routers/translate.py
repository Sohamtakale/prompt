"""Translation router for VoteWise — English ↔ Hindi translation."""

import logging

from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from models.schemas import TranslateRequest, TranslateResponse
from services.translation_service import TranslationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Translation"])

translation_service = TranslationService()

limiter = Limiter(key_func=get_remote_address)


@router.post("/translate", response_model=TranslateResponse)
@limiter.limit("30/minute")
async def translate_text(
    request: Request, body: TranslateRequest
) -> TranslateResponse:
    """Translate text between English and Hindi.

    Uses Google Cloud Translation API with Application Default Credentials.
    """
    try:
        return translation_service.translate_text(body.text, body.target_lang)

    except ValueError as e:
        logger.warning("Input validation error in /translate: %s", str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error in /translate: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Translation service is currently unavailable",
        )
