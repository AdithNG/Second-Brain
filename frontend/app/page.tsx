"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatView from "@/components/ChatView";
import LibraryView from "@/components/LibraryView";

type View = "chat" | "library";

export default function Home() {
  const [view, setView] = useState<View>("chat");

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--background)" }}>
      <Sidebar view={view} onViewChange={setView} />
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {view === "chat" ? <ChatView /> : <LibraryView />}
      </main>
    </div>
  );
}
