"use client";

import { useState, useEffect } from "react";
import { MemberList } from "@/components/admin/member-list";

export default function AdminMembersPage() {
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
      <h2 className="text-2xl font-bold mb-6">팀원 관리</h2>
      {loading ? (
        <p className="text-muted-foreground">불러오는 중...</p>
      ) : (
        <MemberList members={members} />
      )}
    </div>
  );
}
