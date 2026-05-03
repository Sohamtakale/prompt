"""Pydantic v2 models for VoteWise API request/response validation."""

from typing import Literal

from pydantic import BaseModel, Field, AliasChoices


class QARequest(BaseModel):
    """Request model for the Q&A endpoint."""

    question: str = Field(..., min_length=3, max_length=500)
    context: str | None = Field(None, max_length=200)


class QAResponse(BaseModel):
    """Response model for the Q&A endpoint."""

    answer: str
    related_terms: list[str]


class QuizRequest(BaseModel):
    """Request model for the quiz generation endpoint."""

    topic: str = Field(..., min_length=3, max_length=100)
    count: int = Field(default=4, ge=1, le=8)


class QuizQuestion(BaseModel):
    """A single quiz question with multiple-choice options."""

    question: str
    options: list[str] = Field(..., min_length=2, max_length=6)
    correct_index: int = Field(..., ge=0, le=5, validation_alias=AliasChoices('correct_index', 'correctIndex'))
    explanation: str


class MythCheckRequest(BaseModel):
    """Request model for the myth/fact-check endpoint."""

    claim: str = Field(..., min_length=5, max_length=500)


class MythCheckResponse(BaseModel):
    """Response model for the myth/fact-check endpoint."""

    verdict: Literal["TRUE", "FALSE", "PARTIALLY TRUE", "UNVERIFIABLE"]
    explanation: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    source_hint: str


class TranslateRequest(BaseModel):
    """Request model for the translation endpoint."""

    text: str = Field(..., max_length=1000)
    target_lang: Literal["hi", "en"]


class TranslateResponse(BaseModel):
    """Response model for the translation endpoint."""

    translated_text: str
    detected_source: str
