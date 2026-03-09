"use client";

import { useState } from "react";
import { Plus, Check } from "lucide-react";
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
  const isExisting = !!initialData;

  const addTask = () => {
    setSaved(false);
    setTasks([
      ...tasks,
      { id: crypto.randomUUID(), text: "", completed: false },
    ]);
  };

  const toggleTask = (id: string) => {
    setSaved(false);
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const updateTask = (id: string, text: string) => {
    setSaved(false);
    setTasks(tasks.map((t) => (t.id === id ? { ...t, text } : t)));
  };

  const deleteTask = (id: string) => {
    setSaved(false);
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const completedTasks = tasks
        .filter((t) => t.completed)
        .map((t) => ({ id: t.id, text: t.text }));

      const res = await fetch("/api/daily-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          plannedTasks: tasks,
          completedTasks,
          blockers: blockers || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTasks([]);
      setBlockers("");
      toast({ title: "저장 완료!", description: "일일 기록이 저장되었습니다." });
      onSaved();
    } catch {
      toast({
        title: "오류",
        description: "일일 기록 저장에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs font-normal text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
              <Check className="h-3 w-3" />
              저장됨
            </span>
          )}
          {isExisting && !saved && (
            <span className="text-xs font-normal text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
              수정 중
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
              setSaved(false);
              setBlockers(e.target.value);
            }}
            placeholder="오늘 하루를 정리하거나 고민이 있다면 적어주세요."
            rows={3}
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "저장 중..." : "저장하기"}
        </Button>
      </CardContent>
    </Card>
  );
}
