import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AbsensiKegiatanClient } from "@/components/features/presensi/absensi-kegiatan-client";

export const metadata = {
  title: "Pemindai & Token Presensi QR | UKM Robotik PNP",
  description: "Modul presensi QR kegiatan Komdis UKM Robotik PNP.",
};

export default async function AbsensiKegiatanPage({
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

  return <AbsensiKegiatanClient activityId={id} />;
}
