"""
Tests for the ingestion pipeline.
All external dependencies (ChromaDB, OpenAI) are mocked so tests
run without API keys or a running vector store.
"""
from unittest.mock import MagicMock, patch
import pytest

from app.rag.ingest import _make_doc, _extract_text, ingest_text, ingest_url, ingest_file


# --- _make_doc ---

def test_make_doc_sets_metadata():
    doc = _make_doc("hello world", {"title": "Test", "source": "manual"})
    assert doc.text == "hello world"
    assert doc.metadata["title"] == "Test"
    assert doc.id_ is not None


def test_make_doc_unique_ids():
    doc1 = _make_doc("text", {})
    doc2 = _make_doc("text", {})
    assert doc1.id_ != doc2.id_


# --- _extract_text ---

def test_extract_text_plain(tmp_path):
    f = tmp_path / "note.txt"
    f.write_text("Hello from plain text", encoding="utf-8")
    result = _extract_text(str(f), ".txt")
    assert result == "Hello from plain text"


def test_extract_text_markdown(tmp_path):
    f = tmp_path / "note.md"
    f.write_text("# Heading\nSome content", encoding="utf-8")
    result = _extract_text(str(f), ".md")
    assert "Heading" in result


# --- ingest_text ---

@patch("app.rag.ingest.get_index")
def test_ingest_text_returns_chunk_count(mock_get_index):
    mock_index = MagicMock()
    mock_get_index.return_value = mock_index

    result = ingest_text("Some text content here for chunking.", "My Note", ["tag1"])

    assert result["status"] == "ok"
    assert result["title"] == "My Note"
    assert result["chunks"] >= 1
    mock_index.insert_nodes.assert_called_once()


@patch("app.rag.ingest.get_index")
def test_ingest_text_tags_stored_in_metadata(mock_get_index):
    mock_index = MagicMock()
    mock_get_index.return_value = mock_index

    ingest_text("Content", "Title", ["python", "rag"])

    nodes = mock_index.insert_nodes.call_args[0][0]
    assert any("python" in node.metadata.get("tags", "") for node in nodes)


@patch("app.rag.ingest.get_index")
def test_ingest_text_no_tags(mock_get_index):
    mock_index = MagicMock()
    mock_get_index.return_value = mock_index

    result = ingest_text("Content without tags", "Tagless Note")
    assert result["status"] == "ok"


# --- ingest_url ---

@patch("app.rag.ingest.get_index")
@patch("app.rag.ingest.requests.get")
def test_ingest_url_scrapes_and_strips_html(mock_requests, mock_get_index):
    mock_index = MagicMock()
    mock_get_index.return_value = mock_index

    mock_resp = MagicMock()
    mock_resp.text = """
        <html>
          <head><title>Test Article</title></head>
          <body>
            <nav>Nav junk</nav>
            <p>Real article content here.</p>
            <footer>Footer junk</footer>
          </body>
        </html>
    """
    mock_requests.return_value = mock_resp

    result = ingest_url("https://example.com/article", ["news"])

    assert result["status"] == "ok"
    assert result["title"] == "Test Article"
    nodes = mock_index.insert_nodes.call_args[0][0]
    all_text = " ".join(n.text for n in nodes)
    assert "Real article content" in all_text
    assert "Nav junk" not in all_text
    assert "Footer junk" not in all_text


@patch("app.rag.ingest.get_index")
@patch("app.rag.ingest.requests.get")
def test_ingest_url_falls_back_to_url_as_title(mock_requests, mock_get_index):
    mock_get_index.return_value = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = "<html><body><p>No title tag here.</p></body></html>"
    mock_requests.return_value = mock_resp

    result = ingest_url("https://example.com/no-title")
    assert result["title"] == "https://example.com/no-title"


# --- ingest_file ---

@patch("app.rag.ingest.get_index")
def test_ingest_file_txt(mock_get_index):
    mock_index = MagicMock()
    mock_get_index.return_value = mock_index

    result = ingest_file(b"Plain text file content.", "notes.txt")

    assert result["status"] == "ok"
    assert result["title"] == "notes.txt"
    assert result["chunks"] >= 1


@patch("app.rag.ingest.get_index")
def test_ingest_file_md(mock_get_index):
    mock_index = MagicMock()
    mock_get_index.return_value = mock_index

    content = b"# My Note\n\nThis is markdown content."
    result = ingest_file(content, "note.md")

    assert result["status"] == "ok"
