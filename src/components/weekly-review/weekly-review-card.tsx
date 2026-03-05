"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WeeklyReviewCardProps {
  review: {
    id: string;
    weekStart: string;
    achievements: string;
    lessons: string | null;
    helpNeeded: string | null;
    nextWeekPlan: string;
    aiFeedback: string | null;
  };
}

export function WeeklyReviewCard({ review }: WeeklyReviewCardProps) {
  const weekDate = new Date(review.weekStart).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {weekDate}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="font-semibold mb-1">성과</p>
          <p className="whitespace-pre-wrap text-muted-foreground">
            {review.achievements}
          </p>
        </div>
        {review.lessons && (
          <div>
            <p className="font-semibold mb-1">배운 점</p>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {review.lessons}
            </p>
          </div>
        )}
        {review.nextWeekPlan && (
          <div>
            <p className="font-semibold mb-1">다음 주 계획</p>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {review.nextWeekPlan}
            </p>
          </div>
        )}
        {review.aiFeedback && (
          <div className="rounded-md bg-blue-50 p-3">
            <p className="font-semibold mb-1 text-blue-700">AI 피드백</p>
            <p className="whitespace-pre-wrap text-blue-600">
              {review.aiFeedback}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
