import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { InviteClient } from "@/components/admin/invite-client";

export default async function AdminInvitePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN") redirect("/");

  const invitations = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">팀원 초대</h2>
      <InviteClient initialInvitations={JSON.parse(JSON.stringify(invitations))} />
    </div>
  );
}
