import { redirect } from "next/navigation";
import { getSettingsDataAction } from "@/lib/actions/settings";
import { SettingsClient } from "@/components/settings/SettingsClient";

export const metadata = {
  title: "Pengaturan Akun | UKM Robotik PNP",
  description: "Kelola profil, keamanan kata sandi, preferensi notifikasi, dan status keanggotaan UKM Robotik Politeknik Negeri Padang.",
};

export default async function SettingsPage() {
  const data = await getSettingsDataAction();

  if ("error" in data && data.error) {
    redirect("/login");
  }

  return <SettingsClient settingsData={data as any} />;
}
