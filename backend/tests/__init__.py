"""Shared test fixtures for VoteWise backend tests."""

import os
import sys

import pytest
from fastapi.testclient import TestClient

# Ensure the backend directory is on the path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Set a dummy API key for tests (never calls real API)
os.environ.setdefault("GEMINI_API_KEY", "test-key-not-real")


from models.schemas import MythCheckResponse, QAResponse, QuizQuestion
from services.gemini_service import GeminiService


@pytest.fixture
def mock_gemini(monkeypatch):
    """Patches GeminiService so no real API calls are made in tests."""

    async def fake_answer(self, question, context):
        return QAResponse(
            answer="Test answer about Indian elections.",
            related_terms=["EVM", "ECI"],
        )

    async def fake_quiz(self, topic, count):
        return [
            QuizQuestion(
                question="What does EVM stand for?",
                options=[
                    "Electronic Voting Machine",
                    "Electoral Vote Monitor",
                    "Election Verification Method",
                    "Electronic Vote Meter",
                ],
                correct_index=0,
                explanation="EVM stands for Electronic Voting Machine, used since 1999.",
            )
        ] * count

    async def fake_myth(self, claim):
        return MythCheckResponse(
            verdict="TRUE",
            explanation="Test explanation citing ECI guidelines.",
            confidence=0.95,
            source_hint="ECI Handbook 2024",
        )

    monkeypatch.setattr(GeminiService, "get_answer", fake_answer)
    monkeypatch.setattr(GeminiService, "generate_quiz", fake_quiz)
    monkeypatch.setattr(GeminiService, "check_myth", fake_myth)


@pytest.fixture
def client():
    """Create a FastAPI TestClient for the VoteWise app."""
    from main import app

    return TestClient(app)
