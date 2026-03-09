"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSession {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

interface ChatSidebarProps {
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  refreshKey: number;
}

export function ChatSidebar({
  currentSessionId,
  onSelectSession,
  onNewChat,
  refreshKey,
}: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/ai/chat/sessions");
      if (res.ok) {
        const { data } = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [refreshKey]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm("이 대화를 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/ai/chat/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          onNewChat();
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const startEditing = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title || "");
  };

  const cancelEditing = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(null);
    setEditTitle("");
  };

  const saveTitle = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!editingId || !editTitle.trim()) {
      cancelEditing();
      return;
    }

    try {
      const res = await fetch(`/api/ai/chat/sessions/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      if (res.ok) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === editingId ? { ...s, title: editTitle.trim() } : s
          )
        );
      }
    } catch (err) {
      console.error("Failed to rename session:", err);
    } finally {
      setEditingId(null);
      setEditTitle("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveTitle();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return "오늘";
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "어제";
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-full border-r bg-muted/30">
      <div className="p-3 border-b">
        <Button onClick={onNewChat} variant="outline" className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          새 대화
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            대화 기록이 없습니다
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => editingId !== s.id && onSelectSession(s.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm group transition-colors",
                  currentSessionId === s.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent text-muted-foreground hover:text-accent-foreground"
                )}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  {editingId === s.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        ref={inputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-xs bg-background text-foreground rounded px-1.5 py-0.5 border outline-none focus:ring-1 focus:ring-primary"
                        maxLength={100}
                      />
                      <button
                        onClick={saveTitle}
                        className="shrink-0 p-0.5 rounded hover:bg-green-500/20"
                        title="저장"
                      >
                        <Check className="h-3 w-3 text-green-600" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="shrink-0 p-0.5 rounded hover:bg-destructive/20"
                        title="취소"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="truncate text-xs font-medium">
                        {s.title || "새 대화"}
                      </p>
                      <p
                        className={cn(
                          "text-[10px]",
                          currentSessionId === s.id
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground/70"
                        )}
                      >
                        {formatDate(s.updatedAt)}
                      </p>
                    </>
                  )}
                </div>
                {editingId !== s.id && (
                  <>
                    <button
                      onClick={(e) => startEditing(e, s)}
                      className={cn(
                        "opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded",
                        currentSessionId === s.id
                          ? "hover:bg-primary-foreground/20"
                          : "hover:bg-accent"
                      )}
                      title="제목 수정"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, s.id)}
                      className={cn(
                        "opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded hover:bg-destructive/10",
                        currentSessionId === s.id
                          ? "hover:bg-primary-foreground/20"
                          : ""
                      )}
                      title="삭제"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
