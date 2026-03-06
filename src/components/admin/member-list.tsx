"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";

interface Member {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  department: string | null;
  image: string | null;
  _count: { dailyLogs: number; weeklyReviews: number; goals: number };
  aiChatStats?: {
    sessions: number;
    questions: number;
    answers: number;
  };
}

interface MemberListProps {
  members: Member[];
}

export function MemberList({ members }: MemberListProps) {
  return (
    <div className="rounded-lg border">
      <div className="grid grid-cols-6 gap-4 p-3 border-b font-medium text-sm text-muted-foreground">
        <div className="col-span-2">이름</div>
        <div>역할</div>
        <div>부서</div>
        <div>활동</div>
        <div>AI 코치</div>
      </div>
      {members.map((m) => (
        <div
          key={m.id}
          className="grid grid-cols-6 gap-4 p-3 border-b last:border-0 items-center text-sm"
        >
          <div className="col-span-2 flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={m.image || ""} />
              <AvatarFallback className="text-xs">
                {m.name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{m.name || "미등록"}</p>
              <p className="text-xs text-muted-foreground">{m.email}</p>
            </div>
          </div>
          <Badge
            variant={m.role === "ADMIN" ? "default" : "secondary"}
            className="text-xs w-fit"
          >
            {m.role}
          </Badge>
          <span className="text-muted-foreground">
            {m.department || "-"}
          </span>
          <span className="text-xs text-muted-foreground">
            {m._count.dailyLogs} 기록, {m._count.goals} 목표
          </span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            {m.aiChatStats ? (
              <span>
                {m.aiChatStats.sessions}회, {m.aiChatStats.questions}개 질문
              </span>
            ) : (
              <span>-</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
