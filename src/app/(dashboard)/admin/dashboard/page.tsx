"use client";

import { useState, useEffect, useCallback } from "react";
import { MemberList } from "@/components/admin/member-list";
import { TeamReport } from "@/components/admin/team-report";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function getDefaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export default function AdminDashboardPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const defaults = getDefaultRange();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [activeFilter, setActiveFilter] = useState<{ from: string; to: string } | null>(null);

  const fetchMembers = useCallback(
    (dateFrom?: string, dateTo?: string) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      const qs = params.toString();
      fetch(`/api/admin/members${qs ? `?${qs}` : ""}`)
        .then((r) => r.json())
        .then(({ data }) => {
          setMembers(data || []);
          setLoading(false);
        });
    },
    []
  );

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleFilter = () => {
    setActiveFilter({ from, to });
    fetchMembers(from, to);
  };

  const handleReset = () => {
    setActiveFilter(null);
    setFrom(defaults.from);
    setTo(defaults.to);
    fetchMembers();
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">팀 대시보드</h2>
      <div className="space-y-6">
        <TeamReport type="team-weekly" />
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">팀원 현황</h3>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-8 text-sm w-36"
              />
              <span className="text-sm text-muted-foreground">~</span>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-8 text-sm w-36"
              />
              <Button size="sm" className="h-8" onClick={handleFilter}>
                조회
              </Button>
              {activeFilter && (
                <Button size="sm" variant="ghost" className="h-8" onClick={handleReset}>
                  초기화
                </Button>
              )}
            </div>
          </div>
          {activeFilter && (
            <p className="text-xs text-muted-foreground mb-2">
              AI 코치 통계: {activeFilter.from} ~ {activeFilter.to} 기간 필터 적용 중
            </p>
          )}
          {loading ? (
            <p className="text-muted-foreground">불러오는 중...</p>
          ) : (
            <MemberList members={members} />
          )}
        </div>
      </div>
    </div>
  );
}
