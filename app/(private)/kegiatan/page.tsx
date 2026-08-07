import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getActivities, type ActivityItem } from "@/lib/actions/activities";
import { KegiatanClient } from "@/components/features/kegiatan/kegiatan-client";

export const metadata: Metadata = {
  title: "Kegiatan UKM | UKM Robotik PNP",
  description: "Agenda Pelatihan, Rapat, dan Workshop Teknologi Robotik PNP",
};

export default async function KegiatanPage() {
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
  const userRole = rawProfile?.role || "anggota";

  const targetAudience = userRole === "caang" ? "caang" : "anggota";

  const res = await getActivities(targetAudience);
  const initialActivities: ActivityItem[] =
    res.success && res.data ? res.data : [];

  return (
    <KegiatanClient initialActivities={initialActivities} userRole={userRole} />
  );
}
