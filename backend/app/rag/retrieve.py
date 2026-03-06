"""
Query the index and return grounded answers with source citations.
"""
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.core.response_synthesizers import get_response_synthesizer

from app.rag.index import get_index
from app.config import TOP_K


def query(question: str) -> dict:
    index = get_index()
    retriever = VectorIndexRetriever(index=index, similarity_top_k=TOP_K)
    synthesizer = get_response_synthesizer(response_mode="compact")
    engine = RetrieverQueryEngine(retriever=retriever, response_synthesizer=synthesizer)

    response = engine.query(question)

    sources = []
    seen = set()
    for node in response.source_nodes:
        title = node.metadata.get("title", "Unknown")
        source = node.metadata.get("source", "")
        key = (title, source)
        if key not in seen:
            seen.add(key)
            sources.append({"title": title, "source": source, "score": round(node.score or 0.0, 4)})

    answer = str(response).strip()
    if not answer or answer.lower() in ("empty response", "none"):
        answer = "Your knowledge base is empty. Go to the Library tab and add some documents first, then ask your question again."

    return {"answer": answer, "sources": sources}


def list_documents() -> list[dict]:
    """Return unique documents stored in the index."""
    index = get_index()
    # Access the underlying ChromaDB collection directly
    collection = index._vector_store._collection
    results = collection.get(include=["metadatas"])
    seen = set()
    docs = []
    for meta in results.get("metadatas") or []:
        title = meta.get("title", "Unknown")
        source = meta.get("source", "")
        tags = meta.get("tags", "")
        key = (title, source)
        if key not in seen:
            seen.add(key)
            docs.append({"title": title, "source": source, "tags": tags.split(",") if tags else []})
    return docs
