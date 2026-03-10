import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="h-8 w-40 bg-muted rounded animate-pulse mb-6" />
      <Card>
        <CardHeader className="pb-3">
          <div className="h-5 w-24 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 w-28 bg-muted rounded animate-pulse"
              />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardContent className="py-12">
          <div className="h-5 w-64 bg-muted rounded animate-pulse mx-auto" />
        </CardContent>
      </Card>
    </div>
  );
}
