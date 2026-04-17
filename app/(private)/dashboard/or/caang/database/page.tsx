import { Suspense } from "react";
import { Database } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { getRegistrations } from "@/app/actions/or.action";
import { DatabaseManager } from "./_components/database-manager";

export default function DatabasePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
          <Database className="size-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Database &amp; Edit Data
          </h1>
          <p className="text-sm text-muted-foreground">
            Lihat dan edit data seluruh pendaftar calon anggota.
          </p>
        </div>
      </div>

      <Suspense fallback={<DatabaseSkeleton />}>
        <DatabaseLoader />
      </Suspense>
    </div>
  );
}

async function DatabaseLoader() {
  const result = await getRegistrations();
  return <DatabaseManager initialRegistrations={result.data ?? []} />;
}

function DatabaseSkeleton() {
  return (
    <div className="space-y-4">
      {/* Stats grid (6 cards) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border bg-card p-3 shadow-sm text-center space-y-1"
          >
            <Skeleton className="h-7 w-10 mx-auto" />
            <Skeleton className="h-3 w-12 mx-auto" />
          </div>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-9 w-[180px] rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded" />
          <Skeleton className="h-9 w-[240px] rounded-md" />
        </div>
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="border-b bg-muted/30 px-4 py-2.5 flex gap-3">
          {[20, 80, 60, 50, 70, 60, 40, 60, 40].map((w, i) => (
            <Skeleton
              key={i}
              className="h-4 rounded"
              style={{ width: `${w}px` }}
            />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-2.5 border-b last:border-0"
          >
            <Skeleton className="h-3 w-5" />
            <div className="flex items-center gap-2 flex-1">
              <Skeleton className="size-7 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2.5 w-36" />
              </div>
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-8 rounded-full" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="size-7 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
