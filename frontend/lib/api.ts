const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export interface Source {
  title: string;
  source: string;
  score: number;
}

export interface QueryResponse {
  answer: string;
  sources: Source[];
}

export interface Document {
  title: string;
  source: string;
  tags: string[];
}

export interface IngestResponse {
  status: string;
  title: string;
  chunks: number;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? res.statusText);
  }
  return res.json();
}

export async function queryBrain(question: string): Promise<QueryResponse> {
  return post("/query", { question });
}

export async function ingestText(
  text: string,
  title: string,
  tags: string[]
): Promise<IngestResponse> {
  return post("/ingest/text", { text, title, tags });
}

export async function ingestURL(
  url: string,
  tags: string[]
): Promise<IngestResponse> {
  return post("/ingest/url", { url, tags });
}

export async function ingestFile(
  file: File,
  tags: string[]
): Promise<IngestResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("tags", tags.join(","));
  const res = await fetch(`${BASE}/ingest/file`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? res.statusText);
  }
  return res.json();
}

export async function listDocuments(): Promise<Document[]> {
  const res = await fetch(`${BASE}/documents`);
  if (!res.ok) throw new Error(res.statusText);
  const data = await res.json();
  return data.documents;
}
