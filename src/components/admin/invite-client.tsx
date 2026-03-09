"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InviteForm } from "@/components/admin/invite-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InviteClientProps {
  initialInvitations: any[];
}

export function InviteClient({ initialInvitations }: InviteClientProps) {
  const router = useRouter();
  const [invitations, setInvitations] = useState(initialInvitations);

  const handleRefresh = async () => {
    try {
      const res = await fetch("/api/admin/invite");
      const { data } = await res.json();
      setInvitations(data || []);
    } catch {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <InviteForm onInvited={handleRefresh} />
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
              {invitations.map((inv: any) => (
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
  );
}
