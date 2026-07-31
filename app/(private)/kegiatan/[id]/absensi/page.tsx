import type { Metadata } from "next";
import { Suspense } from "react";
import { AbsensiKegiatanClient } from "@/components/features/kegiatan/absensi-kegiatan-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Absensi Kegiatan | UKM Robotik PNP",
  description: "Modul presensi kegiatan formal UKM Robotik PNP",
};

interface AbsensiKegiatanPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AbsensiKegiatanPage({
  params,
}: AbsensiKegiatanPageProps) {
  const { id: activityId } = await params;

  return (
    <Suspense fallback={<AbsensiSkeleton />}>
      <AbsensiKegiatanClient activityId={activityId} />
    </Suspense>
  );
}

function AbsensiSkeleton() {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}
