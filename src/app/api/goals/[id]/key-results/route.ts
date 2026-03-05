import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createKRSchema = z.object({
  description: z.string().min(1),
  targetValue: z.number().positive(),
  unit: z.string().optional(),
});

const updateKRSchema = z.object({
  keyResultId: z.string(),
  currentValue: z.number().min(0),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: goalId } = await params;
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId: session.user.id },
  });
  if (!goal)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = createKRSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const kr = await prisma.keyResult.create({
    data: { goalId, ...parsed.data },
  });

  return NextResponse.json({ data: kr }, { status: 201 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: goalId } = await params;
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId: session.user.id },
  });
  if (!goal)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateKRSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await prisma.keyResult.update({
    where: { id: parsed.data.keyResultId },
    data: { currentValue: parsed.data.currentValue },
  });

  // Recalculate goal progress
  const allKRs = await prisma.keyResult.findMany({ where: { goalId } });
  const avgProgress = Math.round(
    allKRs.reduce(
      (sum, kr) => sum + (kr.currentValue / kr.targetValue) * 100,
      0
    ) / allKRs.length
  );

  const updatedGoal = await prisma.goal.update({
    where: { id: goalId },
    data: { progress: Math.min(avgProgress, 100) },
    include: { keyResults: true },
  });

  return NextResponse.json({ data: updatedGoal });
}
