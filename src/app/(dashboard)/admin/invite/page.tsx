"use client";

import { useState, useEffect } from "react";
import { InviteForm } from "@/components/admin/invite-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminInvitePage() {
  const [invitations, setInvitations] = useState<any[]>([]);

  const fetchInvitations = async () => {
    const res = await fetch("/api/admin/invite");
    const { data } = await res.json();
    setInvitations(data || []);
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">팀원 초대</h2>
      <div className="space-y-6">
        <InviteForm onInvited={fetchInvitations} />
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">초대 현황</CardTitle>
          </CardHeader>
          <CardContent>
            {invitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                보낸 초대가 없습니다.
              </p>
            ) : (
              <div className="space-y-2">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                  >
                    <span>{inv.email}</span>
                    <Badge
                      variant={
                        inv.status === "ACCEPTED"
                          ? "default"
                          : inv.status === "PENDING"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {inv.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
