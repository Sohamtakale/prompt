"""VoteWise API — Indian Election Education Assistant.

FastAPI application with Cloud Logging, CORS, rate limiting,
and four main feature routers (QA, Quiz, MythCheck, Translate).
"""

import json
import logging
import os

import firebase_admin
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

# Initialize Firebase Admin
try:
    firebase_admin.initialize_app()
except ValueError:
    # Already initialized
    pass

# Load .env file for local development
load_dotenv()

# ── Cloud Logging setup ─────────────────────────────────────────────────
# On Cloud Run, this auto-integrates with Cloud Monitoring.
# Locally, it falls back to standard Python logging.
try:
    import google.cloud.logging

    client = google.cloud.logging.Client()
    client.setup_logging()
    logging.info("Google Cloud Logging initialized")
except Exception:
    logging.basicConfig(level=logging.INFO)
    logging.info("Using standard Python logging (Cloud Logging not available)")

logger = logging.getLogger(__name__)

# ── Rate Limiter ─────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── FastAPI app ──────────────────────────────────────────────────────────
app = FastAPI(
    title="VoteWise API",
    version="1.0.0",
    description="Indian Election Education Assistant — powered by Gemini 1.5 Flash",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ─────────────────────────────────────────────────────────────────
# Only allow the Firebase Hosting domain (or localhost for dev)
allowed_origins = [
    os.environ.get("FRONTEND_URL", "http://localhost:5173"),
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# ── Routers ──────────────────────────────────────────────────────────────
from routers.mythcheck import router as mythcheck_router  # noqa: E402
from routers.qa import router as qa_router  # noqa: E402
from routers.quiz import router as quiz_router  # noqa: E402
from routers.translate import router as translate_router  # noqa: E402

app.include_router(qa_router)
app.include_router(quiz_router)
app.include_router(mythcheck_router)
app.include_router(translate_router)

# ── Static data endpoints ────────────────────────────────────────────────

def _load_json(filename: str) -> list | dict:
    """Load a JSON data file from the data/ directory."""
    filepath = os.path.join(os.path.dirname(__file__), "data", filename)
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/api/timeline", tags=["Static Data"])
async def get_timeline() -> list:
    """Return the 7-stage election timeline."""
    return _load_json("timeline.json")


@app.get("/api/glossary", tags=["Static Data"])
async def get_glossary() -> list:
    """Return the election glossary (40+ terms)."""
    return _load_json("glossary.json")


@app.get("/api/institutions", tags=["Static Data"])
async def get_institutions() -> list:
    """Return the 6 key electoral institutions."""
    return _load_json("institutions.json")


@app.get("/api/registration-steps", tags=["Static Data"])
async def get_registration_steps() -> list:
    """Return the 5-step voter registration guide."""
    return _load_json("registration_steps.json")


# ── Health check (required for Cloud Run) ────────────────────────────────

@app.get("/health", tags=["Health"])
async def health() -> dict:
    """Health check endpoint for Cloud Run load balancer."""
    return {"status": "ok", "service": "votewise-backend"}
