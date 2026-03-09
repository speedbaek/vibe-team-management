import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MemberList } from "@/components/admin/member-list";

export default async function AdminMembersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN") redirect("/");

  const members = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      image: true,
      createdAt: true,
      _count: {
        select: { dailyLogs: true, weeklyReviews: true, goals: true, aiChatSessions: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const perUserStats = await Promise.all(
    members.map(async (m) => {
      const [sessionCount, counts] = await Promise.all([
        prisma.aIChatSession.count({ where: { userId: m.id } }),
        prisma.aIChatMessage.groupBy({
          by: ["role"],
          _count: true,
          where: { session: { userId: m.id } },
        }),
      ]);
      return {
        userId: m.id,
        sessions: sessionCount,
        userMessages: counts.find((c) => c.role === "user")?._count ?? 0,
        assistantMessages: counts.find((c) => c.role === "assistant")?._count ?? 0,
      };
    })
  );

  const data = members.map((m) => {
    const stats = perUserStats.find((s) => s.userId === m.id);
    return {
      ...m,
      aiChatStats: {
        sessions: stats?.sessions ?? 0,
        questions: stats?.userMessages ?? 0,
        answers: stats?.assistantMessages ?? 0,
      },
    };
  });

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">팀원 관리</h2>
      <MemberList initialMembers={JSON.parse(JSON.stringify(data))} />
    </div>
  );
}
