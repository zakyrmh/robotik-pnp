import { Skeleton } from "@/components/ui/skeleton";

export default function KegiatanLoading() {
  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 animate-in fade-in-50 duration-200">
      {/* ── Header Card Skeleton ─────────────────────────────────────────── */}
      <div className="border border-border bg-card rounded-lg p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-md shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 sm:w-64" />
              <Skeleton className="h-4 w-64 sm:w-96" />
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-36 rounded-md" />
          </div>
        </div>
      </div>

      {/* ── Stats Cards Grid Skeleton ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="border border-border bg-card rounded-lg p-5 flex flex-col justify-between space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-2 py-2 text-center">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16 mx-auto" />
                <Skeleton className="h-7 w-8 mx-auto" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16 mx-auto" />
                <Skeleton className="h-7 w-8 mx-auto" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16 mx-auto" />
                <Skeleton className="h-7 w-8 mx-auto" />
              </div>
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* ── Filter & Search Bar Skeleton ────────────────────────────────── */}
      <div className="border border-border bg-card rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <Skeleton className="h-10 w-full sm:w-80 rounded-md" />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* ── Activity Items Grid Skeleton ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="border border-border bg-card rounded-lg overflow-hidden flex flex-col justify-between shadow-xs space-y-3 p-4"
          >
            <Skeleton className="h-40 w-full rounded-md" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
