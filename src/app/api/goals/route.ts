import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { goalSchema as createSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const quarter = searchParams.get("quarter");

  const goals = await prisma.goal.findMany({
    where: {
      userId: session.user.id,
      ...(quarter ? { quarter } : {}),
    },
    include: { keyResults: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: goals });
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

  const goal = await prisma.goal.create({
    data: {
      userId: session.user.id,
      objective: parsed.data.objective,
      quarter: parsed.data.quarter,
    },
    include: { keyResults: true },
  });

  return NextResponse.json({ data: goal }, { status: 201 });
}
