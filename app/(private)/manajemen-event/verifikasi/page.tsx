import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FaceVerificationScanner } from "@/components/event/face-verification-scanner";
import type { RoleEvent } from "@/types/event-registration";

export default async function FaceVerificationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, role_event")
    .eq("id", user.id)
    .single();

  const isSuperAdmin = profile?.role === "super-admin";
  const roleEvent = profile?.role_event as RoleEvent | undefined;

  if (!isSuperAdmin && roleEvent !== "panitia-verifikasi" && roleEvent !== "panitia-pendaftaran") {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-3">
        <h2 className="text-xl font-bold text-slate-800">Akses Terbatas</h2>
        <p className="text-sm text-slate-600">
          Hanya Panitia Verifikasi (`panitia-verifikasi`) atau Super Admin yang dapat mengakses halaman ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="border-b pb-4 text-center">
        <span className="text-xs font-bold text-[#f0975a] uppercase tracking-wider block">
          Verifikasi Lapangan
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Scan QR Kokarde & Pencocokan Wajah (Anti-Joki)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Bandingkan pas foto terdaftar dengan peserta fisik di lokasi venue sebelum pertandingan.
        </p>
      </div>

      <FaceVerificationScanner />
    </div>
  );
}
