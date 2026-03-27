"use client";

import { useChat, type Message } from "ai/react";
import { useRef, useEffect, useCallback, useState } from "react";
import { RefreshCw } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { QuickActions } from "./quick-actions";
import { DailyLogDraftCard } from "./drafts/daily-log-draft-card";
import { WeeklyReviewDraftCard } from "./drafts/weekly-review-draft-card";
import { GoalDraftCard } from "./drafts/goal-draft-card";
import { DraftLoading } from "./drafts/draft-loading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ChatInterfaceProps {
  sessionId: string | null;
  onSessionCreated: (sessionId: string) => void;
  initialMessages?: Message[];
  isFirstTime?: boolean;
}

export function ChatInterface({
  sessionId,
  onSessionCreated,
  initialMessages,
  isFirstTime = false,
}: ChatInterfaceProps) {
  const [onboardingSent, setOnboardingSent] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    append,
    setMessages,
    reload,
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

  // 첫 사용자 자동 온보딩 메시지
  useEffect(() => {
    if (isFirstTime && !onboardingSent && !sessionId && messages.length === 0) {
      setOnboardingSent(true);
      append({ role: "user", content: "안녕하세요, 처음 왔어요!" });
    }
  }, [isFirstTime, onboardingSent, sessionId, messages.length, append]);

  const handleQuickAction = useCallback(
    (message: string) => {
      append({ role: "user", content: message });
    },
    [append]
  );

  const handleImageSelect = (file: File) => {
    if (imageFiles.length >= 10) {
      alert("이미지는 최대 10개까지 첨부할 수 있습니다.");
      return;
    }
    setImageFiles((prev) => [...prev, file]);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreviews((prev) => [...prev, e.target?.result as string]);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = () => {
    if (imageFiles.length > 0 && imagePreviews.length > 0) {
      const attachments = imageFiles.map((file, i) => ({
        name: file.name,
        contentType: file.type,
        url: imagePreviews[i],
      }));

      if (!input.trim()) {
        // 텍스트 없이 이미지만 전송: append 사용
        append({
          role: "user" as const,
          content: "",
          experimental_attachments: attachments,
        });
      } else {
        // 텍스트 + 이미지: handleSubmit 사용
        handleSubmit(undefined, {
          experimental_attachments: attachments,
        });
      }
      setImageFiles([]);
      setImagePreviews([]);
    } else {
      handleSubmit();
    }
  };

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
                {(msg.content || msg.experimental_attachments) && (
                  <ChatMessage
                    role={msg.role as "user" | "assistant"}
                    content={msg.content}
                    attachments={msg.experimental_attachments}
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
              <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm space-y-2">
                <p>
                  {error.message?.includes("timeout") || error.message?.includes("aborted")
                    ? "응답 시간이 초과되었습니다. 다시 시도해주세요."
                    : error.message?.includes("fetch")
                      ? "네트워크 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요."
                      : `오류가 발생했습니다: ${error.message || "알 수 없는 오류"}`}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => reload()}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  다시 시도
                </Button>
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
          onSubmit={handleFormSubmit}
          isLoading={isLoading}
          imagePreviews={imagePreviews}
          onImageSelect={handleImageSelect}
          onImageRemove={handleImageRemove}
        />
      </CardContent>
    </Card>
  );
}
