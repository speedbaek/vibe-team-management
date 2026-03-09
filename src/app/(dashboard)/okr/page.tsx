import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OKRClient } from "@/components/okr/okr-client";

export default async function OKRPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id },
    include: { keyResults: true },
    orderBy: { createdAt: "desc" },
  });

  // Date 객체를 직렬화하여 클라이언트 컴포넌트에 전달
  return <OKRClient initialGoals={JSON.parse(JSON.stringify(goals))} />;
}
