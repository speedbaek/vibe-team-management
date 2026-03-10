import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { userId } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "daily-logs" | "weekly-reviews"
  const month = searchParams.get("month"); // "2026-03" format

  // 대상 사용자 확인
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, department: true },
  });

  if (!user) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  if (type === "daily-logs") {
    const dateFilter = month
      ? {
          date: {
            gte: new Date(`${month}-01`),
            lt: new Date(
              new Date(`${month}-01`).getFullYear(),
              new Date(`${month}-01`).getMonth() + 1,
              1
            ),
          },
        }
      : {};

    const dailyLogs = await prisma.dailyLog.findMany({
      where: { userId, ...dateFilter },
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        plannedTasks: true,
        completedTasks: true,
        blockers: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: { user, records: dailyLogs } });
  }

  if (type === "weekly-reviews") {
    const weeklyReviews = await prisma.weeklyReview.findMany({
      where: { userId },
      orderBy: { weekStart: "desc" },
      take: 20,
      select: {
        id: true,
        weekStart: true,
        achievements: true,
        lessons: true,
        helpNeeded: true,
        nextWeekPlan: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: { user, records: weeklyReviews } });
  }

  return NextResponse.json({ error: "type 파라미터가 필요합니다." }, { status: 400 });
}
