import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getOrSettings } from "@/lib/actions/or-settings";
import { SettingsClient } from "./SettingsClient";

export default async function PengaturanOrPage() {
  const supabase = await createClient();

  // 1. Get current authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // 2. Query user profile role
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  const rawProfile = profile as { id: string; role: string } | null;

  // 3. Authorization gate: Only allow 'admin-or' and 'super-admin'
  if (!rawProfile || (rawProfile.role !== "admin-or" && rawProfile.role !== "super-admin")) {
    redirect("/dashboard");
  }

  // 4. Fetch initial OR Settings
  const settingsRes = await getOrSettings();
  
  const initialSettings = settingsRes.success && settingsRes.data ? settingsRes.data : {
    periode_recruitment: "OR-21",
    status_pendaftaran: false,
    tanggal_mulai: null,
    tanggal_selesai: null,
    biaya_pendaftaran: 10000,
    rekening_penerima: [],
    kontak_panitia: [],
    link_komunitas: { whatsapp_url: "", discord_url: "" },
    timeline: []
  };

  return <SettingsClient initialSettings={initialSettings} />;
}
