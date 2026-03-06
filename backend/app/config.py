import os
from dotenv import load_dotenv

load_dotenv(override=True)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./data/chroma")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "second_brain")
EMBED_MODEL = "text-embedding-3-small"
LLM_MODEL = "claude-sonnet-4-6"
CHUNK_SIZE = 512
CHUNK_OVERLAP = 64
TOP_K = 6
