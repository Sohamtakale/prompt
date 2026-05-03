"""Gemini 1.5 Flash service for VoteWise AI features.

Handles Q&A, quiz generation, and myth/fact-checking with prompt injection
protection and structured JSON output via Pydantic validation.
"""

import json
import logging
import os
import re
import time

from google import genai
from google.genai import types

from models.schemas import MythCheckResponse, QAResponse, QuizQuestion


class GeminiService:
    """Service for interacting with Gemini 1.5 Flash for election education."""

    INJECTION_PATTERNS: list[str] = [
        "ignore previous",
        "ignore above",
        "system:",
        "jailbreak",
        "forget instructions",
        "new instructions",
        "disregard",
        "you are now",
        "act as",
        "pretend you",
        "override",
        "bypass",
    ]

    def __init__(self) -> None:
        api_key = os.environ["GEMINI_API_KEY"]
        self.client = genai.Client(api_key=api_key)
        self.model_name = "gemini-flash-latest"
        self.logger = logging.getLogger(__name__)

    def _sanitize(self, text: str) -> str:
        """Sanitize user input by stripping HTML tags and checking for injection patterns."""
        # Strip HTML tags
        text = re.sub(r"<[^>]+>", "", text)

        # Check injection patterns (case-insensitive)
        lower = text.lower()
        for pattern in self.INJECTION_PATTERNS:
            if pattern in lower:
                raise ValueError("Invalid input detected")

        return text.strip()

    async def get_answer(self, question: str, context: str | None) -> QAResponse:
        """Generate an answer to an Indian election education question."""
        question = self._sanitize(question)
        if context:
            context = self._sanitize(context)

        start = time.monotonic()

        prompt = f"""You are VoteWise, an Indian election education assistant.
Answer only questions related to Indian elections, voting process,
electoral institutions, and civic education. If asked anything unrelated,
politely redirect. Be factual, neutral, and cite ECI guidelines where relevant.

Context: {context or 'General election question'}
Question: {question}

Respond in JSON: {{"answer": "...", "related_terms": ["term1", "term2"]}}"""

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )

        latency = (time.monotonic() - start) * 1000
        self.logger.info(
            json.dumps(
                {
                    "event": "gemini_call",
                    "endpoint": "qa",
                    "latency_ms": round(latency),
                    "success": True,
                }
            )
        )

        return QAResponse.model_validate_json(response.text)

    async def generate_quiz(self, topic: str, count: int) -> list[QuizQuestion]:
        """Generate multiple-choice quiz questions about an Indian election topic."""
        topic = self._sanitize(topic)

        start = time.monotonic()

        prompt = f"""Generate {count} multiple choice questions about "{topic}"
in the context of Indian elections and civic education.
Each question must have exactly 4 options, one correct answer (0-indexed),
and a brief explanation.

Return a JSON array where each element has:
- "question": string
- "options": array of exactly 4 strings
- "correct_index": integer 0-3
- "explanation": string"""

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )

        latency = (time.monotonic() - start) * 1000
        self.logger.info(
            json.dumps(
                {
                    "event": "gemini_call",
                    "endpoint": "quiz",
                    "latency_ms": round(latency),
                    "success": True,
                }
            )
        )

        data_text = response.text.strip()
        if data_text.startswith("```json"):
            data_text = data_text[7:]
        elif data_text.startswith("```"):
            data_text = data_text[3:]
        if data_text.endswith("```"):
            data_text = data_text[:-3]

        data = json.loads(data_text.strip())
        
        if isinstance(data, dict):
            for key in ["questions", "quiz", "data", "items"]:
                if key in data and isinstance(data[key], list):
                    data = data[key]
                    break

        if not isinstance(data, list):
            data = [data]

        return [QuizQuestion.model_validate(q) for q in data]

    async def check_myth(self, claim: str) -> MythCheckResponse:
        """Fact-check a claim about Indian elections."""
        claim = self._sanitize(claim)

        start = time.monotonic()

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

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )

        latency = (time.monotonic() - start) * 1000
        self.logger.info(
            json.dumps(
                {
                    "event": "gemini_call",
                    "endpoint": "mythcheck",
                    "latency_ms": round(latency),
                    "success": True,
                }
            )
        )

        return MythCheckResponse.model_validate_json(response.text)

