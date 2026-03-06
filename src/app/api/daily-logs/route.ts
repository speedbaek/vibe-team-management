import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dailyLogSchema as createSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  let dateFilter = {};
  if (month) {
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    dateFilter = { date: { gte: startDate, lt: endDate } };
  }

  const logs = await prisma.dailyLog.findMany({
    where: { userId: session.user.id, ...dateFilter },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ data: logs });
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

  const { date, plannedTasks, completedTasks, blockers } = parsed.data;

  const log = await prisma.dailyLog.upsert({
    where: {
      userId_date: { userId: session.user.id, date: new Date(date) },
    },
    create: {
      userId: session.user.id,
      date: new Date(date),
      plannedTasks,
      completedTasks,
      blockers,
    },
    update: {
      plannedTasks,
      completedTasks,
      blockers,
    },
  });

  return NextResponse.json({ data: log }, { status: 201 });
}
