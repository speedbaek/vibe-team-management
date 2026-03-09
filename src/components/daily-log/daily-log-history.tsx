"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface DailyLogEntry {
  id: string;
  date: string;
  plannedTasks: Task[];
  completedTasks: { id: string; text: string }[];
  blockers: string | null;
}

interface DailyLogHistoryProps {
  logs: DailyLogEntry[];
  onEdit: (date: string) => void;
  selectedDate: string;
}

export function DailyLogHistory({
  logs,
  onEdit,
  selectedDate,
}: DailyLogHistoryProps) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          이번 달 기록이 없습니다. 위에서 오늘의 기록을 작성해보세요!
        </CardContent>
      </Card>
    );
  }

  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          📋 내 일일기록
          <span className="text-sm font-normal text-muted-foreground">
            ({logs.length}건)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedLogs.map((log) => {
          const d = new Date(log.date);
          const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          const dateStr = d.toLocaleDateString("ko-KR", {
            month: "long",
            day: "numeric",
            weekday: "short",
          });
          const tasks = (log.plannedTasks || []) as Task[];
          const completedCount = tasks.filter((t) => t.completed).length;
          const totalCount = tasks.length;
          const isSelected = dateKey === selectedDate;

          return (
            <div
              key={log.id}
              className={`border rounded-lg p-4 transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "hover:bg-accent/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{dateStr}</span>
                  {totalCount > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        completedCount === totalCount && totalCount > 0
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {completedCount}/{totalCount} 완료
                    </span>
                  )}
                </div>
                <Button
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onEdit(dateKey)}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  수정
                </Button>
              </div>

              {tasks.length > 0 && (
                <div className="space-y-1 mb-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="text-xs">
                        {task.completed ? "✅" : "⬜"}
                      </span>
                      <span
                        className={
                          task.completed
                            ? "line-through text-muted-foreground"
                            : ""
                        }
                      >
                        {task.text || "(내용 없음)"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {log.blockers && (
                <div className="text-sm text-muted-foreground mt-2 pt-2 border-t">
                  💬 {log.blockers}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
