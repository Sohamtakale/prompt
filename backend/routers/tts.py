"""Text-to-Speech router for VoteWise — converts election content to audio."""

import logging
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

from middleware.auth import get_optional_user
from services.tts_service import TTSService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Text-to-Speech"])

tts_service = TTSService()
limiter = Limiter(key_func=get_remote_address)


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    language_code: Literal["en-IN", "hi-IN"] = "en-IN"


class TTSResponse(BaseModel):
    audio_base64: str
    language_code: str


@router.post("/tts", response_model=TTSResponse)
@limiter.limit("20/minute")
async def text_to_speech(
    request: Request,  # noqa: ARG001 — consumed by @limiter.limit decorator
    body: TTSRequest,
    user: dict | None = Depends(get_optional_user),
) -> TTSResponse:
    """Convert text to speech audio using Google Cloud TTS.

    Returns base64-encoded MP3 audio for playback in the browser.
    Authenticated users get full access; anonymous users are rate-limited more strictly.
    """
    if user is None:
        logger.debug("TTS request from unauthenticated user")

    try:
        audio_b64 = tts_service.synthesize(body.text, body.language_code)
        return TTSResponse(audio_base64=audio_b64, language_code=body.language_code)
    except Exception as e:
        logger.error("TTS error: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Text-to-speech service unavailable")
