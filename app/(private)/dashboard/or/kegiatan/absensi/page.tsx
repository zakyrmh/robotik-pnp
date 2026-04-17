import { Suspense } from "react";
import { ClipboardCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { adminGetEvents } from "@/app/actions/or-events.action";
import { AbsensiManager } from "./_components/absensi-manager";

export default function AbsensiKegiatanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
          <ClipboardCheck className="size-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Scan QR / Input Absensi
          </h1>
          <p className="text-sm text-muted-foreground">
            Manajemen kehadiran dan scan QR token caang secara real-time.
          </p>
        </div>
      </div>

      <Suspense fallback={<AbsensiSkeleton />}>
        <AbsensiLoader />
      </Suspense>
    </div>
  );
}

async function AbsensiLoader() {
  const result = await adminGetEvents();
  const activeEvents = (result.data ?? []).filter(
    (e) => e.status !== "completed",
  );
  return <AbsensiManager initialEvents={activeEvents} />;
}

function AbsensiSkeleton() {
  return (
    <div className="space-y-4">
      {/* Event selector bar */}
      <div className="rounded-xl border border-dashed bg-muted/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-[280px] rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border bg-card px-3 py-2 shadow-sm space-y-1"
          >
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-6 w-8" />
          </div>
        ))}
      </div>

      {/* Search */}
      <Skeleton className="h-9 w-64 rounded-md" />

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="border-b bg-muted/30 px-4 py-2.5 flex gap-4">
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16 ml-auto" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
        </div>
        {/* Table rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="border-b last:border-0 px-4 py-3 flex items-center gap-4"
          >
            <Skeleton className="h-4 w-4" />
            <div className="flex items-center gap-2">
              <Skeleton className="size-7 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
            <Skeleton className="h-3 w-16 ml-auto" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-8" />
            <Skeleton className="size-7 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
