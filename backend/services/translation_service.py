"""Google Cloud Translation API service for VoteWise.

Provides English ↔ Hindi translation using Cloud Translation v2.
Uses Application Default Credentials on Cloud Run.
"""

import logging
import os

from models.schemas import TranslateResponse


class TranslationService:
    """Service for translating text between English and Hindi using Google Cloud Translation API."""

    def __init__(self) -> None:
        self.logger = logging.getLogger(__name__)
        self._client = None

    def _get_client(self):
        """Lazy-load the translation client to allow graceful degradation."""
        if self._client is None:
            try:
                from google.cloud import translate_v2 as translate

                self._client = translate.Client()
                self.logger.info("Google Cloud Translation client initialized")
            except Exception as e:
                self.logger.warning(
                    "Failed to initialize Translation client: %s. "
                    "Translation features will be unavailable.",
                    str(e),
                )
                raise
        return self._client

    def translate_text(self, text: str, target: str) -> TranslateResponse:
        """Translate text to the target language.

        Args:
            text: The text to translate.
            target: Target language code ('hi' for Hindi, 'en' for English).

        Returns:
            TranslateResponse with translated text and detected source language.

        Raises:
            RuntimeError: If the translation client is not available.
        """
        client = self._get_client()

        self.logger.info(
            "Translating text (length=%d) to target=%s",
            len(text),
            target,
        )

        result = client.translate(text, target_language=target)

        return TranslateResponse(
            translated_text=result["translatedText"],
            detected_source=result["detectedSourceLanguage"],
        )
