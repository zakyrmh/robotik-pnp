import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AbsensiHistoryClient } from "@/components/features/absensi/absensi-history-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Histori Absensi | UKM Robotik PNP",
  description: "Riwayat dan histori presensi kegiatan UKM Robotik PNP",
};

interface RawHistoryItem {
  id: string;
  check_in_at: string | null;
  status: "hadir" | "telat" | "izin" | "sakit" | "alfa";
  notes: string | null;
  proof_url: string | null;
  activity_id: string | null;
  activities: {
    title: string;
    start_date: string;
    location: string | null;
  } | null;
}

export default async function AbsensiPage() {
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
    .select("id, role, full_name, nim")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // Fetch user's attendance history (joins with activities)
  const { data: history } = await supabase
    .from("attendances")
    .select(
      `
      id,
      check_in_at,
      status,
      notes,
      proof_url,
      activity_id,
      activities (
        title,
        start_date,
        location
      )
    `,
    )
    .eq("profile_id", user.id)
    .order("check_in_at", { ascending: false });

  // Convert join result types safely without any
  const formattedHistory = ((history as unknown as RawHistoryItem[]) || []).map(
    (item) => ({
      id: item.id,
      check_in_at: item.check_in_at || "",
      status: item.status,
      notes: item.notes,
      proof_url: item.proof_url,
      activity_id: item.activity_id,
      activity_title: item.activities?.title || "Kegiatan Tidak Diketahui",
      activity_start_date: item.activities?.start_date || "",
      activity_location: item.activities?.location || "Tidak Ada Lokasi",
    }),
  );

  return (
    <Suspense fallback={<AbsensiHistorySkeleton />}>
      <AbsensiHistoryClient
        profileName={profile.full_name || "Pengguna"}
        nim={profile.nim || "-"}
        role={profile.role}
        initialHistory={formattedHistory}
      />
    </Suspense>
  );
}

function AbsensiHistorySkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 px-2 sm:px-4 lg:px-6">
      <Skeleton className="h-24 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Skeleton className="h-20 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-20 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-20 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-20 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
      <Skeleton className="h-96 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}
