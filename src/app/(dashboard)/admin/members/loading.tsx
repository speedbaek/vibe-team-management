export default function AdminMembersLoading() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="h-8 w-32 bg-muted animate-pulse rounded mb-6" />
      <div className="border rounded-lg">
        <div className="grid grid-cols-7 gap-4 p-3 border-b">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-4 bg-muted animate-pulse rounded" />
          ))}
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="grid grid-cols-7 gap-4 p-3 border-b last:border-0 items-center">
            <div className="col-span-2 flex items-center gap-3">
              <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
              <div className="space-y-1">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
              </div>
            </div>
            <div className="h-5 w-16 bg-muted animate-pulse rounded" />
            <div className="h-4 w-12 bg-muted animate-pulse rounded" />
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
