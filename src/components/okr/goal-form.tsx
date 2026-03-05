"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function getCurrentQuarter() {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

interface GoalFormProps {
  onCreated: () => void;
}

export function GoalForm({ onCreated }: GoalFormProps) {
  const [open, setOpen] = useState(false);
  const [objective, setObjective] = useState("");
  const [quarter, setQuarter] = useState(getCurrentQuarter());
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!objective.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective, quarter }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "등록 완료!", description: "새 목표가 등록되었습니다." });
      setObjective("");
      setOpen(false);
      onCreated();
    } catch {
      toast({
        title: "오류",
        description: "목표 등록에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          새 목표
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 목표 등록</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>목표 (Objective)</Label>
            <Input
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="예: 제품 품질 향상"
            />
          </div>
          <div className="space-y-2">
            <Label>분기</Label>
            <Input
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              placeholder="2026-Q1"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full"
          >
            {saving ? "등록 중..." : "등록하기"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
