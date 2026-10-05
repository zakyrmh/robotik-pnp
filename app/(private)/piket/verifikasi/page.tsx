import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { finalizeExpiredPiketReviews } from "@/lib/actions/piket";
import { getPiketComplianceReport } from "@/lib/repositories/piket";
import type { PiketComplianceRow } from "@/lib/repositories/piket";
import { PiketVerificationClient } from "@/components/features/piket/piket-verification-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Verifikasi & Denda Piket | UKM Robotik PNP",
  description:
    "Verifikasi laporan piket, kelola denda, dan laporan kepatuhan kebersihan UKM Robotik PNP",
};

interface RawPiketLog {
  id: string;
  duty_date: string;
  notes: string | null;
  proof_image_url: string;
  proof_image_before_url: string | null;
  is_verified: boolean | null;
  is_final: boolean;
  rejection_reason: string | null;
  verified_at: string | null;
  schedule_id: string | null;
  piket_schedules: {
    id: string;
    academic_period: string;
    week_number: number;
    room_target: string;
  } | null;
  reported_by: string | null;
  verified_by: string | null;
}

interface RawPiketFine {
  id: string;
  amount: number;
  status: string;
  notes: string | null;
  imposed_by: string | null;
  paid_at: string | null;
  created_at: string;
  profile_id: string;
  schedule_id: string | null;
  piket_schedules: {
    id: string;
    academic_period: string;
    week_number: number;
    room_target: string;
  } | null;
}

/**
 * Baris hasil RPC `get_piket_person_names` (SECURITY DEFINER). Sumber nama
 * pelapor / verifikator / pemilik denda yang aman terhadap RLS `profiles`
 * (lihat migration 20261005010000_fix_piket_verifikasi_names_rls.sql).
 */
interface RawPiketPersonName {
  id: string;
  nim: string | null;
  full_name: string | null;
}

interface RawPiketSchedule {
  id: string;
  academic_period: string;
  week_number: number;
  room_target: string;
}

/**
 * Baris hasil RPC `get_piket_roster` (SECURITY DEFINER). Sumber nama petugas
 * yang aman terhadap RLS `profiles` (lihat migration
 * 20261005000000_fix_piket_roster_rls_for_members.sql).
 */
interface RawPiketRosterRow {
  schedule_id: string;
  academic_period: string;
  week_number: number;
  room_target: string;
  member_id: string;
  profile_id: string | null;
  nim: string | null;
  full_name: string | null;
  role: string | null;
  is_on_internship: boolean;
  internship_start_date: string | null;
  internship_end_date: string | null;
}

export default async function PiketVerifikasiPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role, is_onboarded")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // RBAC guard: hanya super-admin & admin-kestari yang boleh mengakses
  // halaman verifikasi. Guard dijalankan SEBELUM fetch data admin apa pun
  // agar role lain tidak pernah menyentuh data seluruh anggota.
  if (profile.role !== "super-admin" && profile.role !== "admin-kestari") {
    redirect("/piket");
  }

  // Lazy auto-finalisasi: laporan auto-terverifikasi yang pekannya sudah
  // berakhir difinalisasi sistem saat halaman dilihat Kestari / Super Admin.
  await finalizeExpiredPiketReviews();

  // 1. Fetch all schedules across all periods (same source of truth as /piket/kelola)
  const { data: schedules, error: schedulesError } = await supabase
    .from("piket_schedules")
    .select(
      `
      id,
      academic_period,
      week_number,
      room_target
    `,
    )
    .order("academic_period", { ascending: false })
    .order("week_number", { ascending: true });

  if (schedulesError) {
    console.error("[PIKET_PAGE_ERROR] Schedules query error:", schedulesError);
  }

  // 1b. Roster petugas via SECURITY DEFINER RPC (aman terhadap RLS profiles).
  const { data: rosterRows, error: rosterError } = await supabase.rpc(
    "get_piket_roster",
    { p_academic_period: null },
  );

  if (rosterError) {
    console.error("[PIKET_PAGE_ERROR] Roster RPC error:", rosterError);
  }

  const rosterBySchedule = new Map<string, RawPiketRosterRow[]>();
  for (const row of (rosterRows ?? []) as RawPiketRosterRow[]) {
    const list = rosterBySchedule.get(row.schedule_id) ?? [];
    list.push(row);
    rosterBySchedule.set(row.schedule_id, list);
  }

  // Derive available periods dynamically so kelola & user view stay in sync
  const periodSet = new Set<string>();
  ((schedules as unknown as RawPiketSchedule[]) || []).forEach((s) => {
    if (s.academic_period) periodSet.add(s.academic_period);
  });
  if (periodSet.size === 0) {
    periodSet.add("2026/2027");
  }
  const availablePeriods = Array.from(periodSet).sort().reverse();

  // 2. Fetch all piket logs (id pelapor & verifikator saja; nama diambil via RPC)
  const { data: logs, error: logsError } = await supabase
    .from("piket_logs")
    .select(
      `
      id,
      duty_date,
      notes,
      proof_image_url,
      proof_image_before_url,
      is_verified,
      is_final,
      rejection_reason,
      verified_at,
      schedule_id,
      piket_schedules (
        id,
        academic_period,
        week_number,
        room_target
      ),
      reported_by,
      verified_by
    `,
    )
    .order("duty_date", { ascending: false });

  if (logsError) {
    console.error("[PIKET_PAGE_ERROR] Logs query error:", logsError);
  }

  // 3. Fetch all piket fines (denda administratif, dikelola Kestari)
  const { data: fines, error: finesError } = await supabase
    .from("piket_fines")
    .select(
      `
      id,
      amount,
      status,
      notes,
      imposed_by,
      paid_at,
      created_at,
      profile_id,
      schedule_id,
      piket_schedules (
        id,
        academic_period,
        week_number,
        room_target
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (finesError) {
    console.error("[PIKET_PAGE_ERROR] Fines query error:", finesError);
  }

  // 3b. Resolve nama pelapor / verifikator / pemilik denda via SECURITY DEFINER
  // RPC. RLS `profiles` memblokir admin-kestari membaca profil pengurus
  // (super-admin / admin-*), sehingga join langsung menghasilkan null.
  const personIds = new Set<string>();
  for (const log of (logs ?? []) as unknown as RawPiketLog[]) {
    if (log.reported_by) personIds.add(log.reported_by);
    if (log.verified_by) personIds.add(log.verified_by);
  }
  for (const fine of (fines ?? []) as unknown as RawPiketFine[]) {
    if (fine.profile_id) personIds.add(fine.profile_id);
  }

  const personById = new Map<string, RawPiketPersonName>();
  if (personIds.size > 0) {
    const { data: personRows, error: personsError } = await supabase.rpc(
      "get_piket_person_names",
      { p_ids: Array.from(personIds) },
    );
    if (personsError) {
      console.error("[PIKET_PAGE_ERROR] Person names RPC error:", personsError);
    }
    for (const person of (personRows ?? []) as RawPiketPersonName[]) {
      personById.set(person.id, person);
    }
  }

  // Format logs data
  const formattedLogs = ((logs as unknown as RawPiketLog[]) || []).map(
    (log) => {
      const weekNumber = log.piket_schedules?.week_number;
      const scheduleLabel =
        typeof weekNumber === "number" ? `PEKAN ${weekNumber}` : "JADWAL PIKET";
      return {
        id: log.id,
        duty_date: log.duty_date,
        notes: log.notes || "",
        proof_image_url: log.proof_image_url || "",
        proof_image_before_url: log.proof_image_before_url || "",
        is_verified: log.is_verified ?? true,
        is_final: log.is_final ?? false,
        rejection_reason: log.rejection_reason || "",
        verified_at: log.verified_at || "",
        schedule_id: log.schedule_id || "",
        academic_period:
          log.piket_schedules?.academic_period || availablePeriods[0],
        schedule_day: scheduleLabel,
        reporter_id: log.reported_by || "",
        reporter_name:
          (log.reported_by ? personById.get(log.reported_by)?.full_name : "") ||
          "Anggota",
        reporter_nim:
          (log.reported_by ? personById.get(log.reported_by)?.nim : "") || "",
        verifier_name:
          (log.verified_by ? personById.get(log.verified_by)?.full_name : "") ||
          "",
      };
    },
  );

  // Format fines data
  const formattedFines = ((fines as unknown as RawPiketFine[]) || []).map(
    (fine) => ({
      id: fine.id,
      amount: fine.amount,
      status: fine.status,
      notes: fine.notes || "",
      imposed_by: fine.imposed_by || "",
      paid_at: fine.paid_at || "",
      created_at: fine.created_at,
      profile_id: fine.profile_id,
      schedule_id: fine.schedule_id || "",
      academic_period: fine.piket_schedules?.academic_period || "",
      week_number: fine.piket_schedules?.week_number ?? 0,
      member_name:
        (fine.profile_id ? personById.get(fine.profile_id)?.full_name : "") ||
        "Anggota",
      member_nim:
        (fine.profile_id ? personById.get(fine.profile_id)?.nim : "") || "",
    }),
  );

  // Format schedules data — keep real week_number / academic_period from DB.
  // Members diambil dari RPC roster (bukan nested join profiles yang kena RLS).
  const formattedSchedules = (
    (schedules as unknown as RawPiketSchedule[]) || []
  ).map((sched) => ({
    id: sched.id,
    academic_period: sched.academic_period,
    week_number: sched.week_number,
    room_target: sched.room_target,
    members: (rosterBySchedule.get(sched.id) ?? []).map((m) => ({
      member_id: m.member_id,
      profile_id: m.profile_id || "",
      nim: m.nim || "",
      name: m.full_name || "Anggota",
      is_on_internship: m.is_on_internship ?? false,
      internship_start_date: m.internship_start_date || null,
      internship_end_date: m.internship_end_date || null,
    })),
  }));

  let compliance: PiketComplianceRow[] = [];
  let complianceError: string | null = null;
  try {
    compliance = await getPiketComplianceReport(availablePeriods[0]);
  } catch (err: unknown) {
    console.error("[PIKET_PAGE_ERROR] Compliance query error:", err);
    complianceError = "Gagal memuat laporan kepatuhan. Coba muat ulang.";
  }

  return (
    <Suspense fallback={<VerifikasiSkeleton />}>
      <PiketVerificationClient
        profile={{
          id: profile.id,
          email: profile.email,
          role: profile.role,
          is_onboarded: profile.is_onboarded,
        }}
        availablePeriods={availablePeriods}
        logs={formattedLogs}
        fines={formattedFines}
        schedules={formattedSchedules}
        compliance={compliance}
        complianceError={complianceError}
      />
    </Suspense>
  );
}

function VerifikasiSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 px-2 sm:px-4 lg:px-6">
      <Skeleton className="h-24 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
      <Skeleton className="h-80 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}
