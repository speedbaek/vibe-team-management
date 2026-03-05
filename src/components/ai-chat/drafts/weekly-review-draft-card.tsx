"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Save, CheckCircle2 } from "lucide-react";

interface WeeklyReviewDraft {
  weekStart: string;
  achievements: string;
  lessons?: string;
  helpNeeded?: string;
  nextWeekPlan: string;
}

interface WeeklyReviewDraftCardProps {
  draft: WeeklyReviewDraft;
}

export function WeeklyReviewDraftCard({ draft }: WeeklyReviewDraftCardProps) {
  const [achievements, setAchievements] = useState(draft.achievements);
  const [lessons, setLessons] = useState(draft.lessons || "");
  const [helpNeeded, setHelpNeeded] = useState(draft.helpNeeded || "");
  const [nextWeekPlan, setNextWeekPlan] = useState(draft.nextWeekPlan);
  const [saveState, setSaveState] = useState<"draft" | "saving" | "saved">(
    "draft"
  );

  const handleSave = async () => {
    setSaveState("saving");
    try {
      const res = await fetch("/api/weekly-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStart: draft.weekStart,
          achievements,
          lessons: lessons || undefined,
          helpNeeded: helpNeeded || undefined,
          nextWeekPlan,
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
            {draft.weekStart} 주간 회고가 저장되었습니다.
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-4 border-purple-200 bg-purple-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4 text-purple-600" />
          주간 회고 초안 — {draft.weekStart} 주
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            이번 주 성과 *
          </label>
          <Textarea
            value={achievements}
            onChange={(e) => setAchievements(e.target.value)}
            rows={3}
            className="text-sm resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            배운 점
          </label>
          <Textarea
            value={lessons}
            onChange={(e) => setLessons(e.target.value)}
            rows={2}
            className="text-sm resize-none"
            placeholder="이번 주에 배운 것이 있다면..."
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            도움이 필요한 부분
          </label>
          <Textarea
            value={helpNeeded}
            onChange={(e) => setHelpNeeded(e.target.value)}
            rows={2}
            className="text-sm resize-none"
            placeholder="팀에게 요청하고 싶은 것이 있다면..."
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            다음 주 계획 *
          </label>
          <Textarea
            value={nextWeekPlan}
            onChange={(e) => setNextWeekPlan(e.target.value)}
            rows={3}
            className="text-sm resize-none"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={
            saveState === "saving" ||
            !achievements.trim() ||
            !nextWeekPlan.trim()
          }
          className="w-full"
          size="sm"
        >
          <Save className="h-4 w-4 mr-2" />
          {saveState === "saving" ? "저장 중..." : "주간 회고 저장하기"}
        </Button>
      </CardContent>
    </Card>
  );
}
