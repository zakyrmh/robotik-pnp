import type { Metadata } from "next";
import { Suspense } from "react";
import { KegiatanClient } from "@/components/features/kegiatan/kegiatan-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Kegiatan UKM | UKM Robotik PNP",
  description: "Agenda Pelatihan, Rapat, dan Workshop Teknologi Robotik PNP",
};

export default function KegiatanPage() {
  return (
    <Suspense fallback={<KegiatanSkeleton />}>
      <KegiatanClient />
    </Suspense>
  );
}

function KegiatanSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 px-1 lg:px-4">
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
