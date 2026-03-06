"""
Manages the ChromaDB-backed LlamaIndex vector store.
Singleton pattern so we only initialize once per process.
"""
import chromadb
from llama_index.core import VectorStoreIndex, StorageContext, Settings
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.anthropic import Anthropic

from app.config import (
    ANTHROPIC_API_KEY,
    OPENAI_API_KEY,
    CHROMA_PERSIST_DIR,
    COLLECTION_NAME,
    EMBED_MODEL,
    LLM_MODEL,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
)

_index: VectorStoreIndex | None = None


def _configure_settings() -> None:
    Settings.embed_model = OpenAIEmbedding(
        model=EMBED_MODEL, api_key=OPENAI_API_KEY
    )
    Settings.llm = Anthropic(
        model=LLM_MODEL, api_key=ANTHROPIC_API_KEY
    )
    Settings.chunk_size = CHUNK_SIZE
    Settings.chunk_overlap = CHUNK_OVERLAP


def get_index() -> VectorStoreIndex:
    global _index
    if _index is None:
        _configure_settings()
        client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
        collection = client.get_or_create_collection(COLLECTION_NAME)
        vector_store = ChromaVectorStore(chroma_collection=collection)
        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        _index = VectorStoreIndex.from_vector_store(
            vector_store, storage_context=storage_context
        )
    return _index
