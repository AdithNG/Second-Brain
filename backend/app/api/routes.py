from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.rag.ingest import ingest_text, ingest_url, ingest_file
from app.rag.retrieve import query, list_documents

router = APIRouter()


class TextIngestRequest(BaseModel):
    text: str
    title: str
    tags: Optional[list[str]] = None


class URLIngestRequest(BaseModel):
    url: str
    tags: Optional[list[str]] = None


class QueryRequest(BaseModel):
    question: str


@router.post("/ingest/text")
def ingest_text_route(req: TextIngestRequest):
    try:
        return ingest_text(req.text, req.title, req.tags)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ingest/url")
def ingest_url_route(req: URLIngestRequest):
    try:
        return ingest_url(req.url, req.tags)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ingest/file")
async def ingest_file_route(
    file: UploadFile = File(...),
    tags: Optional[str] = Form(None),
):
    try:
        file_bytes = await file.read()
        tag_list = [t.strip() for t in tags.split(",")] if tags else []
        return ingest_file(file_bytes, file.filename, tag_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query")
def query_route(req: QueryRequest):
    try:
        return query(req.question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents")
def documents_route():
    try:
        return {"documents": list_documents()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
def health():
    return {"status": "ok"}
