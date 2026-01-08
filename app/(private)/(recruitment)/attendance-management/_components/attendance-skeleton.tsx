// =========================================================
// SKELETON LOADING COMPONENT
// =========================================================

export function AttendanceManagementSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="h-5 w-80 bg-slate-200 dark:bg-slate-800 rounded mt-2" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2">
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-10 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="h-8 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-10 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-10 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="h-5 w-8 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="ml-auto h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-4 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
          >
            <div className="h-5 w-8 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
