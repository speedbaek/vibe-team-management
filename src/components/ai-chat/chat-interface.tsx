"use client";

import { useChat, type Message } from "ai/react";
import { useRef, useEffect, useCallback } from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { QuickActions } from "./quick-actions";
import { DailyLogDraftCard } from "./drafts/daily-log-draft-card";
import { WeeklyReviewDraftCard } from "./drafts/weekly-review-draft-card";
import { GoalDraftCard } from "./drafts/goal-draft-card";
import { DraftLoading } from "./drafts/draft-loading";
import { Card, CardContent } from "@/components/ui/card";

interface ChatInterfaceProps {
  sessionId: string | null;
  onSessionCreated: (sessionId: string) => void;
  initialMessages?: Message[];
}

export function ChatInterface({
  sessionId,
  onSessionCreated,
  initialMessages,
}: ChatInterfaceProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    append,
    setMessages,
  } = useChat({
    api: "/api/ai/chat",
    body: { sessionId },
    initialMessages,
    onResponse: (response) => {
      const newSessionId = response.headers.get("X-Session-Id");
      if (newSessionId && newSessionId !== sessionId) {
        onSessionCreated(newSessionId);
      }
    },
    onError: (err) => {
      console.error("AI Chat error:", err);
    },
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Update messages when initialMessages changes (session switch)
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    } else {
      setMessages([]);
    }
  }, [sessionId]);

  const handleQuickAction = useCallback(
    (message: string) => {
      append({ role: "user", content: message });
    },
    [append]
  );

  const renderToolInvocations = (toolInvocations: any[]) => {
    return toolInvocations.map((invocation: any) => {
      if (invocation.state === "result") {
        const result = invocation.result;
        switch (result.type) {
          case "daily_log_draft":
            return (
              <DailyLogDraftCard
                key={invocation.toolCallId}
                draft={result.draft}
              />
            );
          case "weekly_review_draft":
            return (
              <WeeklyReviewDraftCard
                key={invocation.toolCallId}
                draft={result.draft}
              />
            );
          case "goal_draft":
            return (
              <GoalDraftCard
                key={invocation.toolCallId}
                draft={result.draft}
              />
            );
          default:
            return null;
        }
      }
      return <DraftLoading key={invocation.toolCallId} />;
    });
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-8rem)]">
      <CardContent className="flex flex-col flex-1 p-4 overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto mb-4">
          {messages.length === 0 ? (
            <QuickActions onSelect={handleQuickAction} />
          ) : (
            messages.map((msg) => (
              <div key={msg.id}>
                {msg.content && (
                  <ChatMessage
                    role={msg.role as "user" | "assistant"}
                    content={msg.content}
                  />
                )}
                {msg.toolInvocations &&
                  msg.toolInvocations.length > 0 &&
                  renderToolInvocations(msg.toolInvocations)}
              </div>
            ))
          )}
          {error && (
            <div className="flex gap-3 mb-4">
              <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
                오류: {error.message}
              </div>
            </div>
          )}
          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3 mb-4">
                <div className="bg-muted rounded-lg px-4 py-3 text-sm animate-pulse">
                  생각하는 중...
                </div>
              </div>
            )}
        </div>
        <ChatInput
          value={input}
          onChange={(v) =>
            handleInputChange({ target: { value: v } } as any)
          }
          onSubmit={() => handleSubmit()}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
}
