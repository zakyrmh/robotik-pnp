import { Suspense } from "react";
import { CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { adminGetEvents } from "@/app/actions/or-events.action";
import { JadwalManager } from "./_components/jadwal-manager";

export default function JadwalKegiatanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <CalendarDays className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Jadwal Kegiatan
          </h1>
          <p className="text-sm text-muted-foreground">
            Atur agenda kegiatan Open Recruitment dan konfigurasi absensi.
          </p>
        </div>
      </div>

      <Suspense fallback={<JadwalSkeleton />}>
        <JadwalLoader />
      </Suspense>
    </div>
  );
}

async function JadwalLoader() {
  const result = await adminGetEvents();
  return <JadwalManager initialEvents={result.data ?? []} />;
}

function JadwalSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search + Add button row */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 flex-1 max-w-sm rounded-md" />
        <Skeleton className="h-9 w-40 rounded-md" />
      </div>

      {/* Event cards grid (3 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card shadow-sm flex flex-col overflow-hidden"
          >
            {/* Card header: badge + title + menu */}
            <div className="p-4 flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-36" />
              </div>
              <Skeleton className="size-8 rounded-md" />
            </div>
            {/* Card content: date, time, location rows */}
            <div className="px-4 pb-2 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="size-3 rounded" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="size-3 rounded" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="size-3 rounded" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            {/* Card footer: attendance + type */}
            <div className="px-4 py-3 border-t flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
