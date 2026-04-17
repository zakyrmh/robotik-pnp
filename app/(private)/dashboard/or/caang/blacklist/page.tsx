import { Suspense } from "react";
import { Ban } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { getBlacklist, getRegistrations } from "@/app/actions/or.action";
import { BlacklistManager } from "./_components/blacklist-manager";

export default function BlacklistPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
          <Ban className="size-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Daftar Blacklist Caang
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola daftar calon anggota yang diblacklist.
          </p>
        </div>
      </div>

      <Suspense fallback={<BlacklistSkeleton />}>
        <BlacklistLoader />
      </Suspense>
    </div>
  );
}

async function BlacklistLoader() {
  const [blacklistRes, regsRes] = await Promise.all([
    getBlacklist(),
    getRegistrations(),
  ]);

  const members = (regsRes.data ?? []).map((r) => ({
    id: r.user_id,
    full_name: r.full_name,
    email: r.email,
  }));

  return (
    <BlacklistManager
      initialBlacklist={blacklistRes.data ?? []}
      members={members}
    />
  );
}

function BlacklistSkeleton() {
  return (
    <div className="space-y-4">
      {/* Stats row (3 cards) */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border bg-card px-3 py-2 shadow-sm space-y-1"
          >
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-8" />
          </div>
        ))}
      </div>

      {/* Add button */}
      <Skeleton className="h-10 w-48 rounded-md" />

      {/* Blacklist cards */}
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border bg-card shadow-sm overflow-hidden"
        >
          <div className="flex items-center gap-4 px-4 py-3">
            {/* Avatar */}
            <Skeleton className="size-10 rounded-full" />
            {/* Info */}
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-52" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex gap-1.5">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
