"""VoteWise API — Indian Election Education Assistant.

FastAPI application with Cloud Logging, CORS, rate limiting,
and four main feature routers (QA, Quiz, MythCheck, Translate).
"""

import json
import logging
import os
import time

import firebase_admin
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

# Load .env file for local development (no-op on Cloud Run)
load_dotenv()

# ── Cloud Logging setup ──────────────────────────────────────────────────────
# On Cloud Run, setup_logging() routes Python logging → Cloud Logging with
# automatic severity mapping (INFO → INFO, WARNING → WARNING, etc.).
# Locally it falls back gracefully to standard Python logging.
_cloud_logging_active = False
try:
    import google.cloud.logging
    _cl_client = google.cloud.logging.Client()
    _cl_client.setup_logging(log_level=logging.DEBUG)
    _cloud_logging_active = True
    logging.info("Google Cloud Logging initialized")
except Exception:
    logging.basicConfig(
        level=logging.INFO,
        format='{"severity":"%(levelname)s","message":"%(message)s","logger":"%(name)s"}',
    )
    logging.info("Using structured local logging (Cloud Logging not available)")

logger = logging.getLogger(__name__)

# ── Firebase Admin ────────────────────────────────────────────────────────────
# Fail fast: a misconfigured Firebase should surface at startup, not mid-request.
try:
    firebase_admin.initialize_app()
    logger.info("Firebase Admin initialized")
except ValueError:
    pass  # already initialized (e.g. during test reload)
except Exception as exc:
    logger.critical(
        "Firebase Admin failed to initialize: %s — check GOOGLE_APPLICATION_CREDENTIALS", exc
    )
    raise

# ── Rate Limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="VoteWise API",
    version="1.0.0",
    description="Indian Election Education Assistant — powered by Gemini 1.5 Flash",
)
app.state.limiter = limiter
app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(_request: Request, _exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        headers={"Retry-After": "60"},
        content={"detail": "Rate limit exceeded. Please try again in 60 seconds."},
    )


# ── Request logging middleware ────────────────────────────────────────────────
# Emits a structured log entry per request with method, path, status, and latency.
# These appear as individual log entries in Cloud Logging with correct severity.
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.monotonic()
    response = await call_next(request)
    latency_ms = round((time.monotonic() - start) * 1000)

    # Skip health-check spam from the load balancer
    if request.url.path != "/health":
        log_data = {
            "event": "http_request",
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "latency_ms": latency_ms,
        }
        level = logging.WARNING if response.status_code >= 400 else logging.INFO
        logger.log(level, json.dumps(log_data))

    return response


# ── CORS ──────────────────────────────────────────────────────────────────────
# Only allow the Firebase Hosting domain (or localhost for dev)
allowed_origins = [
    os.environ.get("FRONTEND_URL", "http://localhost:5173"),
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
from routers.chat import router as chat_router  # noqa: E402
from routers.maps import router as maps_router  # noqa: E402
from routers.mythcheck import router as mythcheck_router  # noqa: E402
from routers.qa import router as qa_router  # noqa: E402
from routers.quiz import router as quiz_router  # noqa: E402
from routers.translate import router as translate_router  # noqa: E402
from routers.tts import router as tts_router  # noqa: E402

app.include_router(qa_router)
app.include_router(quiz_router)
app.include_router(mythcheck_router)
app.include_router(translate_router)
app.include_router(tts_router)
app.include_router(maps_router)
app.include_router(chat_router)

# ── Static data — loaded once at startup, served from memory ─────────────────

_DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def _load_json(filename: str) -> list | dict:
    filepath = os.path.join(_DATA_DIR, filename)
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        logger.error("Static data file not found: %s", filename)
        return []
    except json.JSONDecodeError as e:
        logger.error("Malformed JSON in %s: %s", filename, e)
        return []


# Load all static datasets once at import time
_TIMELINE = _load_json("timeline.json")
_GLOSSARY = _load_json("glossary.json")
_INSTITUTIONS = _load_json("institutions.json")
_REGISTRATION = _load_json("registration_steps.json")


@app.get("/api/timeline", tags=["Static Data"])
async def get_timeline() -> list:
    """Return the 7-stage election timeline."""
    return _TIMELINE


@app.get("/api/glossary", tags=["Static Data"])
async def get_glossary() -> list:
    """Return the election glossary (40+ terms)."""
    return _GLOSSARY


@app.get("/api/institutions", tags=["Static Data"])
async def get_institutions() -> list:
    """Return the 6 key electoral institutions."""
    return _INSTITUTIONS


@app.get("/api/registration-steps", tags=["Static Data"])
async def get_registration_steps() -> list:
    """Return the 5-step voter registration guide."""
    return _REGISTRATION


# ── Cache stats (internal monitoring) ────────────────────────────────────────

@app.get("/api/cache-stats", tags=["Internal"], include_in_schema=False)
async def cache_stats() -> dict:
    """Internal endpoint — returns cache hit/miss stats for monitoring."""
    from routers.qa import cache_service as qa_cache
    from routers.mythcheck import cache_service as myth_cache
    return {
        "qa": qa_cache.stats(),
        "mythcheck": myth_cache.stats(),
    }


# ── Health check (required for Cloud Run) ────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health() -> dict:
    """Health check endpoint for Cloud Run load balancer."""
    return {"status": "ok", "service": "votewise-backend"}
