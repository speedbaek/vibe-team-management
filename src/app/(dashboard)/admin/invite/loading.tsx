export default function AdminInviteLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="h-8 w-32 bg-muted animate-pulse rounded mb-6" />
      <div className="space-y-6">
        <div className="border rounded-lg p-6 space-y-4">
          <div className="h-5 w-32 bg-muted animate-pulse rounded" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-full bg-muted animate-pulse rounded" />
        </div>
        <div className="border rounded-lg p-6 space-y-3">
          <div className="h-5 w-24 bg-muted animate-pulse rounded" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="h-4 w-40 bg-muted animate-pulse rounded" />
              <div className="h-5 w-16 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
