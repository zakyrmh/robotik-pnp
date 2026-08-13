import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  KedisiplinanClient,
  ExtendedUserDisciplineSummary,
  SanctionStatusItem,
} from "@/components/features/komdis/kedisiplinan-client";

export const metadata: Metadata = {
  title: "Direktori Kedisiplinan | UKM Robotik PNP",
  description:
    "Rekapitulasi poin kedisiplinan, perizinan, dan Surat Peringatan anggota UKM Robotik PNP",
};

export default async function KedisiplinanPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Cek Hak Akses Role (Hanya admin-komdis dan super-admin yang diizinkan)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin-komdis", "super-admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  // Ambil data profil anggota/pengurus aktif (exclude caang & alumni) beserta status magang
  const { data: validProfiles } = await supabase
    .from("profiles")
    .select("id, is_on_internship, internship_start_date, internship_end_date")
    .neq("role", "caang")
    .neq("role", "alumni");

  const profileMap = new Map((validProfiles || []).map((p) => [p.id, p]));
  const validProfileIds = (validProfiles || []).map((p) => p.id);

  // Fetch summaries & active sanctions untuk profil valid
  const { data: summariesData } =
    validProfileIds.length > 0
      ? await supabase
          .from("v_user_discipline_summary")
          .select("*")
          .in("profile_id", validProfileIds)
          .order("net_points", { ascending: false })
      : { data: [] };

  const { data: sanctionsData } =
    validProfileIds.length > 0
      ? await supabase
          .from("sanctions")
          .select("id, profile_id, sp_level, status")
          .eq("status", "active")
          .in("profile_id", validProfileIds)
      : { data: [] };

  const summaries: ExtendedUserDisciplineSummary[] = (summariesData || []).map(
    (s) => {
      const prof = profileMap.get(s.profile_id || "");
      return {
        profile_id: s.profile_id || "",
        full_name: s.full_name || null,
        nim: s.nim || null,
        total_attendance_points: s.total_attendance_points || 0,
        total_log_points: s.total_log_points || 0,
        net_points: s.net_points || 0,
        is_on_internship: prof?.is_on_internship ?? false,
        internship_start_date: prof?.internship_start_date ?? null,
        internship_end_date: prof?.internship_end_date ?? null,
      };
    },
  );

  const activeSanctions: SanctionStatusItem[] = (sanctionsData || []).map(
    (s) => ({
      id: s.id,
      profile_id: s.profile_id,
      sp_level: s.sp_level,
      status: s.status,
    }),
  );

  return (
    <div className="w-full">
      <KedisiplinanClient
        summaries={summaries}
        activeSanctions={activeSanctions}
      />
    </div>
  );
}
