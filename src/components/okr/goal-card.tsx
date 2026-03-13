"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyResultItem } from "./key-result-item";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
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
      completed: boolean;
    }>;
  };
  onRefresh: () => void;
}

export function GoalCard({ goal, onRefresh }: GoalCardProps) {
  const [showAddKR, setShowAddKR] = useState(false);
  const [krDesc, setKrDesc] = useState("");
  const [editing, setEditing] = useState(false);
  const [editObjective, setEditObjective] = useState(goal.objective);
  const [editQuarter, setEditQuarter] = useState(goal.quarter);
  const [editSaving, setEditSaving] = useState(false);
  const objectiveInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) objectiveInputRef.current?.focus();
  }, [editing]);

  const handleEditSave = async () => {
    if (!editObjective.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective: editObjective, quarter: editQuarter }),
      });
      if (!res.ok) throw new Error();
      setEditing(false);
      onRefresh();
      toast({ title: "목표가 수정되었습니다." });
    } catch {
      toast({
        title: "오류",
        description: "목표 수정에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setEditSaving(false);
    }
  };

  const handleEditCancel = () => {
    setEditObjective(goal.objective);
    setEditQuarter(goal.quarter);
    setEditing(false);
  };

  const handleAddKR = async () => {
    if (!krDesc.trim()) return;
    try {
      const res = await fetch(`/api/goals/${goal.id}/key-results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: krDesc }),
      });
      if (!res.ok) throw new Error();
      setKrDesc("");
      setShowAddKR(false);
      onRefresh();
    } catch {
      toast({
        title: "오류",
        description: "항목 추가에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm("이 목표를 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onRefresh();
      toast({ title: "목표가 삭제되었습니다." });
    } catch {
      toast({
        title: "오류",
        description: "목표 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        {editing ? (
          <div className="space-y-2">
            <Input
              ref={objectiveInputRef}
              value={editObjective}
              onChange={(e) => setEditObjective(e.target.value)}
              placeholder="목표를 입력하세요"
              className="text-base font-semibold"
              onKeyDown={(e) => e.key === "Enter" && handleEditSave()}
            />
            <Input
              value={editQuarter}
              onChange={(e) => setEditQuarter(e.target.value)}
              placeholder="2026-Q1"
              className="text-sm w-32"
              onKeyDown={(e) => e.key === "Enter" && handleEditSave()}
            />
            <div className="flex gap-1">
              <Button size="sm" className="h-7" onClick={handleEditSave} disabled={editSaving}>
                <Check className="h-3 w-3 mr-1" />
                {editSaving ? "저장 중..." : "저장"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7" onClick={handleEditCancel}>
                <X className="h-3 w-3 mr-1" />
                취소
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{goal.objective}</CardTitle>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs">
                  {goal.quarter}
                </Badge>
                <button
                  onClick={() => setEditing(true)}
                  className="text-muted-foreground hover:text-primary p-1 rounded"
                  title="목표 수정"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="text-muted-foreground hover:text-destructive p-1 rounded"
                  title="목표 삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
        <div className="flex items-center gap-3 mt-2">
          <Progress value={goal.progress} className="flex-1 h-3" />
          <span className="text-sm font-medium">{goal.progress}%</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {goal.keyResults.map((kr) => (
          <KeyResultItem
            key={kr.id}
            kr={kr}
            goalId={goal.id}
            onUpdated={onRefresh}
          />
        ))}

        {showAddKR ? (
          <div className="flex gap-2 items-center p-2 border rounded-md bg-muted/50">
            <Input
              value={krDesc}
              onChange={(e) => setKrDesc(e.target.value)}
              placeholder="할 일을 입력하세요"
              className="h-8 text-sm flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleAddKR()}
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
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddKR(true)}
            className="w-full"
          >
            <Plus className="h-3 w-3 mr-1" />
            할 일 추가
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
