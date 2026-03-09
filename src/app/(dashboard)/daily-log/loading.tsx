export default function DailyLogLoading() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="h-8 w-40 bg-muted animate-pulse rounded mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="border rounded-lg p-6 space-y-4">
            <div className="h-5 w-24 bg-muted animate-pulse rounded" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-full bg-muted animate-pulse rounded" />
            ))}
            <div className="h-20 w-full bg-muted animate-pulse rounded" />
            <div className="h-10 w-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="border rounded-lg p-4 space-y-3">
          <div className="h-5 w-20 bg-muted animate-pulse rounded mx-auto" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
