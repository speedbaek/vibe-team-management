"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  return monday.toISOString().split("T")[0];
}

interface WeeklyReviewFormProps {
  initialData?: {
    achievements: string;
    lessons: string | null;
    helpNeeded: string | null;
    nextWeekPlan: string;
  };
  onSaved: () => void;
}

export function WeeklyReviewForm({
  initialData,
  onSaved,
}: WeeklyReviewFormProps) {
  const [achievements, setAchievements] = useState(
    initialData?.achievements || ""
  );
  const [lessons, setLessons] = useState(initialData?.lessons || "");
  const [helpNeeded, setHelpNeeded] = useState(initialData?.helpNeeded || "");
  const [nextWeekPlan, setNextWeekPlan] = useState(
    initialData?.nextWeekPlan || ""
  );
  const [saving, setSaving] = useState(false);

  const weekStart = getWeekStart();

  const handleSave = async () => {
    if (!achievements.trim() || !nextWeekPlan.trim()) {
      toast({
        title: "오류",
        description: "성과와 다음 주 계획은 필수 항목입니다.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/weekly-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStart,
          achievements,
          lessons: lessons || undefined,
          helpNeeded: helpNeeded || undefined,
          nextWeekPlan,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "저장 완료!", description: "주간 회고가 저장되었습니다." });
      onSaved();
    } catch {
      toast({
        title: "오류",
        description: "주간 회고 저장에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          주간 회고 - {weekStart}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="font-semibold">이번 주 성과 *</Label>
          <Textarea
            value={achievements}
            onChange={(e) => setAchievements(e.target.value)}
            placeholder="이번 주에 이룬 성과를 적어주세요"
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label className="font-semibold">배운 점</Label>
          <Textarea
            value={lessons}
            onChange={(e) => setLessons(e.target.value)}
            placeholder="이번 주에 배운 것이 있나요?"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label className="font-semibold">도움이 필요한 것</Label>
          <Textarea
            value={helpNeeded}
            onChange={(e) => setHelpNeeded(e.target.value)}
            placeholder="팀이나 동료에게 필요한 도움이 있나요?"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label className="font-semibold">다음 주 계획 *</Label>
          <Textarea
            value={nextWeekPlan}
            onChange={(e) => setNextWeekPlan(e.target.value)}
            placeholder="다음 주에 집중할 일을 적어주세요"
            rows={4}
          />
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "저장 중..." : "회고 저장하기"}
        </Button>
      </CardContent>
    </Card>
  );
}
