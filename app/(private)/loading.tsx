import { Skeleton } from "@/components/ui/skeleton";

export default function PrivateDefaultLoading() {
  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 animate-in fade-in-50 duration-200">
      {/* ── Page Header Skeleton ─────────────────────────────────────────── */}
      <div className="border border-border bg-card rounded-lg p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-md shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 sm:w-64" />
              <Skeleton className="h-4 w-64 sm:w-80" />
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
        </div>
      </div>

      {/* ── Metric Cards Grid Skeleton ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="border border-border bg-card rounded-lg p-5 space-y-3 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>

      {/* ── Content Table / Grid Skeleton ───────────────────────────────── */}
      <div className="border border-border bg-card rounded-lg p-4 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-border">
          <Skeleton className="h-9 w-64 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>

        <div className="space-y-3 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-md border border-border/60 bg-muted/20"
            >
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-40 sm:w-60" />
                  <Skeleton className="h-3 w-24 sm:w-36" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
