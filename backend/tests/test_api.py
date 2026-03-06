"""
Integration tests for the FastAPI routes.
Uses FastAPI's TestClient to make real HTTP requests against the app
with all RAG dependencies mocked out.
"""
from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


# --- /api/health ---

def test_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


# --- /api/ingest/text ---

@patch("app.api.routes.ingest_text")
def test_ingest_text_success(mock_ingest):
    mock_ingest.return_value = {"status": "ok", "title": "My Note", "chunks": 3}

    resp = client.post("/api/ingest/text", json={
        "text": "Some content",
        "title": "My Note",
        "tags": ["python"]
    })

    assert resp.status_code == 200
    assert resp.json()["chunks"] == 3
    mock_ingest.assert_called_once_with("Some content", "My Note", ["python"])


@patch("app.api.routes.ingest_text")
def test_ingest_text_missing_title_returns_422(mock_ingest):
    resp = client.post("/api/ingest/text", json={"text": "Some content"})
    assert resp.status_code == 422


@patch("app.api.routes.ingest_text")
def test_ingest_text_propagates_error(mock_ingest):
    mock_ingest.side_effect = Exception("embedding failed")
    resp = client.post("/api/ingest/text", json={"text": "x", "title": "y"})
    assert resp.status_code == 500
    assert "embedding failed" in resp.json()["detail"]


# --- /api/ingest/url ---

@patch("app.api.routes.ingest_url")
def test_ingest_url_success(mock_ingest):
    mock_ingest.return_value = {"status": "ok", "title": "Example", "chunks": 5}

    resp = client.post("/api/ingest/url", json={"url": "https://example.com"})

    assert resp.status_code == 200
    assert resp.json()["title"] == "Example"


@patch("app.api.routes.ingest_url")
def test_ingest_url_missing_url_returns_422(mock_ingest):
    resp = client.post("/api/ingest/url", json={})
    assert resp.status_code == 422


# --- /api/ingest/file ---

@patch("app.api.routes.ingest_file")
def test_ingest_file_txt(mock_ingest):
    mock_ingest.return_value = {"status": "ok", "title": "notes.txt", "chunks": 2}

    resp = client.post(
        "/api/ingest/file",
        files={"file": ("notes.txt", b"Hello world", "text/plain")},
        data={"tags": "note,personal"},
    )

    assert resp.status_code == 200
    mock_ingest.assert_called_once()
    _, filename, tags = mock_ingest.call_args[0]
    assert filename == "notes.txt"
    assert "note" in tags


# --- /api/query ---

@patch("app.api.routes.query")
def test_query_success(mock_query):
    mock_query.return_value = {
        "answer": "RAG is Retrieval Augmented Generation.",
        "sources": [{"title": "AI Guide", "source": "https://example.com", "score": 0.91}],
    }

    resp = client.post("/api/query", json={"question": "What is RAG?"})

    assert resp.status_code == 200
    data = resp.json()
    assert "RAG" in data["answer"]
    assert len(data["sources"]) == 1


@patch("app.api.routes.query")
def test_query_missing_question_returns_422(mock_query):
    resp = client.post("/api/query", json={})
    assert resp.status_code == 422


@patch("app.api.routes.query")
def test_query_propagates_error(mock_query):
    mock_query.side_effect = Exception("retrieval failed")
    resp = client.post("/api/query", json={"question": "anything"})
    assert resp.status_code == 500


# --- /api/documents ---

@patch("app.api.routes.list_documents")
def test_list_documents(mock_list):
    mock_list.return_value = [
        {"title": "Article A", "source": "https://a.com", "tags": ["ai"]},
        {"title": "Article B", "source": "manual", "tags": []},
    ]

    resp = client.get("/api/documents")

    assert resp.status_code == 200
    assert len(resp.json()["documents"]) == 2


@patch("app.api.routes.list_documents")
def test_list_documents_empty(mock_list):
    mock_list.return_value = []
    resp = client.get("/api/documents")
    assert resp.status_code == 200
    assert resp.json()["documents"] == []
