"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
    mood: number | null;
  };
  onSaved: () => void;
}

export function DailyLogForm({ date, initialData, onSaved }: DailyLogFormProps) {
  const [tasks, setTasks] = useState<Task[]>(initialData?.plannedTasks || []);
  const [blockers, setBlockers] = useState(initialData?.blockers || "");
  const [mood, setMood] = useState(initialData?.mood || 3);
  const [saving, setSaving] = useState(false);

  const addTask = () => {
    setTasks([
      ...tasks,
      { id: crypto.randomUUID(), text: "", completed: false },
    ]);
  };

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const updateTask = (id: string, text: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, text } : t)));
  };

  const deleteTask = (id: string) => {
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
          mood,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
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

  const moodEmojis = ["😫", "😟", "😐", "🙂", "😄"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {new Date(date + "T00:00:00").toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
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
          <Label className="text-base font-semibold">어려운 점 / 고민</Label>
          <Textarea
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            placeholder="오늘 업무 중 어려운 점이나 고민이 있나요?"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold">오늘 기분은 어떤가요?</Label>
          <div className="flex gap-2">
            {moodEmojis.map((emoji, i) => (
              <button
                key={i}
                onClick={() => setMood(i + 1)}
                className={`text-2xl p-2 rounded-lg transition-all ${
                  mood === i + 1
                    ? "bg-primary/10 scale-110"
                    : "hover:bg-accent"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "저장 중..." : "저장하기"}
        </Button>
      </CardContent>
    </Card>
  );
}
