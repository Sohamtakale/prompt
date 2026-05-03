"""Gemini service for VoteWise AI features.

Handles Q&A, quiz generation, and myth/fact-checking with prompt injection
protection and structured JSON output via Pydantic validation.
"""

import html
import json
import logging
import os
import re
import time
import unicodedata

from google import genai
from google.genai import types

from models.schemas import MythCheckResponse, QAResponse, QuizQuestion

_GOOGLE_SEARCH_TOOL = types.Tool(google_search=types.GoogleSearch())
_CODE_FENCE_PREFIXES = ("```json", "```")

# Compiled once: matches zero-width separators and lookalike unicode spaces
_ZERO_WIDTH_RE = re.compile(r"[​-‏‪-‮⁠-⁤﻿]")


class GeminiService:
    """Service for interacting with Gemini for election education."""

    # Patterns checked after unicode normalization to catch obfuscation attempts
    INJECTION_PATTERNS: list[str] = [
        "ignore previous",
        "ignore above",
        "ignore all",
        "system:",
        "system prompt",
        "jailbreak",
        "forget instructions",
        "forget all",
        "new instructions",
        "disregard",
        "you are now",
        "act as",
        "pretend you",
        "pretend to be",
        "override",
        "bypass",
        "developer mode",
        "dan mode",
        "do anything now",
        "prompt injection",
        "</system>",
        "<|im_start|>",
        "<|im_end|>",
    ]

    def __init__(self) -> None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY environment variable is not set")
        self.client = genai.Client(api_key=api_key)
        self.model_name = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash-001")
        self.logger = logging.getLogger(__name__)

    # ── Internal helpers ─────────────────────────────────────────────────

    def _extract_sources(self, response: object) -> list[str]:
        """Extract grounding source URIs from a Gemini response, if present."""
        try:
            chunks = (
                response.candidates[0]  # type: ignore[union-attr]
                .grounding_metadata.grounding_chunks
            )
            return [
                c.web.uri
                for c in chunks
                if hasattr(c, "web") and c.web and c.web.uri
            ]
        except Exception:
            return []

    def _sanitize(self, text: str) -> str:
        """Strip HTML, normalize unicode, reject prompt injection patterns."""
        # Unescape HTML entities, then strip tags
        text = html.unescape(text)
        text = re.sub(r"<[^>]+>", "", text)
        # Remove zero-width / invisible separators used to evade pattern matching
        text = _ZERO_WIDTH_RE.sub("", text)
        # NFKC collapses lookalike characters (e.g. ｉｇｎｏｒｅ → ignore)
        normalized = unicodedata.normalize("NFKC", text).lower()
        # Collapse all whitespace variants so "i g n o r e" won't slip through
        normalized = re.sub(r"\s+", " ", normalized)
        for pattern in self.INJECTION_PATTERNS:
            if pattern in normalized:
                raise ValueError("Invalid input detected")
        return text.strip()

    def _call_gemini(
        self,
        prompt: str,
        endpoint: str,
        use_grounding: bool = False,
    ) -> object:
        """Send a prompt to Gemini and log latency. Returns the raw response."""
        start = time.monotonic()
        config = types.GenerateContentConfig(
            tools=[_GOOGLE_SEARCH_TOOL] if use_grounding else [],
            response_mime_type="application/json",
        )
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=config,
        )
        latency = (time.monotonic() - start) * 1000
        self.logger.info(
            json.dumps({
                "event": "gemini_call",
                "endpoint": endpoint,
                "latency_ms": round(latency),
                "success": True,
            })
        )
        return response

    @staticmethod
    def _strip_code_fence(text: str) -> str:
        """Remove markdown code fences that Gemini sometimes wraps JSON in."""
        text = text.strip()
        for prefix in _CODE_FENCE_PREFIXES:
            if text.startswith(prefix):
                text = text[len(prefix):]
                break
        if text.endswith("```"):
            text = text[:-3]
        return text.strip()

    # ── Public API ───────────────────────────────────────────────────────

    async def get_answer(self, question: str, context: str | None) -> QAResponse:
        """Generate an answer to an Indian election education question."""
        question = self._sanitize(question)
        if context:
            context = self._sanitize(context)

        prompt = f"""You are VoteWise, an Indian election education assistant.
Answer only questions related to Indian elections, voting process,
electoral institutions, and civic education. If asked anything unrelated,
politely redirect. Be factual, neutral, and cite ECI guidelines where relevant.

Context: {context or 'General election question'}
Question: {question}

Respond in JSON: {{"answer": "...", "related_terms": ["term1", "term2"]}}"""

        response = self._call_gemini(prompt, "qa", use_grounding=True)
        result = QAResponse.model_validate_json(response.text)  # type: ignore[union-attr]
        result.grounding_sources = self._extract_sources(response)
        return result

    async def generate_quiz(self, topic: str, count: int) -> list[QuizQuestion]:
        """Generate multiple-choice quiz questions about an Indian election topic."""
        topic = self._sanitize(topic)

        prompt = f"""Generate {count} multiple choice questions about "{topic}"
in the context of Indian elections and civic education.
Each question must have exactly 4 options, one correct answer (0-indexed),
and a brief explanation.

Return a JSON array where each element has:
- "question": string
- "options": array of exactly 4 strings
- "correct_index": integer 0-3
- "explanation": string"""

        response = self._call_gemini(prompt, "quiz", use_grounding=True)
        data_text = self._strip_code_fence(response.text)  # type: ignore[union-attr]
        data = json.loads(data_text)

        if isinstance(data, dict):
            for key in ("questions", "quiz", "data", "items"):
                if key in data and isinstance(data[key], list):
                    data = data[key]
                    break

        if not isinstance(data, list):
            data = [data]

        return [QuizQuestion.model_validate(q) for q in data]

    async def check_myth(self, claim: str) -> MythCheckResponse:
        """Fact-check a claim about Indian elections."""
        claim = self._sanitize(claim)

        prompt = f"""You are a fact-checker for Indian election information.
Evaluate this claim strictly based on ECI rules, Indian Constitution,
and verified electoral law. Do not express political opinions.

Claim: "{claim}"

Return JSON with:
- "verdict": one of "TRUE", "FALSE", "PARTIALLY TRUE", "UNVERIFIABLE"
- "explanation": factual explanation citing relevant law or ECI rule (max 150 words)
- "confidence": float 0.0-1.0
- "source_hint": the most relevant official source (e.g. "ECI Handbook 2024",
  "Representation of the People Act 1951", "Article 324 of Constitution")"""

        response = self._call_gemini(prompt, "mythcheck", use_grounding=True)
        result = MythCheckResponse.model_validate_json(response.text)  # type: ignore[union-attr]
        result.grounding_sources = self._extract_sources(response)
        return result
