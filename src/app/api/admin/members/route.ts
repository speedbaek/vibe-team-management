import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

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

  // 사용자별 AI 메시지 수 조회 (질문/답변)
  const perUserStats = await Promise.all(
    members.map(async (m) => {
      const counts = await prisma.aIChatMessage.groupBy({
        by: ["role"],
        _count: true,
        where: { session: { userId: m.id } },
      });
      return {
        userId: m.id,
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
        sessions: m._count.aiChatSessions,
        questions: stats?.userMessages ?? 0,
        answers: stats?.assistantMessages ?? 0,
      },
    };
  });

  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { userId, role } = await req.json();
  if (!userId || !["ADMIN", "MEMBER"].includes(role)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  return NextResponse.json({ data: user });
}
