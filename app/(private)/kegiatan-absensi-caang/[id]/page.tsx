import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getActivityAttendances } from "@/lib/actions/activities";
import { ActivityDetailClient } from "./ActivityDetailClient";

export const metadata = {
  title: "Detail Kegiatan & Absensi | UKM Robotik PNP",
  description: "Kelola absensi Caang untuk kegiatan tertentu.",
};

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const result = await getActivityAttendances(id);

  if (!result.success || !result.data) {
    redirect("/kegiatan-absensi-caang");
  }

  return (
    <ActivityDetailClient
      activity={result.data.activity}
      initialSummary={result.data.summary}
    />
  );
}
