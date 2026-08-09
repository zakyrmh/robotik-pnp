import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDeletedActivities } from "@/lib/actions/activities";
import { TrashActivitiesClient } from "@/components/features/kegiatan/trash-activities-client";

export const metadata = {
  title: "Trash Kegiatan Caang | UKM Robotik PNP",
  description:
    "Daftar kegiatan calon anggota yang dihapus sementara. Pulihkan atau hapus secara permanen.",
};

export default async function CaangTrashPage() {
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
  if (
    !rawProfile ||
    (rawProfile.role !== "admin-or" && rawProfile.role !== "super-admin")
  ) {
    redirect("/dashboard");
  }

  const res = await getDeletedActivities("caang");
  const deletedActivities = res.success && res.data ? res.data : [];

  return (
    <TrashActivitiesClient
      initialDeletedActivities={deletedActivities}
      targetAudience="caang"
      backPath="/kegiatan-absensi-caang"
      userRole={rawProfile.role}
    />
  );
}
