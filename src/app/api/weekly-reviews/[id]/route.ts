import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const review = await prisma.weeklyReview.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!review) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: review });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.weeklyReview.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const review = await prisma.weeklyReview.update({
    where: { id },
    data: {
      achievements: body.achievements ?? existing.achievements,
      lessons: body.lessons ?? existing.lessons,
      helpNeeded: body.helpNeeded ?? existing.helpNeeded,
      nextWeekPlan: body.nextWeekPlan ?? existing.nextWeekPlan,
    },
  });

  return NextResponse.json({ data: review });
}
