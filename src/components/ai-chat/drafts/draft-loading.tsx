"use client";

import { Card, CardContent } from "@/components/ui/card";

export function DraftLoading() {
  return (
    <Card className="my-4 animate-pulse">
      <CardContent className="p-4">
        <div className="h-4 bg-muted rounded w-1/3 mb-3" />
        <div className="h-3 bg-muted rounded w-full mb-2" />
        <div className="h-3 bg-muted rounded w-2/3 mb-2" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </CardContent>
    </Card>
  );
}
