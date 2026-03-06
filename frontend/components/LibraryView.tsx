"use client";

import { useState, useEffect } from "react";
import { Upload, Link, FileText, Tag, Loader2, CheckCircle, AlertCircle, BookOpen } from "lucide-react";
import { ingestText, ingestURL, ingestFile, listDocuments, type Document } from "@/lib/api";

type Tab = "text" | "url" | "file";

export default function LibraryView() {
  const [tab, setTab] = useState<Tab>("url");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const refreshDocs = async () => {
    setLoadingDocs(true);
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch {
      // ignore
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => { refreshDocs(); }, []);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Left: Ingest Panel */}
      <div
        style={{
          width: 420,
          borderRight: "1px solid var(--border)",
          padding: "28px 24px",
          overflowY: "auto",
          flexShrink: 0,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Add Knowledge</h2>

        <TabBar tab={tab} setTab={setTab} />

        <div style={{ marginTop: 20 }}>
          {tab === "url" && <URLForm onSuccess={refreshDocs} />}
          {tab === "text" && <TextForm onSuccess={refreshDocs} />}
          {tab === "file" && <FileForm onSuccess={refreshDocs} />}
        </div>
      </div>

      {/* Right: Document Library */}
      <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
          Knowledge Library
          <span
            style={{
              marginLeft: 10,
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-muted)",
              background: "var(--surface)",
              padding: "2px 10px",
              borderRadius: 20,
            }}
          >
            {documents.length} docs
          </span>
        </h2>

        {loadingDocs ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)" }}>
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            Loading...
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : documents.length === 0 ? (
          <EmptyLibrary />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {documents.map((doc, i) => (
              <DocCard key={i} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "url", label: "URL", icon: <Link size={14} /> },
    { id: "text", label: "Text", icon: <FileText size={14} /> },
    { id: "file", label: "File", icon: <Upload size={14} /> },
  ];
  return (
    <div
      style={{
        display: "flex",
        background: "var(--surface-2)",
        borderRadius: 10,
        padding: 4,
        gap: 4,
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "8px 0",
            background: tab === t.id ? "var(--surface)" : "transparent",
            color: tab === t.id ? "var(--text)" : "var(--text-muted)",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: tab === t.id ? 600 : 400,
          }}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}

function TagInput({ tags, setTags }: { tags: string[]; setTags: (t: string[]) => void }) {
  const [input, setInput] = useState("");

  function add() {
    const v = input.trim();
    if (v && !tags.includes(v)) setTags([...tags, v]);
    setInput("");
  }

  function remove(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  return (
    <div>
      <label style={labelStyle}>Tags (optional)</label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
        {tags.map((t) => (
          <span
            key={t}
            style={{
              background: "var(--accent)",
              color: "#fff",
              fontSize: 12,
              padding: "2px 10px",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
            }}
            onClick={() => remove(t)}
          >
            <Tag size={10} /> {t} ×
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Add tag + Enter"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={add} style={secondaryBtnStyle}>Add</button>
      </div>
    </div>
  );
}

function StatusBanner({ status }: { status: { type: "success" | "error"; message: string } | null }) {
  if (!status) return null;
  const isOk = status.type === "success";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        borderRadius: 8,
        background: isOk ? "#1a2e1a" : "#2e1a1a",
        border: `1px solid ${isOk ? "#2a5c2a" : "#5c2a2a"}`,
        fontSize: 13,
        color: isOk ? "#7adb7a" : "#db7a7a",
        marginTop: 12,
      }}
    >
      {isOk ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
      {status.message}
    </div>
  );
}

function URLForm({ onSuccess }: { onSuccess: () => void }) {
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function submit() {
    if (!url.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await ingestURL(url.trim(), tags);
      setStatus({ type: "success", message: `Ingested "${res.title}" — ${res.chunks} chunks` });
      setUrl("");
      setTags([]);
      onSuccess();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed";
      setStatus({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={labelStyle}>URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/article"
          style={inputStyle}
        />
      </div>
      <TagInput tags={tags} setTags={setTags} />
      <button onClick={submit} disabled={loading || !url.trim()} style={primaryBtnStyle(loading || !url.trim())}>
        {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}
        {loading ? "Ingesting..." : "Ingest URL"}
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </button>
      <StatusBanner status={status} />
    </div>
  );
}

function TextForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function submit() {
    if (!title.trim() || !text.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await ingestText(text.trim(), title.trim(), tags);
      setStatus({ type: "success", message: `Ingested "${res.title}" — ${res.chunks} chunks` });
      setTitle("");
      setText("");
      setTags([]);
      onSuccess();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed";
      setStatus({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={labelStyle}>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My note" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Content</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste text, notes, or markdown here..."
          rows={8}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>
      <TagInput tags={tags} setTags={setTags} />
      <button onClick={submit} disabled={loading || !title.trim() || !text.trim()} style={primaryBtnStyle(loading || !title.trim() || !text.trim())}>
        {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}
        {loading ? "Ingesting..." : "Save to Brain"}
      </button>
      <StatusBanner status={status} />
    </div>
  );
}

function FileForm({ onSuccess }: { onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function submit() {
    if (!file) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await ingestFile(file, tags);
      setStatus({ type: "success", message: `Ingested "${res.title}" — ${res.chunks} chunks` });
      setFile(null);
      setTags([]);
      onSuccess();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed";
      setStatus({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={labelStyle}>File (PDF, DOCX, TXT, MD)</label>
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "28px 20px",
            border: "2px dashed var(--border)",
            borderRadius: 10,
            cursor: "pointer",
            color: "var(--text-muted)",
            fontSize: 14,
            transition: "border-color 0.2s",
          }}
        >
          <Upload size={22} />
          {file ? file.name : "Click to upload"}
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      <TagInput tags={tags} setTags={setTags} />
      <button onClick={submit} disabled={loading || !file} style={primaryBtnStyle(loading || !file)}>
        {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}
        {loading ? "Ingesting..." : "Upload & Ingest"}
      </button>
      <StatusBanner status={status} />
    </div>
  );
}

function DocCard({ doc }: { doc: Document }) {
  const isURL = doc.source.startsWith("http");
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "14px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <FileText size={14} color="var(--accent)" />
        <span style={{ fontWeight: 600, fontSize: 14 }}>{doc.title}</span>
      </div>
      {isURL && (
        <a
          href={doc.source}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, color: "var(--accent)", wordBreak: "break-all" }}
        >
          {doc.source}
        </a>
      )}
      {doc.tags.filter(Boolean).length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
          {doc.tags.filter(Boolean).map((t) => (
            <span
              key={t}
              style={{
                fontSize: 11,
                padding: "2px 8px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                color: "var(--text-muted)",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyLibrary() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        color: "var(--text-muted)",
        paddingTop: 80,
      }}
    >
      <BookOpen size={40} strokeWidth={1} />
      <p style={{ fontWeight: 600, color: "var(--text)" }}>Your library is empty</p>
      <p style={{ fontSize: 14 }}>Add a URL, paste text, or upload a file to get started.</p>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-muted)",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "10px 12px",
  color: "var(--text)",
  fontSize: 14,
  outline: "none",
};

const primaryBtnStyle = (disabled: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "11px 0",
  background: disabled ? "var(--surface-2)" : "var(--accent)",
  color: disabled ? "var(--text-muted)" : "#fff",
  border: "none",
  borderRadius: 8,
  cursor: disabled ? "not-allowed" : "pointer",
  fontSize: 14,
  fontWeight: 600,
});

const secondaryBtnStyle: React.CSSProperties = {
  padding: "8px 14px",
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  cursor: "pointer",
  color: "var(--text)",
  fontSize: 13,
};
