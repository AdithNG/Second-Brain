"""
Tests for the retrieval and query pipeline.
"""
from unittest.mock import MagicMock, patch
import pytest

from app.rag.retrieve import query, list_documents


def _make_node(text, title, source, score=0.85):
    node = MagicMock()
    node.text = text
    node.metadata = {"title": title, "source": source, "tags": ""}
    node.score = score
    return node


# --- query ---

@patch("app.rag.retrieve.get_index")
@patch("app.rag.retrieve.RetrieverQueryEngine")
@patch("app.rag.retrieve.VectorIndexRetriever")
@patch("app.rag.retrieve.get_response_synthesizer")
def test_query_returns_answer_and_sources(
    mock_synthesizer, mock_retriever_cls, mock_engine_cls, mock_get_index
):
    mock_get_index.return_value = MagicMock()

    node = _make_node("RAG stands for Retrieval Augmented Generation.", "AI Guide", "https://example.com", 0.92)
    mock_response = MagicMock()
    mock_response.__str__ = lambda self: "RAG stands for Retrieval Augmented Generation."
    mock_response.source_nodes = [node]

    mock_engine = MagicMock()
    mock_engine.query.return_value = mock_response
    mock_engine_cls.return_value = mock_engine

    result = query("What is RAG?")

    assert "RAG" in result["answer"]
    assert len(result["sources"]) == 1
    assert result["sources"][0]["title"] == "AI Guide"
    assert result["sources"][0]["score"] == 0.92


@patch("app.rag.retrieve.get_index")
@patch("app.rag.retrieve.RetrieverQueryEngine")
@patch("app.rag.retrieve.VectorIndexRetriever")
@patch("app.rag.retrieve.get_response_synthesizer")
def test_query_deduplicates_sources(
    mock_synthesizer, mock_retriever_cls, mock_engine_cls, mock_get_index
):
    mock_get_index.return_value = MagicMock()

    node1 = _make_node("chunk 1", "Same Doc", "https://example.com", 0.9)
    node2 = _make_node("chunk 2", "Same Doc", "https://example.com", 0.8)
    mock_response = MagicMock()
    mock_response.__str__ = lambda self: "Answer from two chunks of the same doc."
    mock_response.source_nodes = [node1, node2]

    mock_engine = MagicMock()
    mock_engine.query.return_value = mock_response
    mock_engine_cls.return_value = mock_engine

    result = query("Some question")

    assert len(result["sources"]) == 1


@patch("app.rag.retrieve.get_index")
@patch("app.rag.retrieve.RetrieverQueryEngine")
@patch("app.rag.retrieve.VectorIndexRetriever")
@patch("app.rag.retrieve.get_response_synthesizer")
def test_query_handles_empty_knowledge_base(
    mock_synthesizer, mock_retriever_cls, mock_engine_cls, mock_get_index
):
    mock_get_index.return_value = MagicMock()

    mock_response = MagicMock()
    mock_response.__str__ = lambda self: "Empty Response"
    mock_response.source_nodes = []

    mock_engine = MagicMock()
    mock_engine.query.return_value = mock_response
    mock_engine_cls.return_value = mock_engine

    result = query("What is anything?")

    assert "empty" in result["answer"].lower()
    assert result["sources"] == []


# --- list_documents ---

@patch("app.rag.retrieve.get_index")
def test_list_documents_returns_unique_docs(mock_get_index):
    mock_collection = MagicMock()
    mock_collection.get.return_value = {
        "metadatas": [
            {"title": "Article A", "source": "https://a.com", "tags": "ai,rag"},
            {"title": "Article A", "source": "https://a.com", "tags": "ai,rag"},
            {"title": "Article B", "source": "https://b.com", "tags": ""},
        ]
    }
    mock_index = MagicMock()
    mock_index._vector_store._collection = mock_collection
    mock_get_index.return_value = mock_index

    docs = list_documents()

    assert len(docs) == 2
    titles = [d["title"] for d in docs]
    assert "Article A" in titles
    assert "Article B" in titles


@patch("app.rag.retrieve.get_index")
def test_list_documents_parses_tags(mock_get_index):
    mock_collection = MagicMock()
    mock_collection.get.return_value = {
        "metadatas": [
            {"title": "Doc", "source": "manual", "tags": "python,fastapi,rag"},
        ]
    }
    mock_index = MagicMock()
    mock_index._vector_store._collection = mock_collection
    mock_get_index.return_value = mock_index

    docs = list_documents()

    assert docs[0]["tags"] == ["python", "fastapi", "rag"]


@patch("app.rag.retrieve.get_index")
def test_list_documents_empty_collection(mock_get_index):
    mock_collection = MagicMock()
    mock_collection.get.return_value = {"metadatas": []}
    mock_index = MagicMock()
    mock_index._vector_store._collection = mock_collection
    mock_get_index.return_value = mock_index

    docs = list_documents()
    assert docs == []
