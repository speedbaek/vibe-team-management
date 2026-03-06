"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target, Save, CheckCircle2, Plus, Trash2 } from "lucide-react";

interface KeyResultDraft {
  description: string;
}

interface GoalDraft {
  objective: string;
  quarter: string;
  keyResults: KeyResultDraft[];
}

interface GoalDraftCardProps {
  draft: GoalDraft;
}

export function GoalDraftCard({ draft }: GoalDraftCardProps) {
  const [objective, setObjective] = useState(draft.objective);
  const [quarter, setQuarter] = useState(draft.quarter);
  const [keyResults, setKeyResults] = useState<KeyResultDraft[]>(
    draft.keyResults
  );
  const [saveState, setSaveState] = useState<"draft" | "saving" | "saved">(
    "draft"
  );

  const updateKR = (index: number, value: string) => {
    setKeyResults((prev) =>
      prev.map((kr, i) => (i === index ? { description: value } : kr))
    );
  };

  const removeKR = (index: number) => {
    setKeyResults((prev) => prev.filter((_, i) => i !== index));
  };

  const addKR = () => {
    setKeyResults((prev) => [...prev, { description: "" }]);
  };

  const handleSave = async () => {
    setSaveState("saving");
    try {
      // 1. 목표 생성
      const goalRes = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective, quarter }),
      });

      if (!goalRes.ok) throw new Error("목표 저장 실패");
      const { data: goal } = await goalRes.json();

      // 2. 할 일 항목 생성
      for (const kr of keyResults) {
        if (!kr.description.trim()) continue;
        const krRes = await fetch(`/api/goals/${goal.id}/key-results`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: kr.description }),
        });
        if (!krRes.ok) throw new Error("항목 저장 실패");
      }

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
            목표 &quot;{objective}&quot;가 저장되었습니다.
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-4 border-orange-200 bg-orange-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Target className="h-4 w-4 text-orange-600" />
          목표 초안
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 목표 */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              목표 *
            </label>
            <Input
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="w-28">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              분기
            </label>
            <Input
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        {/* 할 일 목록 */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            할 일 목록
          </label>
          <div className="space-y-2">
            {keyResults.map((kr, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  value={kr.description}
                  onChange={(e) => updateKR(i, e.target.value)}
                  placeholder="할 일을 입력하세요"
                  className="text-sm flex-1"
                />
                <button
                  onClick={() => removeKR(i)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addKR}
            className="mt-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            할 일 추가
          </Button>
        </div>

        <Button
          onClick={handleSave}
          disabled={saveState === "saving" || !objective.trim()}
          className="w-full"
          size="sm"
        >
          <Save className="h-4 w-4 mr-2" />
          {saveState === "saving" ? "저장 중..." : "목표 저장하기"}
        </Button>
      </CardContent>
    </Card>
  );
}
