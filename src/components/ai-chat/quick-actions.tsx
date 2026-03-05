"use client";

import { CalendarDays, FileText, Target, MessageSquare } from "lucide-react";

const actions = [
  {
    icon: CalendarDays,
    label: "오늘 업무 정리",
    message: "오늘 업무 정리 도와줘",
    color: "text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200",
  },
  {
    icon: FileText,
    label: "주간 회고 작성",
    message: "이번 주 주간 회고 작성을 도와줘",
    color: "text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-200",
  },
  {
    icon: Target,
    label: "목표 세우기",
    message: "이번 분기 목표 세우는 걸 도와줘",
    color: "text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-200",
  },
  {
    icon: MessageSquare,
    label: "업무 고민 상담",
    message: "업무에서 고민이 있어서 상담하고 싶어요",
    color: "text-green-600 bg-green-50 hover:bg-green-100 border-green-200",
  },
];

interface QuickActionsProps {
  onSelect: (message: string) => void;
}

export function QuickActions({ onSelect }: QuickActionsProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
          <MessageSquare className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">AI 코치</h2>
        <p className="text-sm text-muted-foreground mt-1">
          무엇을 도와드릴까요?
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => onSelect(action.message)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${action.color}`}
          >
            <action.icon className="h-6 w-6" />
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
