"use client";

import { useState } from "react";
import { DailyLogForm } from "@/components/daily-log/daily-log-form";
import { DailyLogCalendar } from "@/components/daily-log/daily-log-calendar";
import { useDailyLogs } from "@/hooks/use-daily-logs";

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
  const { logs, refetch } = useDailyLogs(currentMonth);

  const selectedLog = logs.find((l) => {
    const logDate = new Date(l.date).toISOString().split("T")[0];
    return logDate === selectedDate;
  });

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">일일 업무 기록</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DailyLogForm
            key={selectedDate}
            date={selectedDate}
            initialData={
              selectedLog
                ? {
                    plannedTasks: selectedLog.plannedTasks as any,
                    completedTasks: selectedLog.completedTasks as any,
                    blockers: selectedLog.blockers,
                    mood: selectedLog.mood,
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
    </div>
  );
}
