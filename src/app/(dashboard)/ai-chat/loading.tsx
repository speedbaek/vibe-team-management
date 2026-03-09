export default function AIChatLoading() {
  return (
    <div className="flex h-[calc(100vh-6rem)] -mt-2">
      <div className="hidden md:block w-56 shrink-0 border-r p-3 space-y-2">
        <div className="h-9 w-full bg-muted animate-pulse rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-full bg-muted animate-pulse rounded" />
        ))}
      </div>
      <div className="flex-1 min-w-0 px-2 md:px-4 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="h-12 w-12 bg-muted animate-pulse rounded-full mx-auto" />
            <div className="h-5 w-48 bg-muted animate-pulse rounded mx-auto" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded mx-auto" />
          </div>
        </div>
        <div className="h-12 w-full bg-muted animate-pulse rounded mb-4" />
      </div>
    </div>
  );
}
