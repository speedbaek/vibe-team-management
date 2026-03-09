import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

// 저장된 리포트 목록 조회
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "team-weekly";

  const reports = await prisma.teamReport.findMany({
    where: { type },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      generator: { select: { name: true } },
      targetUser: { select: { name: true } },
    },
  });

  return NextResponse.json({ data: reports });
}

// 리포트 생성 + DB 저장
export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { type, userId, weekStart } = await req.json();

  // 이번 주 월요일 계산
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const weekStartDate = weekStart ? new Date(weekStart) : monday;

  if (type === "member-weekly" && userId) {
    const startDate = weekStart
      ? new Date(weekStart)
      : new Date(Date.now() - 7 * 86400000);

    const [user, logs, goals, review] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, department: true },
      }),
      prisma.dailyLog.findMany({
        where: { userId, date: { gte: startDate } },
        orderBy: { date: "asc" },
        select: { date: true, plannedTasks: true, completedTasks: true },
      }),
      prisma.goal.findMany({
        where: { userId, status: "ACTIVE" },
        include: { keyResults: true },
      }),
      prisma.weeklyReview.findFirst({
        where: { userId, weekStart: { gte: startDate } },
        select: { achievements: true, nextWeekPlan: true },
      }),
    ]);

    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      prompt: `Summarize this team member's week concisely for their manager.
Focus on: what was accomplished, what's in progress, and any notable patterns.
Keep it under 200 words. Be factual. Respond in Korean.

Member: ${user?.name || "Unknown"} (${user?.department || "N/A"})
Daily Logs: ${JSON.stringify(logs)}
Goals: ${JSON.stringify(goals)}
Weekly Review: ${JSON.stringify(review)}`,
    });

    // DB에 저장
    await prisma.teamReport.create({
      data: {
        type: "member-weekly",
        content: text,
        weekStart: weekStartDate,
        generatedBy: session!.user.id,
        targetUserId: userId,
      },
    });

    return NextResponse.json({ data: { report: text } });
  }

  if (type === "team-weekly") {
    const startDate = weekStart
      ? new Date(weekStart)
      : new Date(Date.now() - 7 * 86400000);

    const members = await prisma.user.findMany({
      select: {
        name: true,
        department: true,
        dailyLogs: {
          where: { date: { gte: startDate } },
          select: { plannedTasks: true, completedTasks: true },
        },
        goals: {
          where: { status: "ACTIVE" },
          select: { objective: true, progress: true },
        },
      },
    });

    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      prompt: `Summarize the team's weekly performance for the manager.
Highlight: team achievements, areas of concern, and recommendations.
Keep it under 300 words. Respond in Korean.

Team Data: ${JSON.stringify(members)}`,
    });

    // DB에 저장
    await prisma.teamReport.create({
      data: {
        type: "team-weekly",
        content: text,
        weekStart: weekStartDate,
        generatedBy: session!.user.id,
      },
    });

    return NextResponse.json({ data: { report: text } });
  }

  return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
}
