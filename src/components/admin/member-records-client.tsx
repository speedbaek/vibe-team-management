"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  FileText,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";

interface Member {
  id: string;
  name: string | null;
  email: string;
  department: string | null;
  image: string | null;
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface DailyLogRecord {
  id: string;
  date: string;
  plannedTasks: Task[];
  completedTasks: { id: string; text: string }[];
  blockers: string | null;
  createdAt: string;
}

interface WeeklyReviewRecord {
  id: string;
  weekStart: string;
  achievements: string;
  lessons: string | null;
  helpNeeded: string | null;
  nextWeekPlan: string;
  createdAt: string;
}

interface MemberRecordsClientProps {
  members: Member[];
}

type TabType = "daily-logs" | "weekly-reviews";

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function MemberRecordsClient({ members }: MemberRecordsClientProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("daily-logs");
  const [month, setMonth] = useState(getCurrentMonth());
  const [dailyLogs, setDailyLogs] = useState<DailyLogRecord[]>([]);
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReviewRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  useEffect(() => {
    if (!selectedMemberId) return;
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMemberId, activeTab, month]);

  const fetchRecords = async () => {
    if (!selectedMemberId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: activeTab });
      if (activeTab === "daily-logs") params.set("month", month);

      const res = await fetch(
        `/api/admin/members/${selectedMemberId}/records?${params}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const { data } = await res.json();

      if (activeTab === "daily-logs") {
        setDailyLogs(data.records);
      } else {
        setWeeklyReviews(data.records);
      }
    } catch {
      // error handling
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const monthLabel = (() => {
    const [y, m] = month.split("-").map(Number);
    return `${y}년 ${m}월`;
  })();

  return (
    <div className="space-y-6">
      {/* 팀원 선택 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">팀원 선택</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {members.map((member) => (
              <Button
                key={member.id}
                variant={selectedMemberId === member.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMemberId(member.id)}
                className="gap-2"
              >
                <User className="h-3.5 w-3.5" />
                <span>{member.name || member.email}</span>
                {member.department && (
                  <span className="text-xs opacity-70">
                    ({member.department})
                  </span>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedMember && (
        <>
          {/* 탭 선택 */}
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === "daily-logs" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("daily-logs")}
              className="gap-2"
            >
              <CalendarDays className="h-4 w-4" />
              일일기록
            </Button>
            <Button
              variant={activeTab === "weekly-reviews" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("weekly-reviews")}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              주간회고
            </Button>

            {/* 월 선택 (일일기록일 때만) */}
            {activeTab === "daily-logs" && (
              <div className="flex items-center gap-1 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => changeMonth(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[80px] text-center">
                  {monthLabel}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => changeMonth(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* 기록 내용 */}
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                불러오는 중...
              </CardContent>
            </Card>
          ) : activeTab === "daily-logs" ? (
            <DailyLogList logs={dailyLogs} memberName={selectedMember.name} />
          ) : (
            <WeeklyReviewList
              reviews={weeklyReviews}
              memberName={selectedMember.name}
            />
          )}
        </>
      )}

      {!selectedMember && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            위에서 팀원을 선택하면 기록을 열람할 수 있습니다.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DailyLogList({
  logs,
  memberName,
}: {
  logs: DailyLogRecord[];
  memberName: string | null;
}) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          이 기간에 작성된 일일기록이 없습니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {memberName}님의 일일기록 ({logs.length}건)
      </p>
      {logs.map((log) => {
        const tasks = (log.plannedTasks || []) as Task[];
        const completedCount = tasks.filter((t) => t.completed).length;
        const dateStr = new Date(log.date).toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        });

        return (
          <Card key={log.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between flex-wrap gap-2">
                <span>{dateStr}</span>
                {tasks.length > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      completedCount === tasks.length && tasks.length > 0
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {completedCount}/{tasks.length} 완료
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">할 일</p>
                  <div className="space-y-1">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="text-xs">
                          {task.completed ? "\u2705" : "\u2b1c"}
                        </span>
                        <span
                          className={
                            task.completed
                              ? "line-through text-muted-foreground"
                              : ""
                          }
                        >
                          {task.text || "(내용 없음)"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {log.blockers && (
                <div>
                  <p className="text-sm font-medium mb-1">하루 정리 / 고민</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {log.blockers}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function WeeklyReviewList({
  reviews,
  memberName,
}: {
  reviews: WeeklyReviewRecord[];
  memberName: string | null;
}) {
  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          작성된 주간회고가 없습니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {memberName}님의 주간회고 ({reviews.length}건)
      </p>
      {reviews.map((review) => {
        const weekStartDate = new Date(review.weekStart);
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 6);

        const weekLabel = `${weekStartDate.toLocaleDateString("ko-KR", {
          month: "long",
          day: "numeric",
        })} ~ ${weekEndDate.toLocaleDateString("ko-KR", {
          month: "long",
          day: "numeric",
        })}`;

        return (
          <Card key={review.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{weekLabel}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">이번 주 성과</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {review.achievements}
                </p>
              </div>

              {review.lessons && (
                <div>
                  <p className="text-sm font-medium mb-1">배운 점 / 교훈</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {review.lessons}
                  </p>
                </div>
              )}

              {review.helpNeeded && (
                <div>
                  <p className="text-sm font-medium mb-1">도움이 필요한 부분</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {review.helpNeeded}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-1">다음 주 계획</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {review.nextWeekPlan}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
