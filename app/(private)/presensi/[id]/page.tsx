import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getActivityAttendanceDetail } from "@/lib/actions/komdis";
import { ActivityAttendanceDetailClient } from "@/components/features/presensi/activity-attendance-detail-client";

export const metadata = {
  title: "Rekap Presensi Kegiatan | UKM Robotik PNP",
  description: "Detail rekapitulasi presensi kegiatan Komdis UKM Robotik PNP.",
};

export default async function ActivityAttendanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verifikasi role komdis atau super-admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isKomdisOrSuperAdmin = ["admin-komdis", "super-admin"].includes(
    profile?.role || "",
  );

  if (!isKomdisOrSuperAdmin) {
    redirect("/presensi");
  }

  let data;
  try {
    data = await getActivityAttendanceDetail(id);
  } catch (err: unknown) {
    console.error("Gagal memuat rekap presensi kegiatan:", err);
    redirect("/presensi");
  }

  return <ActivityAttendanceDetailClient initialData={data} />;
}
