"use client";

import { useState, useEffect } from "react";
import { WeeklyReviewForm } from "@/components/weekly-review/weekly-review-form";
import { WeeklyReviewCard } from "@/components/weekly-review/weekly-review-card";

export default function WeeklyReviewPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    const res = await fetch("/api/weekly-reviews");
    const { data } = await res.json();
    setReviews(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">주간 회고</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <WeeklyReviewForm
            initialData={reviews[0] || undefined}
            onSaved={fetchReviews}
          />
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">지난 회고</h3>
          {loading ? (
            <p className="text-muted-foreground">불러오는 중...</p>
          ) : reviews.length === 0 ? (
            <p className="text-muted-foreground">작성된 회고가 없습니다.</p>
          ) : (
            reviews.map((review) => (
              <WeeklyReviewCard key={review.id} review={review} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
