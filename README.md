# Second Brain

A personal RAG-based knowledge system. Ingest articles, PDFs, docs, and notes — then query them with AI-powered retrieval and grounded answers.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + Python |
| RAG | LlamaIndex |
| Vector DB | ChromaDB (local) |
| Embeddings | OpenAI `text-embedding-3-small` |
| LLM | Claude (`claude-sonnet-4-6`) |
| Frontend | Next.js 15 + TypeScript |

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env
# Fill in ANTHROPIC_API_KEY and OPENAI_API_KEY in .env

python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

python main.py
# API running at http://localhost:8000
```

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local

npm install
npm run dev
# App running at http://localhost:3000
```

### 3. Docker (both services)

```bash
cp backend/.env.example backend/.env
# Fill in API keys

docker compose up --build
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ingest/url` | Scrape and ingest a URL |
| POST | `/api/ingest/text` | Ingest raw text/markdown |
| POST | `/api/ingest/file` | Upload PDF, DOCX, TXT, MD |
| POST | `/api/query` | Ask a question, get grounded answer + sources |
| GET | `/api/documents` | List all ingested documents |
| GET | `/api/health` | Health check |

## Features

- Full RAG pipeline: chunk → embed → store → retrieve → synthesize
- Source citations with relevance scores on every answer
- Tag-based document organization
- Supports PDF, DOCX, plain text, Markdown, and web URLs
- Persistent local vector storage (no cloud required)
