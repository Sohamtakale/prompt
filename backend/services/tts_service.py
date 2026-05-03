"""Google Cloud Text-to-Speech service for VoteWise."""

import base64
import logging

from services.lru_cache import LRUCache

_cache: LRUCache[str] = LRUCache(max_size=128)


class TTSService:
    """Converts text to speech audio using Google Cloud Text-to-Speech API."""

    def __init__(self) -> None:
        self.logger = logging.getLogger(__name__)
        self._client = None

    def _get_client(self):
        if self._client is None:
            from google.cloud import texttospeech
            self._client = texttospeech.TextToSpeechClient()
            self.logger.info("Google Cloud TTS client initialized")
        return self._client

    def synthesize(self, text: str, language_code: str = "en-IN") -> str:
        """Synthesize text to speech and return base64-encoded MP3 audio.

        Args:
            text: Text to convert (max 1000 chars).
            language_code: BCP-47 language code ('en-IN' or 'hi-IN').

        Returns:
            Base64-encoded MP3 audio string.
        """
        from google.cloud import texttospeech

        truncated = text[:1000]
        cache_key = LRUCache.make_key(language_code, truncated)

        cached = _cache.get(cache_key)
        if cached is not None:
            self.logger.info("TTS cache hit: lang=%s", language_code)
            return cached

        client = self._get_client()
        synthesis_input = texttospeech.SynthesisInput(text=truncated)
        voice = texttospeech.VoiceSelectionParams(
            language_code=language_code,
            ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL,
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=0.9,
        )

        self.logger.info("TTS synthesize: lang=%s chars=%d", language_code, len(truncated))
        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config,
        )

        audio_b64 = base64.b64encode(response.audio_content).decode("utf-8")
        _cache.set(cache_key, audio_b64)
        return audio_b64
