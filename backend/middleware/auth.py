"""Firebase ID token verification middleware for VoteWise."""

import logging

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth

logger = logging.getLogger(__name__)
security = HTTPBearer()


def _verify_token(token: str) -> dict:
    """Verify a Firebase ID token and return the decoded payload."""
    try:
        return auth.verify_id_token(token)
    except Exception as e:
        logger.warning("Token verification failed: %s", type(e).__name__)
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """FastAPI dependency — requires a valid Firebase ID token."""
    return _verify_token(credentials.credentials)


def get_optional_user(request: Request) -> dict | None:
    """FastAPI dependency — returns decoded token or None if absent/invalid."""
    auth_header = request.headers.get("Authorization", "")
    parts = auth_header.split(" ", maxsplit=1)
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1]:
        return None
    try:
        return _verify_token(parts[1])
    except HTTPException:
        return None
