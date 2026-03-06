"""
Document ingestion: load → chunk → embed → store in ChromaDB.
Supports PDF, DOCX, plain text, markdown, and URLs.
"""
import uuid
import tempfile
import os
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from llama_index.core import Document
from llama_index.core.node_parser import SentenceSplitter

from app.rag.index import get_index
from app.config import CHUNK_SIZE, CHUNK_OVERLAP


def _make_doc(text: str, metadata: dict) -> Document:
    return Document(text=text, metadata=metadata, id_=str(uuid.uuid4()))


def ingest_text(text: str, title: str, tags: list[str] | None = None) -> dict:
    doc = _make_doc(text, {"title": title, "source": "manual", "tags": ",".join(tags or [])})
    return _insert_docs([doc], title)


def ingest_url(url: str, tags: list[str] | None = None) -> dict:
    resp = requests.get(url, timeout=15, headers={"User-Agent": "SecondBrain/1.0"})
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    title = soup.title.string.strip() if soup.title else url
    doc = _make_doc(text, {"title": title, "source": url, "tags": ",".join(tags or [])})
    return _insert_docs([doc], title)


def ingest_file(file_bytes: bytes, filename: str, tags: list[str] | None = None) -> dict:
    suffix = Path(filename).suffix.lower()
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        text = _extract_text(tmp_path, suffix)
    finally:
        os.unlink(tmp_path)

    doc = _make_doc(text, {"title": filename, "source": filename, "tags": ",".join(tags or [])})
    return _insert_docs([doc], filename)


def _extract_text(path: str, suffix: str) -> str:
    if suffix == ".pdf":
        from pypdf import PdfReader
        reader = PdfReader(path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    elif suffix == ".docx":
        import docx2txt
        return docx2txt.process(path)
    else:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()


def _insert_docs(docs: list[Document], title: str) -> dict:
    splitter = SentenceSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)
    nodes = splitter.get_nodes_from_documents(docs)
    index = get_index()
    index.insert_nodes(nodes)
    return {"status": "ok", "title": title, "chunks": len(nodes)}
