"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TeamReportProps {
  type: "member-weekly" | "team-weekly";
  userId?: string;
  userName?: string;
}

export function TeamReport({ type, userId, userName }: TeamReportProps) {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, userId }),
      });
      const { data } = await res.json();
      setReport(data?.report || "리포트를 생성하지 못했습니다.");
    } catch {
      setReport("리포트 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">
          {type === "team-weekly"
            ? "팀 주간 리포트"
            : `${userName || "멤버"} 주간 리포트`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {report ? (
          <div className="whitespace-pre-wrap text-sm text-muted-foreground">
            {report}
          </div>
        ) : (
          <Button
            onClick={generateReport}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? "생성 중..." : "AI 리포트 생성"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
