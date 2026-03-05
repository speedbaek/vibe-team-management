"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface KeyResultItemProps {
  kr: {
    id: string;
    description: string;
    targetValue: number;
    currentValue: number;
    unit: string | null;
  };
  goalId: string;
  onUpdated: () => void;
}

export function KeyResultItem({ kr, goalId, onUpdated }: KeyResultItemProps) {
  const [value, setValue] = useState(String(kr.currentValue));
  const progress = Math.round((kr.currentValue / kr.targetValue) * 100);

  const handleUpdate = async () => {
    const numVal = parseFloat(value);
    if (isNaN(numVal) || numVal < 0) return;
    await fetch(`/api/goals/${goalId}/key-results`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyResultId: kr.id, currentValue: numVal }),
    });
    onUpdated();
  };

  return (
    <div className="space-y-2 p-3 rounded-md border">
      <p className="text-sm font-medium">{kr.description}</p>
      <div className="flex items-center gap-2">
        <Progress value={progress} className="flex-1 h-2" />
        <span className="text-xs text-muted-foreground w-10 text-right">
          {progress}%
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-8 w-24 text-sm"
        />
        <span className="text-xs text-muted-foreground">
          / {kr.targetValue} {kr.unit || ""}
        </span>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          onClick={handleUpdate}
        >
          수정
        </Button>
      </div>
    </div>
  );
}
