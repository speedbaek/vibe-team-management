export default function AdminDashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="h-8 w-36 bg-muted animate-pulse rounded mb-6" />
      <div className="space-y-6">
        <div className="border rounded-lg p-6 space-y-3">
          <div className="h-5 w-40 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 w-24 bg-muted animate-pulse rounded" />
            <div className="flex gap-2">
              <div className="h-8 w-36 bg-muted animate-pulse rounded" />
              <div className="h-8 w-36 bg-muted animate-pulse rounded" />
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="border rounded-lg">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 border-b last:border-0 flex items-center gap-4">
                <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
