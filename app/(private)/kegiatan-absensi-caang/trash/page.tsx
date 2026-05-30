import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDeletedActivities } from "@/lib/actions/activities";
import { TrashClient } from "./TrashClient";

export const metadata = {
  title: "Trash — Kegiatan Terhapus | UKM Robotik PNP",
  description: "Kegiatan yang dihapus sementara. Pulihkan atau hapus secara permanen.",
};

export default async function TrashPage() {
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

  const res = await getDeletedActivities();
  const deletedActivities = res.success && res.data ? res.data : [];

  return <TrashClient deletedActivities={deletedActivities} />;
}
