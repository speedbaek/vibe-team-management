"use client";

import { useState, useEffect, useCallback } from "react";

interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

interface DailyLog {
  id: string;
  date: string;
  plannedTasks: TaskItem[];
  completedTasks: { id: string; text: string }[];
  blockers: string | null;
  mood: number | null;
}

export function useDailyLogs(month?: string) {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = month ? `?month=${month}` : "";
    const res = await fetch(`/api/daily-logs${params}`);
    const { data } = await res.json();
    setLogs(data || []);
    setLoading(false);
  }, [month]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, refetch: fetchLogs };
}
