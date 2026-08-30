import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getActivityAttendanceDetail } from "@/lib/actions/komdis";
import { UnifiedActivityPresensiClient } from "@/components/features/presensi/unified-activity-presensi-client";

export const metadata = {
  title: "Presensi Kegiatan | UKM Robotik PNP",
  description: "Modul presensi kegiatan UKM Robotik PNP.",
};

export default async function ActivityAttendanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
    .select("id, role, full_name, nim")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const userRole = profile.role;

  // Fetch activity info
  const { data: activity, error: actError } = await supabase
    .from("activities")
    .select(
      "id, title, description, start_date, end_date, location, target_audience, checkin_open_at, checkin_close_at",
    )
    .eq("id", activityId)
    .is("deleted_at", null)
    .single();

  if (actError || !activity) {
    notFound();
  }

  const canManage =
    activity.target_audience === "caang"
      ? ["super-admin", "admin-or"].includes(userRole)
      : ["super-admin", "admin-komdis"].includes(userRole);

  let activityDetailData = null;
  if (canManage) {
    try {
      activityDetailData = await getActivityAttendanceDetail(activityId);
    } catch (err) {
      console.error("Gagal memuat rekap presensi kegiatan:", err);
    }
  }

  return (
    <UnifiedActivityPresensiClient
      activityId={activityId}
      userRole={userRole}
      canManage={canManage}
      profile={profile}
      activityDetailData={activityDetailData}
      activityInfo={activity}
    />
  );
}
