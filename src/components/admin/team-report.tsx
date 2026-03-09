"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, FileText, Loader2 } from "lucide-react";

interface SavedReport {
  id: string;
  type: string;
  content: string;
  weekStart: string;
  createdAt: string;
  generator: { name: string | null };
  targetUser?: { name: string | null } | null;
}

interface TeamReportProps {
  type: "member-weekly" | "team-weekly";
  userId?: string;
  userName?: string;
}

export function TeamReport({ type, userId, userName }: TeamReportProps) {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<SavedReport[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 저장된 리포트 히스토리 로드
  useEffect(() => {
    fetchHistory();
  }, [type]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?type=${type}`);
      if (res.ok) {
        const { data } = await res.json();
        setHistory(data || []);
      }
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, userId }),
      });
      const { data } = await res.json();
      const text = data?.report || "리포트를 생성하지 못했습니다.";
      setReport(text);
      // 히스토리 새로고침
      fetchHistory();
    } catch {
      setReport("리포트 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* 새 리포트 생성 */}
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
            <div className="space-y-3">
              <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                {report}
              </div>
              <Button
                onClick={generateReport}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  "다시 생성"
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={generateReport}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  생성 중...
                </>
              ) : (
                "AI 리포트 생성"
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 리포트 히스토리 */}
      <Card>
        <CardHeader className="pb-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full"
          >
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              지난 리포트
              {!historyLoading && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({history.length}건)
                </span>
              )}
            </CardTitle>
            {showHistory ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CardHeader>
        {showHistory && (
          <CardContent>
            {historyLoading ? (
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground">저장된 리포트가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {history.map((r) => (
                  <div key={r.id} className="border rounded-lg">
                    <button
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                      className="flex items-center justify-between w-full px-3 py-2 text-left text-sm hover:bg-muted/50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium shrink-0">
                          {formatDate(r.weekStart)} 주
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {r.generator.name || "관리자"} 생성
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                        {formatDateTime(r.createdAt)}
                      </span>
                    </button>
                    {expandedId === r.id && (
                      <div className="px-3 pb-3 border-t">
                        <div className="whitespace-pre-wrap text-sm text-muted-foreground pt-2">
                          {r.content}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
