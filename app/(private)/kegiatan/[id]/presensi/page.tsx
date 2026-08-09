import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActivityAttendanceDetail } from "@/lib/actions/komdis";
import { ActivityAttendanceDetailClient } from "@/components/features/presensi/activity-attendance-detail-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Detail Presensi Kegiatan | UKM Robotik PNP",
  description:
    "Detail dan rekapitulasi presensi anggota per kegiatan formal UKM Robotik PNP",
};

interface KegiatanPresensiPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function KegiatanPresensiPage({
  params,
}: KegiatanPresensiPageProps) {
  const { id: activityId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin-komdis", "super-admin"].includes(profile.role)) {
    redirect("/presensi");
  }

  const detailData = await getActivityAttendanceDetail(activityId);

  return (
    <Suspense fallback={<DetailPresensiSkeleton />}>
      <ActivityAttendanceDetailClient initialData={detailData} />
    </Suspense>
  );
}

function DetailPresensiSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 px-2 sm:px-4 lg:px-6">
      <Skeleton className="h-36 w-full rounded-2xl bg-slate-200 dark:bg-slate-800" />
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <Skeleton className="h-20 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-20 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-20 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-20 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-20 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-20 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
      <Skeleton className="h-96 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}
