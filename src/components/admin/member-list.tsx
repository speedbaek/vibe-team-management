"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
  onMemberRemoved?: () => void;
}

export function MemberList({ members, onMemberRemoved }: MemberListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (member: Member) => {
    const confirmed = confirm(
      `"${member.name || member.email}" 팀원을 삭제하시겠습니까?\n\n이 팀원의 모든 데이터(일일기록, 주간회고, 목표, AI 채팅)가 함께 삭제됩니다.`
    );
    if (!confirmed) return;

    setDeletingId(member.id);
    try {
      const res = await fetch("/api/admin/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.id }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        toast({ title: error || "삭제에 실패했습니다.", variant: "destructive" });
        return;
      }

      toast({ title: `${member.name || member.email} 팀원이 삭제되었습니다.` });
      onMemberRemoved?.();
    } catch {
      toast({ title: "삭제 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-lg border">
      <div className="grid grid-cols-7 gap-4 p-3 border-b font-medium text-sm text-muted-foreground">
        <div className="col-span-2">이름</div>
        <div>역할</div>
        <div>부서</div>
        <div>활동</div>
        <div>AI 코치</div>
        <div className="text-center">관리</div>
      </div>
      {members.map((m) => (
        <div
          key={m.id}
          className="grid grid-cols-7 gap-4 p-3 border-b last:border-0 items-center text-sm"
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
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(m)}
              disabled={deletingId === m.id}
              title="팀원 삭제"
            >
              {deletingId === m.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
