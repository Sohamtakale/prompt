"""Tests for the Quiz router."""


def test_quiz_returns_correct_count(client, mock_gemini):
    """Test that the quiz returns the requested number of questions."""
    r = client.post("/api/quiz", json={"topic": "ECI", "count": 4})
    assert r.status_code == 200
    assert len(r.json()) == 4


def test_quiz_default_count(client, mock_gemini):
    """Test that the default count of 4 is used when count is not provided."""
    r = client.post("/api/quiz", json={"topic": "Voting process"})
    assert r.status_code == 200
    assert len(r.json()) == 4


def test_quiz_schema_valid(client, mock_gemini):
    """Test that each quiz question has the correct schema."""
    r = client.post("/api/quiz", json={"topic": "Voting process", "count": 2})
    assert r.status_code == 200
    for q in r.json():
        assert "question" in q
        assert len(q["options"]) == 4
        assert 0 <= q["correct_index"] <= 3
        assert "explanation" in q


def test_quiz_invalid_count_too_high(client):
    """Test that a count exceeding 8 is rejected with 422."""
    r = client.post("/api/quiz", json={"topic": "ECI", "count": 99})
    assert r.status_code == 422


def test_quiz_invalid_count_zero(client):
    """Test that a count of 0 is rejected with 422."""
    r = client.post("/api/quiz", json={"topic": "ECI", "count": 0})
    assert r.status_code == 422


def test_quiz_empty_topic(client):
    """Test that an empty topic is rejected with 422."""
    r = client.post("/api/quiz", json={"topic": "", "count": 4})
    assert r.status_code == 422
