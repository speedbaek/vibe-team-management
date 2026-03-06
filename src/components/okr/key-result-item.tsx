"use client";

import { Checkbox } from "@/components/ui/checkbox";

interface KeyResultItemProps {
  kr: {
    id: string;
    description: string;
    completed: boolean;
  };
  goalId: string;
  onUpdated: () => void;
}

export function KeyResultItem({ kr, goalId, onUpdated }: KeyResultItemProps) {
  const handleToggle = async (checked: boolean) => {
    await fetch(`/api/goals/${goalId}/key-results`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyResultId: kr.id, completed: checked }),
    });
    onUpdated();
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-md border">
      <Checkbox
        checked={kr.completed}
        onCheckedChange={(checked) => handleToggle(checked === true)}
      />
      <span
        className={`text-sm flex-1 ${
          kr.completed ? "line-through text-muted-foreground" : ""
        }`}
      >
        {kr.description}
      </span>
    </div>
  );
}
