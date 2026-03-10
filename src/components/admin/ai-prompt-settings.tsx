"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Settings, Save, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

export function AIPromptSettings() {
  const [customPrompt, setCustomPrompt] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then(({ data }) => {
        setCustomPrompt(data.customPrompt || "");
        setOriginalPrompt(data.customPrompt || "");
        setUpdatedAt(data.updatedAt);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customPrompt }),
      });

      if (!res.ok) throw new Error("저장 실패");

      const { data } = await res.json();
      setOriginalPrompt(data.customPrompt || "");
      setUpdatedAt(data.updatedAt);
      toast({ title: "AI 코치 프롬프트가 저장되었습니다." });
    } catch {
      toast({ title: "저장 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCustomPrompt(originalPrompt);
  };

  const hasChanges = customPrompt !== originalPrompt;

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI 코치 프롬프트 설정
          </div>
          {isOpen ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </CardTitle>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            여기에 입력한 내용이 AI 코치의 시스템 프롬프트에 추가됩니다.
            팀원들과 대화할 때 AI의 답변 스타일, 주제, 규칙 등을 지정할 수
            있습니다.
          </p>

          <div className="space-y-2">
            <p className="text-sm font-medium">예시:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>답변은 항상 3줄 이내로 간결하게 해주세요</li>
              <li>
                업무와 관련 없는 질문에는 정중하게 업무 관련 대화로 유도해주세요
              </li>
              <li>목표 설정 시 반드시 측정 가능한 수치를 포함하도록 안내해주세요</li>
              <li>
                매일 퇴근 전 오늘의 성과 3가지를 정리하도록 권유해주세요
              </li>
            </ul>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">불러오는 중...</p>
          ) : (
            <>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="AI 코치에게 전달할 추가 지침을 입력하세요..."
                rows={6}
                className="resize-y"
              />

              {updatedAt && (
                <p className="text-xs text-muted-foreground">
                  마지막 수정:{" "}
                  {new Date(updatedAt).toLocaleString("ko-KR")}
                </p>
              )}

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "저장 중..." : "저장"}
                </Button>
                {hasChanges && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleReset}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    되돌리기
                  </Button>
                )}
                {customPrompt.trim() !== "" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCustomPrompt("");
                    }}
                    className="ml-auto text-destructive"
                  >
                    전체 삭제
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
