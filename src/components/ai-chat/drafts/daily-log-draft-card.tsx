"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Check, Plus, Trash2, Save, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface DailyLogDraft {
  date: string;
  plannedTasks: Task[];
  completedTasks: { id: string; text: string }[];
  blockers?: string;
}

interface DailyLogDraftCardProps {
  draft: DailyLogDraft;
}

export function DailyLogDraftCard({ draft }: DailyLogDraftCardProps) {
  const [tasks, setTasks] = useState<Task[]>(draft.plannedTasks);
  const [blockers, setBlockers] = useState(draft.blockers || "");
  const [newTask, setNewTask] = useState("");
  const [saveState, setSaveState] = useState<"draft" | "saving" | "saved">(
    "draft"
  );

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: `task-${Date.now()}`, text: newTask.trim(), completed: false },
    ]);
    setNewTask("");
  };

  const handleSave = async () => {
    setSaveState("saving");
    try {
      const completedTasks = tasks
        .filter((t) => t.completed)
        .map(({ id, text }) => ({ id, text }));

      const res = await fetch("/api/daily-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: draft.date,
          plannedTasks: tasks,
          completedTasks,
          blockers: blockers || undefined,
        }),
      });

      if (!res.ok) throw new Error("저장 실패");
      setSaveState("saved");
    } catch {
      setSaveState("draft");
      alert("저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  if (saveState === "saved") {
    return (
      <Card className="my-4 border-green-200 bg-green-50">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-sm text-green-700 font-medium">
            {draft.date} 일일 기록이 저장되었습니다.
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-4 border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-blue-600" />
          일일 기록 초안 — {draft.date}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 업무 목록 */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            업무 목록
          </label>
          <div className="space-y-1">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-2 group">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                    task.completed
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/30"
                  )}
                >
                  {task.completed && <Check className="h-3 w-3" />}
                </button>
                <span
                  className={cn(
                    "text-sm flex-1",
                    task.completed && "line-through text-muted-foreground"
                  )}
                >
                  {task.text}
                </span>
                <button
                  onClick={() => removeTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="업무 추가..."
              className="text-sm h-8"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTask();
                }
              }}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={addTask}
              className="h-8 px-2"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* 하루 정리 / 고민 */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            하루 정리 / 고민
          </label>
          <Textarea
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            rows={2}
            className="text-sm resize-none"
            placeholder="오늘 하루를 정리하거나 고민이 있다면 적어주세요."
          />
        </div>

        {/* 저장 버튼 */}
        <Button
          onClick={handleSave}
          disabled={saveState === "saving" || tasks.length === 0}
          className="w-full"
          size="sm"
        >
          <Save className="h-4 w-4 mr-2" />
          {saveState === "saving" ? "저장 중..." : "일일 기록 저장하기"}
        </Button>
      </CardContent>
    </Card>
  );
}
