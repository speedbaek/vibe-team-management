import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-72 bg-muted rounded animate-pulse" />
        <div className="h-8 w-28 bg-muted rounded animate-pulse" />
      </div>
      {[1, 2, 3].map((i) => (
        <Card key={i} className="mb-4">
          <CardHeader className="pb-2">
            <div className="h-5 w-48 bg-muted rounded animate-pulse" />
            <div className="h-3 w-32 bg-muted rounded animate-pulse mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
