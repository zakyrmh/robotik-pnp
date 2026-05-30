import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getActivities, getAttendanceSummary } from "@/lib/actions/activities";
import { KegiatanAbsensiClient } from "./KegiatanAbsensiClient";

export const metadata = {
  title: "Kegiatan & Absensi Caang | UKM Robotik PNP",
  description: "Manajemen kegiatan dan rekap absensi Calon Anggota (Caang) UKM Robotik Politeknik Negeri Padang.",
};

export default async function KegiatanAbsensiCaangPage() {
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
    .select("id, role")
    .eq("id", user.id)
    .single();

  const rawProfile = profile as { id: string; role: string } | null;
  if (!rawProfile || (rawProfile.role !== "admin-or" && rawProfile.role !== "super-admin")) {
    redirect("/dashboard");
  }

  // Fetch initial data in parallel
  const [activitiesRes, summaryRes] = await Promise.all([
    getActivities(),
    getAttendanceSummary(),
  ]);

  const activities = activitiesRes.success && activitiesRes.data ? activitiesRes.data : [];
  const summaryData = summaryRes.success && summaryRes.data
    ? summaryRes.data
    : { activities: [], summary: [] };

  return (
    <KegiatanAbsensiClient
      initialActivities={activities}
      initialActivitiesForSummary={summaryData.activities}
      initialSummary={summaryData.summary}
    />
  );
}
