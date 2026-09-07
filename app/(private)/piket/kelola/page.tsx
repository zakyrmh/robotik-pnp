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
  piket_members:
    | {
        id: string;
        profile_id: string;
        profiles: {
          id: string;
          nim: string | null;
          role: string;
          registrations: {
            full_name: string;
          } | null;
        } | null;
      }[]
    | null;
}

interface RawProfileCandidate {
  id: string;
  nim: string | null;
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
      room_target,
      piket_members (
        id,
        profile_id,
        profiles (
          id,
          nim,
          role,
          registrations (
            full_name
          )
        )
      )
    `,
    )
    .order("academic_period", { ascending: false })
    .order("week_number", { ascending: true });

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
      role,
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

  const activeCandidates = (
    (candidates as unknown as RawProfileCandidate[]) || []
  ).map((c) => ({
    id: c.id,
    nim: c.nim || "",
    name: c.registrations?.full_name || "Pengurus/Anggota",
    role: c.role,
  }));

  // Format schedules data
  const formattedSchedules = (
    (schedules as unknown as RawPiketSchedule[]) || []
  ).map((sched) => ({
    id: sched.id,
    academic_period: sched.academic_period,
    week_number: sched.week_number,
    room_target: sched.room_target,
    members: (sched.piket_members || []).map((m) => ({
      member_id: m.id,
      profile_id: m.profile_id,
      nim: m.profiles?.nim || "",
      name: m.profiles?.registrations?.full_name || "Anggota",
      role: m.profiles?.role || "",
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
