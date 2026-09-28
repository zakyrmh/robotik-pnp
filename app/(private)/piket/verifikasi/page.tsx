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
  photo_taken_at_before: string | null;
  photo_taken_at_after: string | null;
  schedule_id: string | null;
  piket_schedules: {
    id: string;
    academic_period: string;
    week_number: number;
    room_target: string;
  } | null;
  reported_by: string | null;
  verified_by: string | null;
  profiles: {
    id: string;
    nim: string | null;
    full_name?: string | null;
    registrations: {
      full_name: string;
    } | null;
  } | null;
  verifier: {
    id: string;
    full_name?: string | null;
    registrations: {
      full_name: string;
    } | null;
  } | null;
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
  profiles: {
    id: string;
    nim: string | null;
    full_name?: string | null;
    registrations: {
      full_name: string;
    } | null;
  } | null;
  piket_schedules: {
    id: string;
    academic_period: string;
    week_number: number;
    room_target: string;
  } | null;
}

interface RawPiketSchedule {
  id: string;
  academic_period: string;
  week_number: number;
  room_target: string;
  piket_members:
    | {
        id: string;
        profile_id: string | null;
        profiles: {
          id: string;
          nim: string | null;
          full_name?: string | null;
          is_on_internship?: boolean;
          internship_start_date?: string | null;
          internship_end_date?: string | null;
          registrations: {
            full_name: string;
          } | null;
        } | null;
      }[]
    | null;
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
      room_target,
      piket_members (
        id,
        profile_id,
        profiles (
          id,
          nim,
          full_name,
          is_on_internship,
          internship_start_date,
          internship_end_date,
          registrations (
            full_name
          )
        )
      )
    `,
    )
    .order("academic_period", { ascending: false })
    .order("week_number", { ascending: true });

  if (schedulesError) {
    console.error("[PIKET_PAGE_ERROR] Schedules query error:", schedulesError);
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

  // 2. Fetch all piket logs (dengan relasi pelapor & verifikator)
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
      photo_taken_at_before,
      photo_taken_at_after,
      schedule_id,
      piket_schedules (
        id,
        academic_period,
        week_number,
        room_target
      ),
      reported_by,
      verified_by,
      profiles:reported_by (
        id,
        nim,
        full_name,
        registrations (
          full_name
        )
      ),
      verifier:verified_by (
        id,
        full_name,
        registrations (
          full_name
        )
      )
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
      profiles:profile_id (
        id,
        nim,
        full_name,
        registrations (
          full_name
        )
      ),
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
        photo_taken_at_before: log.photo_taken_at_before || "",
        photo_taken_at_after: log.photo_taken_at_after || "",
        schedule_id: log.schedule_id || "",
        academic_period:
          log.piket_schedules?.academic_period || availablePeriods[0],
        schedule_day: scheduleLabel,
        reporter_id: log.reported_by || "",
        reporter_name:
          log.profiles?.full_name ||
          log.profiles?.registrations?.full_name ||
          "Anggota",
        reporter_nim: log.profiles?.nim || "",
        verifier_name:
          log.verifier?.full_name ||
          log.verifier?.registrations?.full_name ||
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
        fine.profiles?.full_name ||
        fine.profiles?.registrations?.full_name ||
        "Anggota",
      member_nim: fine.profiles?.nim || "",
    }),
  );

  // Format schedules data — keep real week_number / academic_period from DB
  const formattedSchedules = (
    (schedules as unknown as RawPiketSchedule[]) || []
  ).map((sched) => ({
    id: sched.id,
    academic_period: sched.academic_period,
    week_number: sched.week_number,
    room_target: sched.room_target,
    members: (sched.piket_members || []).map((m) => ({
      member_id: m.id,
      profile_id: m.profile_id || "",
      nim: m.profiles?.nim || "",
      name:
        m.profiles?.full_name ||
        m.profiles?.registrations?.full_name ||
        "Anggota",
      is_on_internship: m.profiles?.is_on_internship ?? false,
      internship_start_date: m.profiles?.internship_start_date || null,
      internship_end_date: m.profiles?.internship_end_date || null,
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
