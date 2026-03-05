import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { weeklyReviewSchema as createSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviews = await prisma.weeklyReview.findMany({
    where: { userId: session.user.id },
    orderBy: { weekStart: "desc" },
    take: 20,
  });

  return NextResponse.json({ data: reviews });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { weekStart, achievements, lessons, helpNeeded, nextWeekPlan } =
    parsed.data;

  const review = await prisma.weeklyReview.upsert({
    where: {
      userId_weekStart: {
        userId: session.user.id,
        weekStart: new Date(weekStart),
      },
    },
    create: {
      userId: session.user.id,
      weekStart: new Date(weekStart),
      achievements,
      lessons,
      helpNeeded,
      nextWeekPlan,
    },
    update: { achievements, lessons, helpNeeded, nextWeekPlan },
  });

  return NextResponse.json({ data: review }, { status: 201 });
}
