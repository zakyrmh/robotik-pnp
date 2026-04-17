import { Suspense } from "react";
import { UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { getRegistrations } from "@/app/actions/or.action";
import { VerifikasiManager } from "./_components/verifikasi-manager";

export default function VerifikasiPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
          <UserCheck className="size-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Verifikasi Pendaftar
          </h1>
          <p className="text-sm text-muted-foreground">
            Review dan verifikasi data calon anggota yang mendaftar.
          </p>
        </div>
      </div>

      <Suspense fallback={<VerifikasiSkeleton />}>
        <VerifikasiLoader />
      </Suspense>
    </div>
  );
}

async function VerifikasiLoader() {
  const result = await getRegistrations();
  return <VerifikasiManager initialRegistrations={result.data ?? []} />;
}

function VerifikasiSkeleton() {
  return (
    <div className="space-y-4">
      {/* Alert bar */}
      <Skeleton className="h-12 rounded-lg" />

      {/* Filter row */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-9 w-[200px] rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded" />
          <Skeleton className="h-9 w-[200px] rounded-md" />
        </div>
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>

      {/* Registration cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border bg-card shadow-sm overflow-hidden"
        >
          <div className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex gap-1.5">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="size-8 rounded-md" />
              <Skeleton className="size-8 rounded-md" />
              <Skeleton className="size-8 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
