"use client";

import { useState, useCallback, useEffect } from "react";
import { type Message } from "ai/react";
import { ChatInterface } from "@/components/ai-chat/chat-interface";
import { ChatSidebar } from "@/components/ai-chat/chat-sidebar";

export default function AIChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[] | undefined>(
    undefined
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFirstTime, setIsFirstTime] = useState(false);

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
    // Refresh sidebar to show new session
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="flex h-[calc(100vh-6rem)] -mt-2">
      {/* 사이드바 - 데스크탑만 */}
      <div className="hidden md:block w-56 shrink-0">
        <ChatSidebar
          currentSessionId={sessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          refreshKey={refreshKey}
        />
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
