import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { type, userId, weekStart } = await req.json();

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

    return NextResponse.json({ data: { report: text } });
  }

  return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
}
