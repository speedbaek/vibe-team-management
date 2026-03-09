"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WeeklyReviewForm } from "@/components/weekly-review/weekly-review-form";
import { WeeklyReviewCard } from "@/components/weekly-review/weekly-review-card";

interface WeeklyReviewClientProps {
  initialReviews: any[];
}

export function WeeklyReviewClient({ initialReviews }: WeeklyReviewClientProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);

  const handleRefresh = async () => {
    try {
      const res = await fetch("/api/weekly-reviews");
      const { data } = await res.json();
      setReviews(data || []);
    } catch {
      router.refresh();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <WeeklyReviewForm
          initialData={reviews[0] || undefined}
          onSaved={handleRefresh}
        />
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">지난 회고</h3>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground">작성된 회고가 없습니다.</p>
        ) : (
          reviews.map((review: any) => (
            <WeeklyReviewCard key={review.id} review={review} />
          ))
        )}
      </div>
    </div>
  );
}
