"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskItem } from "./task-item";
import { toast } from "@/hooks/use-toast";

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface DailyLogFormProps {
  date: string;
  initialData?: {
    plannedTasks: Task[];
    completedTasks: { id: string; text: string }[];
    blockers: string | null;
  };
  onSaved: () => void;
}

export function DailyLogForm({ date, initialData, onSaved }: DailyLogFormProps) {
  const [tasks, setTasks] = useState<Task[]>(initialData?.plannedTasks || []);
  const [blockers, setBlockers] = useState(initialData?.blockers || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!initialData);
  const [dirty, setDirty] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  // 저장할 데이터의 스냅샷을 보관 (레이스 컨디션 방지)
  const pendingSnapshotRef = useRef<{ tasks: Task[]; blockers: string; date: string } | null>(null);

  const saveWithSnapshot = useCallback(async (snapshot: { tasks: Task[]; blockers: string; date: string }) => {
    // 빈 데이터는 절대 저장하지 않음 (기존 기록 덮어쓰기 방지)
    const hasContent = snapshot.tasks.some((t) => t.text.trim()) || snapshot.blockers.trim();
    if (!hasContent) return;

    if (mountedRef.current) setSaving(true);
    try {
      const completedTasks = snapshot.tasks
        .filter((t) => t.completed)
        .map((t) => ({ id: t.id, text: t.text }));

      const res = await fetch("/api/daily-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: snapshot.date,
          plannedTasks: snapshot.tasks,
          completedTasks,
          blockers: snapshot.blockers || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      if (mountedRef.current) {
        setSaved(true);
        setDirty(false);
        pendingSnapshotRef.current = null;
      }
      onSaved();
    } catch {
      if (mountedRef.current) {
        toast({
          title: "자동 저장 실패",
          description: "잠시 후 다시 시도됩니다.",
          variant: "destructive",
        });
      }
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [onSaved]);

  // dirty 상태 변경 시 debounce 자동저장 — 스냅샷을 미리 캡처
  useEffect(() => {
    if (!dirty) return;

    // 현재 상태의 스냅샷을 캡처 (클로저 문제 방지)
    const snapshot = { tasks: [...tasks], blockers, date };
    pendingSnapshotRef.current = snapshot;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveWithSnapshot(snapshot);
    }, 1500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [dirty, tasks, blockers, date, saveWithSnapshot]);

  // 컴포넌트 언마운트 시 pending 저장을 즉시 실행 (데이터 유실 방지)
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      // 미저장 스냅샷이 있으면 즉시 저장 (fire-and-forget)
      const snapshot = pendingSnapshotRef.current;
      if (snapshot) {
        const hasContent = snapshot.tasks.some((t) => t.text.trim()) || snapshot.blockers.trim();
        if (hasContent) {
          const completedTasks = snapshot.tasks
            .filter((t) => t.completed)
            .map((t) => ({ id: t.id, text: t.text }));

          fetch("/api/daily-logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: snapshot.date,
              plannedTasks: snapshot.tasks,
              completedTasks,
              blockers: snapshot.blockers || undefined,
            }),
          }).catch(() => {});
        }
        pendingSnapshotRef.current = null;
      }
    };
  }, []);

  // 페이지 이탈 시 미저장 내용 즉시 저장
  useEffect(() => {
    const handleBeforeUnload = () => {
      const snapshot = pendingSnapshotRef.current;
      if (snapshot) {
        const hasContent = snapshot.tasks.some((t) => t.text.trim()) || snapshot.blockers.trim();
        if (hasContent) {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          const completedTasks = snapshot.tasks
            .filter((t) => t.completed)
            .map((t) => ({ id: t.id, text: t.text }));

          // sendBeacon for reliable unload saving
          const data = JSON.stringify({
            date: snapshot.date,
            plannedTasks: snapshot.tasks,
            completedTasks,
            blockers: snapshot.blockers || undefined,
          });
          navigator.sendBeacon?.("/api/daily-logs", new Blob([data], { type: "application/json" }));
        }
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const markDirty = () => {
    setSaved(false);
    setDirty(true);
  };

  const addTask = () => {
    const newTasks = [
      ...tasks,
      { id: crypto.randomUUID(), text: "", completed: false },
    ];
    setTasks(newTasks);
  };

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    markDirty();
  };

  const updateTask = (id: string, text: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, text } : t)));
    markDirty();
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
    markDirty();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
          <span>
            {new Date(date + "T00:00:00").toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </span>
          {saving && (
            <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground px-2 py-0.5 rounded-full">
              <Loader2 className="h-3 w-3 animate-spin" />
              저장 중...
            </span>
          )}
          {saved && !saving && (
            <span className="inline-flex items-center gap-1 text-xs font-normal text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
              <Check className="h-3 w-3" />
              저장됨
            </span>
          )}
          {dirty && !saving && (
            <span className="text-xs font-normal text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full">
              수정 중...
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-base font-semibold">오늘의 할 일</Label>
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                {...task}
                onToggle={toggleTask}
                onChange={updateTask}
                onDelete={deleteTask}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addTask}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            할 일 추가
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold">하루 정리 / 고민</Label>
          <Textarea
            value={blockers}
            onChange={(e) => {
              setBlockers(e.target.value);
              markDirty();
            }}
            placeholder="오늘 하루를 정리하거나 고민이 있다면 적어주세요."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
