"""Firestore history service — saves user activity via Firebase Admin SDK."""

import logging
import time

logger = logging.getLogger(__name__)


def save_history(user_id: str, entry_type: str, data: dict) -> None:
    """Persist a history entry to Firestore under users/{uid}/history.

    Args:
        user_id: Firebase UID of the authenticated user (verified at router level).
        entry_type: 'qa' or 'mythcheck'.
        data: Response payload dict to store.
    """
    if not user_id or not user_id.strip():
        logger.warning("save_history called with empty user_id — skipping")
        return

    try:
        from firebase_admin import firestore
        db = firestore.client()
        db.collection("users").document(user_id).collection("history").add({
            "type": entry_type,
            "data": data,
            "timestamp": int(time.time()),
        })
        logger.info("Saved history entry type=%s uid=%s", entry_type, user_id[:8])
    except Exception as e:
        # Non-fatal — history save failure must not block the API response
        logger.warning("Failed to save history for uid=%s: %s", user_id[:8], str(e))
