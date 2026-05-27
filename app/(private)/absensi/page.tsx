import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AbsensiClient } from "./AbsensiClient";

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

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // Get active activities for today
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // Activities overlapping with today
  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .lte("start_date", endOfToday.toISOString())
    .gte("end_date", startOfToday.toISOString())
    .order("start_date", { ascending: true });

  // Get user's attendances
  const { data: attendances } = await supabase
    .from("attendances")
    .select("*")
    .eq("profile_id", user.id);

  // Get user's attendance history (joins with activities)
  const { data: history } = await supabase
    .from("attendances")
    .select(`
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
    `)
    .eq("profile_id", user.id)
    .order("check_in_at", { ascending: false });

  // Convert join result types safely without any
  const formattedHistory = ((history as unknown as RawHistoryItem[]) || []).map((item) => ({
    id: item.id,
    check_in_at: item.check_in_at || "",
    status: item.status,
    notes: item.notes,
    proof_url: item.proof_url,
    activity_id: item.activity_id,
    activity_title: item.activities?.title || "Kegiatan Tidak Diketahui",
    activity_start_date: item.activities?.start_date || "",
    activity_location: item.activities?.location || "Tidak Ada Lokasi",
  }));

  return (
    <AbsensiClient
      profile={{
        id: profile.id,
        email: profile.email,
        role: profile.role,
        is_onboarded: profile.is_onboarded,
      }}
      initialActivities={activities || []}
      initialAttendances={attendances || []}
      initialHistory={formattedHistory}
    />
  );
}
