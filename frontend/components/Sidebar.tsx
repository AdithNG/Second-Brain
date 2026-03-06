"use client";

import { Brain, MessageSquare, BookOpen, Plus } from "lucide-react";

type View = "chat" | "library";

interface SidebarProps {
  view: View;
  onViewChange: (v: View) => void;
}

export default function Sidebar({ view, onViewChange }: SidebarProps) {
  return (
    <aside
      style={{
        width: 220,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 12px",
        gap: 8,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 16px" }}>
        <Brain size={22} color="var(--accent)" />
        <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>Second Brain</span>
      </div>

      <button
        onClick={() => onViewChange("library")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          background: "var(--accent)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        <Plus size={16} />
        Add Knowledge
      </button>

      <NavItem
        icon={<MessageSquare size={16} />}
        label="Chat"
        active={view === "chat"}
        onClick={() => onViewChange("chat")}
      />
      <NavItem
        icon={<BookOpen size={16} />}
        label="Library"
        active={view === "library"}
        onClick={() => onViewChange("library")}
      />
    </aside>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        background: active ? "var(--surface-2)" : "transparent",
        color: active ? "var(--text)" : "var(--text-muted)",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        fontSize: 14,
        fontWeight: active ? 600 : 400,
        textAlign: "left",
        width: "100%",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
