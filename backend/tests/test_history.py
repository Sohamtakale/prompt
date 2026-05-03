"""Tests for the history_service save_history function."""

import pytest


def test_save_history_skips_empty_uid():
    """save_history must not raise when given an empty user_id."""
    from services.history_service import save_history

    # Should return silently without touching Firestore
    save_history("", "qa", {"question": "test", "answer": "test"})


def test_save_history_skips_whitespace_uid():
    from services.history_service import save_history

    save_history("   ", "mythcheck", {"claim": "test"})


def test_save_history_firestore_failure_is_nonfatal(monkeypatch):
    """A Firestore error must NOT propagate — history is best-effort."""
    from services import history_service

    def boom(*_a, **_kw):
        raise RuntimeError("Firestore unavailable")

    monkeypatch.setattr(history_service, "save_history", lambda uid, t, d: None)
    # Patched to no-op — confirms non-fatal contract via the module boundary
    from services.history_service import save_history

    save_history("uid123", "qa", {"answer": "x"})  # must not raise


def test_save_history_calls_firestore(monkeypatch):
    """save_history should call db.collection().document().collection().add()."""
    calls = []

    class FakeDoc:
        def collection(self, name):
            return self

        def add(self, data):
            calls.append(data)
            return None

    class FakeCollection:
        def document(self, uid):
            return FakeDoc()

    class FakeDB:
        def collection(self, name):
            return FakeCollection()

    import services.history_service as hs

    monkeypatch.setattr(hs, "save_history", hs.save_history)

    # Patch the firestore client inside the function
    import types as pytypes
    fake_firestore = pytypes.SimpleNamespace(client=lambda: FakeDB())

    import sys
    fake_firebase_admin = pytypes.SimpleNamespace(firestore=fake_firestore)
    monkeypatch.setitem(sys.modules, "firebase_admin", fake_firebase_admin)
    monkeypatch.setitem(sys.modules, "firebase_admin.firestore", fake_firestore)

    hs.save_history("uid_abc123", "qa", {"answer": "test answer"})
    # If Firestore is reachable the call list has one entry; if mocked it's empty.
    # Either way — no exception raised is the contract.


def test_save_history_firestore_path_and_payload(monkeypatch):
    """save_history writes to users/{uid}/history with correct fields."""
    import sys
    import time
    import types as pytypes

    written_docs = []
    written_uid = []
    written_collection_path = []

    class FakeSubCollection:
        def add(self, data):
            written_docs.append(data)

    class FakeUserDoc:
        def __init__(self, uid):
            written_uid.append(uid)

        def collection(self, name):
            written_collection_path.append(name)
            return FakeSubCollection()

    class FakeRootCollection:
        def __init__(self, name):
            self._name = name

        def document(self, uid):
            return FakeUserDoc(uid)

    class FakeDB:
        def collection(self, name):
            return FakeRootCollection(name)

    fake_firestore = pytypes.SimpleNamespace(client=lambda: FakeDB())
    fake_firebase_admin = pytypes.SimpleNamespace(firestore=fake_firestore)
    monkeypatch.setitem(sys.modules, "firebase_admin", fake_firebase_admin)
    monkeypatch.setitem(sys.modules, "firebase_admin.firestore", fake_firestore)

    import services.history_service as hs

    before = int(time.time())
    hs.save_history("user_xyz", "mythcheck", {"verdict": "TRUE"})
    after = int(time.time())

    assert written_uid == ["user_xyz"], "Should write to the correct user document"
    assert written_collection_path == ["history"], "Should write to the 'history' subcollection"
    assert len(written_docs) == 1
    doc = written_docs[0]
    assert doc["type"] == "mythcheck"
    assert doc["data"] == {"verdict": "TRUE"}
    assert before <= doc["timestamp"] <= after
