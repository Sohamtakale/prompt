from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
import logging

security = HTTPBearer()
logger = logging.getLogger(__name__)

async def get_current_user(res: HTTPAuthorizationCredentials = Depends(security)):
    """
    FastAPI dependency to verify Firebase ID token.
    Returns the decoded token (which contains user info).
    """
    token = res.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.error(f"Auth verification failed: {e}")
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_optional_user(request: Request):
    """
    Optional auth dependency. 
    Doesn't raise error if token is missing, just returns None.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    token = auth_header.split(" ")[1]
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception:
        return None
