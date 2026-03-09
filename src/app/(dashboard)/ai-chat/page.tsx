"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { type Message } from "ai/react";
import { ChatInterface } from "@/components/ai-chat/chat-interface";
import { ChatSidebar } from "@/components/ai-chat/chat-sidebar";

const SIDEBAR_MIN = 180;
const SIDEBAR_MAX = 400;
const SIDEBAR_DEFAULT = 224; // w-56 = 14rem = 224px
const STORAGE_KEY = "ai-chat-sidebar-width";

export default function AIChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[] | undefined>(
    undefined
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFirstTime, setIsFirstTime] = useState(false);

  // 사이드바 리사이즈
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const w = parseInt(saved, 10);
      if (w >= SIDEBAR_MIN && w <= SIDEBAR_MAX) setSidebarWidth(w);
    }
  }, []);

  useEffect(() => {
    fetch("/api/ai/chat/sessions")
      .then((res) => res.json())
      .then(({ data }) => {
        if (data && data.length === 0) {
          setIsFirstTime(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerLeft = containerRef.current.getBoundingClientRect().left;
      const newWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, e.clientX - containerLeft));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      localStorage.setItem(STORAGE_KEY, String(sidebarWidth));
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, sidebarWidth]);

  const handleSelectSession = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/ai/chat/sessions/${id}`);
      if (!res.ok) return;
      const { data } = await res.json();
      const msgs: Message[] = data.messages.map(
        (m: { id: string; role: string; content: string }) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        })
      );
      setSessionId(id);
      setInitialMessages(msgs);
    } catch (err) {
      console.error("Failed to load session:", err);
    }
  }, []);

  const handleNewChat = useCallback(() => {
    setSessionId(null);
    setInitialMessages(undefined);
  }, []);

  const handleSessionCreated = useCallback((newSessionId: string) => {
    setSessionId(newSessionId);
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div ref={containerRef} className="flex h-[calc(100vh-6rem)] -mt-2">
      {/* 사이드바 - 데스크탑만 */}
      <div
        className="hidden md:block shrink-0"
        style={{ width: sidebarWidth }}
      >
        <ChatSidebar
          currentSessionId={sessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          refreshKey={refreshKey}
        />
      </div>
      {/* 리사이즈 핸들 */}
      <div
        onMouseDown={handleMouseDown}
        className="hidden md:flex w-1 cursor-col-resize items-center justify-center hover:bg-primary/20 active:bg-primary/30 transition-colors shrink-0"
      >
        <div className="w-0.5 h-8 rounded-full bg-border" />
      </div>
      {/* 채팅 영역 */}
      <div className="flex-1 min-w-0 px-2 md:px-4">
        <ChatInterface
          sessionId={sessionId}
          onSessionCreated={handleSessionCreated}
          initialMessages={initialMessages}
          isFirstTime={isFirstTime}
        />
      </div>
    </div>
  );
}
