import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { RegisterForm } from "@/components/features/auth/register-form";

export const metadata: Metadata = {
  title: "Pendaftaran Calon Anggota | UKM Robotik PNP",
  description:
    "Formulir pendaftaran akun baru calon anggota (caang) UKM Robotik Politeknik Negeri Padang",
};

export default async function PendaftaranCaangDaftarPage() {
  const supabaseAdmin = createAdminClient();

  const { data: settings } = await supabaseAdmin
    .from("or_settings")
    .select("status_pendaftaran, tanggal_mulai, tanggal_selesai")
    .limit(1)
    .maybeSingle();

  if (
    !settings ||
    !settings.status_pendaftaran ||
    !settings.tanggal_mulai ||
    !settings.tanggal_selesai
  ) {
    redirect("/pendaftaran-caang");
  }

  const now = new Date();
  const startDate = new Date(settings.tanggal_mulai);
  const endDate = new Date(settings.tanggal_selesai);

  if (now < startDate || now > endDate) {
    redirect("/pendaftaran-caang");
  }

  return <RegisterForm />;
}
