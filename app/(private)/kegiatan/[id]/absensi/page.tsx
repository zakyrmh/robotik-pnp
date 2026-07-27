import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KomdisScannerView } from "@/components/features/komdis/komdis-scanner-view";
import { AnggotaQrView } from "@/components/features/komdis/anggota-qr-view";

export const metadata: Metadata = {
  title: "Absensi Kegiatan | UKM Robotik PNP",
  description: "Modul presensi kegiatan formal UKM Robotik PNP",
};

interface AbsensiKegiatanPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AbsensiKegiatanPage({
  params,
}: AbsensiKegiatanPageProps) {
  const { id: activityId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch Profile & Role
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, nim")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // Fetch Activity Info
  const { data: activity } = await supabase
    .from("activities")
    .select("id, title, target_audience")
    .eq("id", activityId)
    .single();

  if (!activity) {
    notFound();
  }

  const isKomdisAdmin = ["admin-komdis", "super-admin"].includes(profile.role);

  return (
    <div className="space-y-6">
      {/* Tricolor Tech Header Line */}
      <div className="h-1 w-full bg-linear-to-r from-cyber-blue via-tech-navy to-crimson-red" />

      {isKomdisAdmin ? (
        <KomdisScannerView
          activityId={activityId}
          activityTitle={activity.title}
        />
      ) : (
        <AnggotaQrView
          activityId={activityId}
          activityTitle={activity.title}
          profileId={profile.id}
          profileName={profile.full_name || "Anggota"}
          nim={profile.nim || "-"}
        />
      )}
    </div>
  );
}
