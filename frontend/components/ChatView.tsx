"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, ExternalLink } from "lucide-react";
import { queryBrain, type QueryResponse, type Source } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

export default function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res: QueryResponse = await queryBrain(q);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: res.answer, sources: res.sources },
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Error: ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
        {messages.length === 0 && (
          <EmptyState />
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "16px 32px 24px",
          borderTop: "1px solid var(--border)",
          background: "var(--background)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "12px 16px",
            alignItems: "flex-end",
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask your second brain anything..."
            rows={1}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text)",
              fontSize: 15,
              resize: "none",
              lineHeight: 1.5,
              maxHeight: 160,
              overflowY: "auto",
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            style={{
              background: "var(--accent)",
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              opacity: input.trim() && !loading ? 1 : 0.5,
              color: "#fff",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Send size={16} />
          </button>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, textAlign: "center" }}>
          Shift+Enter for newline · Enter to send
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        color: "var(--text-muted)",
        paddingTop: 80,
      }}
    >
      <p style={{ fontSize: 18, fontWeight: 600, color: "var(--text)" }}>Ask your Second Brain</p>
      <p style={{ fontSize: 14 }}>Queries are answered using your ingested documents.</p>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", gap: 12 }}>
      {!isUser && (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          B
        </div>
      )}
      <div style={{ maxWidth: "70%" }}>
        <div
          style={{
            background: isUser ? "var(--accent)" : "var(--surface)",
            color: "var(--text)",
            padding: "12px 16px",
            borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            fontSize: 15,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            border: isUser ? "none" : "1px solid var(--border)",
          }}
        >
          {msg.content}
        </div>
        {msg.sources && msg.sources.length > 0 && (
          <SourcesList sources={msg.sources} />
        )}
      </div>
    </div>
  );
}

function SourcesList({ sources }: { sources: Source[] }) {
  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
      <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Sources
      </p>
      {sources.map((s, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: "var(--text-muted)",
          }}
        >
          {s.source.startsWith("http") ? (
            <a
              href={s.source}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent)", display: "flex", alignItems: "center", gap: 4 }}
            >
              {s.title} <ExternalLink size={10} />
            </a>
          ) : (
            <span>{s.title}</span>
          )}
          <span style={{ opacity: 0.5 }}>· {(s.score * 100).toFixed(0)}% match</span>
        </div>
      ))}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        B
      </div>
      <Loader2 size={18} color="var(--text-muted)" style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
