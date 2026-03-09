import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WeeklyReviewClient } from "@/components/weekly-review/weekly-review-client";

export default async function WeeklyReviewPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const reviews = await prisma.weeklyReview.findMany({
    where: { userId: session.user.id },
    orderBy: { weekStart: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">주간 회고</h2>
      <WeeklyReviewClient initialReviews={JSON.parse(JSON.stringify(reviews))} />
    </div>
  );
}
