import type { Metadata } from "next";
import { getPublicOrSettingsAction } from "@/lib/actions/or-settings";
import { CaangLandingClient } from "./CaangLandingClient";

export const metadata: Metadata = {
  title: "Pendaftaran Calon Anggota Baru — UKM Robotik PNP",
  description:
    "Informasi resmi pendaftaran calon anggota baru (Caang) UKM Robotik Politeknik Negeri Padang. Jadwal, alur pendaftaran, persyaratan, dan FAQ.",
  openGraph: {
    title: "Pendaftaran Calon Anggota Baru — UKM Robotik PNP",
    description:
      "Mari menjadi bagian dari pusat riset dan kompetisi robotika Politeknik Negeri Padang. Simak syarat, timeline, dan daftarkan dirimu!",
    url: "https://robotik-pnp.vercel.app/pendaftaran-caang",
    siteName: "UKM Robotik PNP",
    locale: "id_ID",
    type: "website",
  },
};

export default async function PendaftaranCaangPage() {
  let settings = null;

  try {
    const res = await getPublicOrSettingsAction();
    if (res.success && res.data) {
      settings = res.data;
    }
  } catch (error) {
    console.error("Error loading OR settings for public page:", error);
  }

  return <CaangLandingClient settings={settings} />;
}
