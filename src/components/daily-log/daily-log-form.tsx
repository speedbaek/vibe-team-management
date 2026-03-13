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
  const tasksRef = useRef(tasks);
  const blockersRef = useRef(blockers);

  // refs를 최신 상태로 유지
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);
  useEffect(() => { blockersRef.current = blockers; }, [blockers]);

  const saveToServer = useCallback(async () => {
    const currentTasks = tasksRef.current;
    const currentBlockers = blockersRef.current;

    // 내용이 없으면 저장하지 않음
    const hasContent = currentTasks.some((t) => t.text.trim()) || currentBlockers.trim();
    if (!hasContent) return;

    setSaving(true);
    try {
      const completedTasks = currentTasks
        .filter((t) => t.completed)
        .map((t) => ({ id: t.id, text: t.text }));

      const res = await fetch("/api/daily-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          plannedTasks: currentTasks,
          completedTasks,
          blockers: currentBlockers || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setDirty(false);
      onSaved();
    } catch {
      toast({
        title: "자동 저장 실패",
        description: "잠시 후 다시 시도됩니다.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [date, onSaved]);

  // dirty 상태 변경 시 debounce 자동저장
  useEffect(() => {
    if (!dirty) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveToServer();
    }, 1500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [dirty, tasks, blockers, saveToServer]);

  // 페이지 이탈 시 미저장 내용 즉시 저장
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (dirty) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        saveToServer();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty, saveToServer]);

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
    // 빈 할 일 추가만으로는 자동저장 안 함 (텍스트 입력 시 저장됨)
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
