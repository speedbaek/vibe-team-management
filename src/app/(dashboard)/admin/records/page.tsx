import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MemberRecordsClient } from "@/components/admin/member-records-client";

export default async function AdminRecordsPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/");
  }

  const members = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      image: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">팀원 기록 열람</h2>
      <MemberRecordsClient members={JSON.parse(JSON.stringify(members))} />
    </div>
  );
}
