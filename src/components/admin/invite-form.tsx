"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface InviteFormProps {
  onInvited: () => void;
}

export function InviteForm({ onInvited }: InviteFormProps) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({
        title: "초대 완료!",
        description: `초대장을 보냈습니다: ${email}`,
      });
      setEmail("");
      onInvited();
    } catch (e: any) {
      toast({
        title: "오류",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">팀원 초대하기</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Google 이메일</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@gmail.com"
          />
        </div>
        <Button
          onClick={handleInvite}
          disabled={sending || !email.trim()}
          className="w-full"
        >
          {sending ? "보내는 중..." : "초대장 보내기"}
        </Button>
      </CardContent>
    </Card>
  );
}
