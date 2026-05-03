"""Chat router for VoteWise — conversational assistant powered by Groq."""

import logging
import os

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Chat"])
limiter = Limiter(key_func=get_remote_address)

SYSTEM_PROMPT = """You are VoteWise, an expert Indian election education assistant.
Your job is to help Indian citizens understand elections, voting rights, electoral processes,
the Election Commission of India (ECI), political parties, voting procedures, and civic duties.

Rules:
- Only answer questions related to Indian elections and civic education.
- Be factual, neutral, and cite ECI guidelines or the Indian Constitution where relevant.
- If asked anything unrelated to Indian elections or civics, politely redirect the user.
- Keep answers concise but informative (2-4 sentences for simple questions, more for complex ones).
- Never express political opinions or favour any party."""


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., min_length=1, max_length=20)


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("30/minute")
async def chat(
    request: Request,  # noqa: ARG001 — consumed by @limiter.limit
    body: ChatRequest,
) -> ChatResponse:
    """Conversational chat endpoint powered by Groq (Llama 3.3 70B).

    Accepts a message history and returns the next assistant reply.
    Scoped to Indian election topics via system prompt.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Chat service not configured")

    try:
        from groq import Groq
        client = Groq(api_key=api_key)

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        messages += [{"role": m.role, "content": m.content} for m in body.messages]

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=512,
            temperature=0.4,
        )

        reply = completion.choices[0].message.content or ""
        return ChatResponse(reply=reply.strip())

    except Exception as e:
        logger.error("Groq chat error: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Chat service unavailable")
