import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // 날짜 필터 조건
  const dateFilter = from || to
    ? {
        createdAt: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to + "T23:59:59.999Z") } : {}),
        },
      }
    : {};

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

  // 사용자별 AI 메시지 수 조회 (날짜 필터 적용)
  const perUserStats = await Promise.all(
    members.map(async (m) => {
      const [sessionCount, counts] = await Promise.all([
        prisma.aIChatSession.count({
          where: { userId: m.id, ...dateFilter },
        }),
        prisma.aIChatMessage.groupBy({
          by: ["role"],
          _count: true,
          where: {
            session: { userId: m.id },
            ...dateFilter,
          },
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

export async function DELETE(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // 자기 자신은 삭제 불가
  if (userId === session!.user.id) {
    return NextResponse.json(
      { error: "자기 자신은 삭제할 수 없습니다." },
      { status: 400 }
    );
  }

  // 대상 사용자 존재 여부 확인
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  // Cascade 삭제: 관련 데이터(일일기록, 주간회고, 목표, AI채팅 등) 자동 삭제
  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ success: true });
}
