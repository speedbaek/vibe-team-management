"use client";

import { useState, useEffect } from "react";
import { MemberList } from "@/components/admin/member-list";
import { TeamReport } from "@/components/admin/team-report";

export default function AdminDashboardPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/members")
      .then((r) => r.json())
      .then(({ data }) => {
        setMembers(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">팀 대시보드</h2>
      <div className="space-y-6">
        <TeamReport type="team-weekly" />
        <div>
          <h3 className="text-lg font-semibold mb-3">팀원 현황</h3>
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
