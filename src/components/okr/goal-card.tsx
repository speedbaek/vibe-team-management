"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyResultItem } from "./key-result-item";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface GoalCardProps {
  goal: {
    id: string;
    objective: string;
    quarter: string;
    progress: number;
    status: string;
    keyResults: Array<{
      id: string;
      description: string;
      targetValue: number;
      currentValue: number;
      unit: string | null;
    }>;
  };
  onRefresh: () => void;
}

export function GoalCard({ goal, onRefresh }: GoalCardProps) {
  const [showAddKR, setShowAddKR] = useState(false);
  const [krDesc, setKrDesc] = useState("");
  const [krTarget, setKrTarget] = useState("100");
  const [krUnit, setKrUnit] = useState("");

  const handleAddKR = async () => {
    if (!krDesc.trim()) return;
    try {
      const res = await fetch(`/api/goals/${goal.id}/key-results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: krDesc,
          targetValue: parseFloat(krTarget) || 100,
          unit: krUnit || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setKrDesc("");
      setKrTarget("100");
      setKrUnit("");
      setShowAddKR(false);
      onRefresh();
    } catch {
      toast({
        title: "오류",
        description: "핵심 결과 추가에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{goal.objective}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {goal.quarter}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Progress value={goal.progress} className="flex-1 h-3" />
          <span className="text-sm font-medium">{goal.progress}%</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {goal.keyResults.map((kr) => (
          <KeyResultItem
            key={kr.id}
            kr={kr}
            goalId={goal.id}
            onUpdated={onRefresh}
          />
        ))}

        {showAddKR ? (
          <div className="space-y-2 p-3 border rounded-md bg-muted/50">
            <Input
              value={krDesc}
              onChange={(e) => setKrDesc(e.target.value)}
              placeholder="핵심 결과를 입력하세요"
              className="h-8 text-sm"
            />
            <div className="flex gap-2">
              <Input
                type="number"
                value={krTarget}
                onChange={(e) => setKrTarget(e.target.value)}
                placeholder="목표값"
                className="h-8 text-sm w-24"
              />
              <Input
                value={krUnit}
                onChange={(e) => setKrUnit(e.target.value)}
                placeholder="단위"
                className="h-8 text-sm w-24"
              />
              <Button size="sm" className="h-8" onClick={handleAddKR}>
                추가
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8"
                onClick={() => setShowAddKR(false)}
              >
                취소
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddKR(true)}
            className="w-full"
          >
            <Plus className="h-3 w-3 mr-1" />
            핵심 결과 추가
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
