import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDeletedActivities } from "@/lib/actions/activities";
import { TrashActivitiesClient } from "@/components/features/kegiatan/trash-activities-client";

export const metadata = {
  title: "Tempat Sampah Kegiatan | UKM Robotik PNP",
  description:
    "Daftar kegiatan anggota yang dihapus sementara. Pulihkan atau hapus secara permanen.",
};

export default async function KomdisTrashPage() {
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

  // Hanya admin-komdis dan super-admin yang diizinkan mengakses sampah kegiatan anggota
  if (
    !rawProfile ||
    (rawProfile.role !== "admin-komdis" && rawProfile.role !== "super-admin")
  ) {
    redirect("/kegiatan");
  }

  const res = await getDeletedActivities("anggota");
  const deletedActivities = res.success && res.data ? res.data : [];

  return (
    <TrashActivitiesClient
      initialDeletedActivities={deletedActivities}
      targetAudience="anggota"
      backPath="/kegiatan"
      userRole={rawProfile.role}
    />
  );
}
