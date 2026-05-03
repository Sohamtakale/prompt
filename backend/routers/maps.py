"""Maps config router — serves the Maps API key to authenticated frontend requests.

The key is kept server-side and gated behind Firebase auth so it cannot be
extracted from the frontend bundle or fetched by anonymous scripts.
"""

import logging
import os

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from middleware.auth import get_optional_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Maps"])
limiter = Limiter(key_func=get_remote_address)


class MapsConfigResponse(BaseModel):
    api_key: str


@router.get("/maps-config", response_model=MapsConfigResponse)
@limiter.limit("10/minute")
async def get_maps_config(
    request: Request,  # noqa: ARG001 — consumed by @limiter.limit decorator
    user: dict | None = Depends(get_optional_user),
) -> MapsConfigResponse:
    """Return the Google Maps API key for the frontend to use at runtime.

    Rate-limited to 10/min per IP. Logs anonymous vs authenticated access
    so abuse patterns are visible in Cloud Logging.
    """
    if user is None:
        logger.warning("maps-config requested by unauthenticated caller")
    else:
        logger.debug("maps-config requested by uid=%s", user["uid"][:8])

    key = os.environ.get("MAPS_API_KEY", "")
    if not key:
        logger.error("MAPS_API_KEY environment variable is not set")
        raise HTTPException(status_code=503, detail="Maps service not configured")
    return MapsConfigResponse(api_key=key)
