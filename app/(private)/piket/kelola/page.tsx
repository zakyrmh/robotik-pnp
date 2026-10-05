import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KelolaPiketClient } from "@/components/features/piket/kelola-piket-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Kelola Penjadwalan Piket Kebersihan | UKM Robotik PNP",
  description:
    "Antarmuka kelola periode DPH dan penataan daftar anggota piket kebersihan ruang kesekretariatan & ruang workshop DPH",
};

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

interface RawProfileCandidate {
  id: string;
  nim: string | null;
  full_name: string | null;
  role: string;
  registrations: {
    full_name: string;
  } | null;
}

export default async function KelolaPiketPage() {
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

  // RBAC Guard: Only super-admin and admin-kestari are allowed
  if (profile.role !== "super-admin" && profile.role !== "admin-kestari") {
    redirect("/piket");
  }

  // 1. Fetch all schedules across all periods
  const { data: schedules } = await supabase
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

  // 1b. Roster petugas via SECURITY DEFINER RPC (aman terhadap RLS profiles).
  const { data: rosterRows } = await supabase.rpc("get_piket_roster", {
    p_academic_period: null,
  });

  const rosterBySchedule = new Map<string, RawPiketRosterRow[]>();
  for (const row of (rosterRows ?? []) as RawPiketRosterRow[]) {
    const list = rosterBySchedule.get(row.schedule_id) ?? [];
    list.push(row);
    rosterBySchedule.set(row.schedule_id, list);
  }

  // Extract distinct available academic periods
  const periodSet = new Set<string>();
  ((schedules as unknown as RawPiketSchedule[]) || []).forEach((s) => {
    if (s.academic_period) periodSet.add(s.academic_period);
  });
  if (periodSet.size === 0) {
    periodSet.add("2026/2027");
  }
  const availablePeriods = Array.from(periodSet);

  // 2. Fetch active candidates for member allocation dropdown
  const { data: candidates } = await supabase
    .from("profiles")
    .select(
      `
      id,
      nim,
      full_name,
      role,
      is_on_internship,
      internship_start_date,
      internship_end_date,
      registrations (
        full_name
      )
    `,
    )
    .in("role", [
      "super-admin",
      "admin-or",
      "admin-komdis",
      "admin-kestari",
      "admin-divisi",
      "anggota",
    ])
    .eq("is_onboarded", true);

  type ExtendedCandidate = RawProfileCandidate & {
    is_on_internship?: boolean;
    internship_start_date?: string | null;
    internship_end_date?: string | null;
  };

  const activeCandidates = (
    (candidates as unknown as ExtendedCandidate[]) || []
  ).map((c) => ({
    id: c.id,
    nim: c.nim || "",
    name: c.full_name || c.registrations?.full_name || "Pengurus/Anggota",
    role: c.role,
    is_on_internship: c.is_on_internship ?? false,
    internship_start_date: c.internship_start_date || null,
    internship_end_date: c.internship_end_date || null,
  }));

  // Format schedules data. Members diambil dari RPC roster (bukan nested
  // join profiles yang kena RLS untuk role non-admin).
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
      role: m.role || "",
      is_on_internship: m.is_on_internship ?? false,
      internship_start_date: m.internship_start_date || null,
      internship_end_date: m.internship_end_date || null,
    })),
  }));

  return (
    <Suspense fallback={<KelolaPiketSkeleton />}>
      <KelolaPiketClient
        profile={{
          id: profile.id,
          email: profile.email,
          role: profile.role,
          is_onboarded: profile.is_onboarded,
        }}
        availablePeriods={availablePeriods}
        allSchedules={formattedSchedules}
        activeCandidates={activeCandidates}
      />
    </Suspense>
  );
}

function KelolaPiketSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 px-2 sm:px-4 lg:px-6">
      <Skeleton className="h-6 w-36 bg-slate-200 dark:bg-slate-800" />
      <Skeleton className="h-24 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
      <Skeleton className="h-16 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton
            key={i}
            className="h-64 w-full rounded-xl bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>
    </div>
  );
}
