export default function OKRLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-10 w-28 bg-muted animate-pulse rounded" />
      </div>
      <div className="grid gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="border rounded-lg p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-2/3 bg-muted animate-pulse rounded" />
              <div className="h-5 w-16 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-3 w-full bg-muted animate-pulse rounded" />
            <div className="space-y-2 pt-2">
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
