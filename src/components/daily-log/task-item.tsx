"use client";

import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TaskItemProps {
  id: string;
  text: string;
  completed: boolean;
  onToggle: (id: string) => void;
  onChange: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({
  id,
  text,
  completed,
  onToggle,
  onChange,
  onDelete,
}: TaskItemProps) {
  return (
    <div className="flex items-center gap-2 group">
      <input
        type="checkbox"
        checked={completed}
        onChange={() => onToggle(id)}
        className="h-4 w-4 rounded border-gray-300"
      />
      <Input
        value={text}
        onChange={(e) => onChange(id, e.target.value)}
        className={`flex-1 h-8 text-sm ${
          completed ? "line-through text-muted-foreground" : ""
        }`}
        placeholder="할 일을 입력하세요..."
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onDelete(id)}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
