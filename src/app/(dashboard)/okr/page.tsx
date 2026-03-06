"use client";

import { useState, useEffect } from "react";
import { GoalForm } from "@/components/okr/goal-form";
import { GoalCard } from "@/components/okr/goal-card";

export default function OKRPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
    setLoading(true);
    const res = await fetch("/api/goals");
    const { data } = await res.json();
    setGoals(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">목표 관리</h2>
        <GoalForm onCreated={fetchGoals} />
      </div>
      {loading ? (
        <p className="text-muted-foreground">불러오는 중...</p>
      ) : goals.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">등록된 목표가 없습니다</p>
          <p className="text-sm">
            새 목표를 등록하고 진행 상황을 관리해보세요.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onRefresh={fetchGoals} />
          ))}
        </div>
      )}
    </div>
  );
}
