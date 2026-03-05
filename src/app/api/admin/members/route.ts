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
        select: { dailyLogs: true, weeklyReviews: true, goals: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data: members });
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
