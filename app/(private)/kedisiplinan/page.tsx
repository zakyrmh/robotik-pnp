import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  DisciplineRecapTable,
  SanctionStatusItem,
} from "@/components/features/komdis/discipline-recap-table";
import { UserDisciplineSummary } from "@/lib/types/komdis";

export const metadata: Metadata = {
  title: "Direktori Kedisiplinan | UKM Robotik PNP",
  description:
    "Rekapitulasi poin kedisiplinan dan Surat Peringatan anggota UKM Robotik PNP",
};

export default async function KedisiplinanPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Cek Hak Akses Role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin-komdis", "super-admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  // Ambil ID profil anggota/pengurus aktif (exclude caang & alumni)
  const { data: validProfiles } = await supabase
    .from("profiles")
    .select("id")
    .neq("role", "caang")
    .neq("role", "alumni");

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

  const summaries: UserDisciplineSummary[] = (summariesData || []).map((s) => ({
    profile_id: s.profile_id || "",
    full_name: s.full_name || null,
    nim: s.nim || null,
    total_attendance_points: s.total_attendance_points || 0,
    total_log_points: s.total_log_points || 0,
    net_points: s.net_points || 0,
  }));

  const activeSanctions: SanctionStatusItem[] = (sanctionsData || []).map(
    (s) => ({
      id: s.id,
      profile_id: s.profile_id,
      sp_level: s.sp_level,
      status: s.status,
    }),
  );

  return (
    <div className="space-y-6">
      {/* Tricolor Tech Header Line */}
      <div className="h-1 w-full bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />

      <div className="flex flex-col gap-1">
        <span className="font-mono text-xs font-semibold text-dongker-surface dark:text-blue-400 uppercase tracking-widest">
          MODUL MANAJEMEN KEDISIPLINAN ORGANISASI
        </span>
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-dongker-ink dark:text-slate-100">
          REKAPITULASI POIN KEDISIPLINAN ANGGOTA
        </h1>
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
          Monitoring akumulasi poin sanksi, dispensasi, dan Surat Peringatan
          (SP) untuk anggota aktif dan pengurus.
        </p>
      </div>

      <DisciplineRecapTable
        summaries={summaries}
        activeSanctions={activeSanctions}
      />
    </div>
  );
}
