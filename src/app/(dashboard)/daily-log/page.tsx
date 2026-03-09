"use client";

import { useState, useRef } from "react";
import { DailyLogForm } from "@/components/daily-log/daily-log-form";
import { DailyLogCalendar } from "@/components/daily-log/daily-log-calendar";
import { DailyLogHistory } from "@/components/daily-log/daily-log-history";
import { useDailyLogs } from "@/hooks/use-daily-logs";
import { toast } from "@/hooks/use-toast";

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function DailyLogPage() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [formKey, setFormKey] = useState(0);
  const { logs, refetch } = useDailyLogs(currentMonth);
  const formRef = useRef<HTMLDivElement>(null);

  const selectedLog = logs.find((l) => {
    const logDate = new Date(l.date).toISOString().split("T")[0];
    return logDate === selectedDate;
  });

  const handleEditFromHistory = (date: string) => {
    setSelectedDate(date);
    // 같은 날짜여도 폼을 강제 리렌더링
    setFormKey((k) => k + 1);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDelete = async (logId: string) => {
    if (!confirm("이 일일기록을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/daily-logs/${logId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "삭제 완료", description: "일일기록이 삭제되었습니다." });
      refetch();
      setFormKey((k) => k + 1);
    } catch {
      toast({
        title: "오류",
        description: "삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">일일 업무 기록</h2>
      <div ref={formRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DailyLogForm
            key={`${selectedDate}-${formKey}`}
            date={selectedDate}
            initialData={
              selectedLog
                ? {
                    plannedTasks: selectedLog.plannedTasks as any,
                    completedTasks: selectedLog.completedTasks as any,
                    blockers: selectedLog.blockers,
                  }
                : undefined
            }
            onSaved={refetch}
          />
        </div>
        <div>
          <DailyLogCalendar
            logs={logs}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        </div>
      </div>
      {/* 일일기록 히스토리 */}
      <div className="mt-6">
        <DailyLogHistory
          logs={logs as any}
          onEdit={handleEditFromHistory}
          onDelete={handleDelete}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
}
