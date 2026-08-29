import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getActivities } from "@/lib/actions/activities";
import { KegiatanClient } from "@/components/features/kegiatan/kegiatan-client";

export const metadata = {
  title: "Kegiatan Caang | UKM Robotik PNP",
  description:
    "Manajemen kegiatan Calon Anggota (Caang) UKM Robotik Politeknik Negeri Padang.",
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
  // Rules 1, 3, 7: Hanya super-admin, admin-or, dan caang yang boleh mengakses /kegiatan-absensi-caang
  // Admin-komdis, admin-kestari, admin-divisi, dan anggota dilempar ke /dashboard
  if (
    !rawProfile ||
    (rawProfile.role !== "admin-or" &&
      rawProfile.role !== "super-admin" &&
      rawProfile.role !== "caang")
  ) {
    redirect("/dashboard");
  }

  const activitiesRes = await getActivities("caang");
  const activities =
    activitiesRes.success && activitiesRes.data ? activitiesRes.data : [];

  return (
    <KegiatanClient
      variant="caang-recruitment"
      initialActivities={activities}
      userRole={rawProfile.role}
    />
  );
}
