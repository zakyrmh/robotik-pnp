import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PiketClient } from "@/components/features/piket/piket-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Piket Kebersihan Kesekretariatan & Workshop | UKM Robotik PNP",
  description:
    "Modul jadwal piket kebersihan ruang kesekretariatan dan ruang workshop DPH UKM Robotik PNP",
};

interface RawPiketLog {
  id: string;
  duty_date: string;
  notes: string | null;
  proof_image_url: string;
  is_verified: boolean | null;
  schedule_id: string | null;
  piket_schedules: {
    id: string;
    day: string;
  } | null;
  reported_by: string | null;
  profiles: {
    id: string;
    nim: string | null;
    full_name?: string | null;
    registrations: {
      full_name: string;
    } | null;
  } | null;
}

function parsePiketLogDetails(log: {
  notes: string | null;
  proof_image_url: string;
}) {
  let beforeUrl = "";
  let afterUrl = log.proof_image_url || "";
  let cleanNotes = log.notes || "";

  if (cleanNotes.includes("Before URL:")) {
    const beforeMatch = cleanNotes.match(/Before URL:\s*([^\s|]+)/);
    const afterMatch = cleanNotes.match(/After URL:\s*([^\s|]+)/);
    const notesMatch = cleanNotes.match(/Notes:\s*(.*)$/);

    if (beforeMatch && beforeMatch[1]) {
      beforeUrl = beforeMatch[1];
    }
    if (afterMatch && afterMatch[1]) {
      afterUrl = afterMatch[1];
    }
    if (notesMatch && notesMatch[1]) {
      cleanNotes = notesMatch[1].trim();
    }
  }

  return {
    beforeUrl,
    afterUrl,
    cleanNotes,
  };
}

interface RawPiketSchedule {
  id: string;
  day: string;
  piket_members:
    | {
        id: string;
        profile_id: string | null;
        profiles: {
          id: string;
          nim: string | null;
          full_name?: string | null;
          registrations: {
            full_name: string;
          } | null;
        } | null;
      }[]
    | null;
}

interface RawPiketAssignment {
  schedule_id: string | null;
  piket_schedules: {
    id: string;
    day: string;
  } | null;
}

export default async function PiketPage() {
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

  // 1. Fetch all schedules across all periods
  const { data: schedules, error: schedulesError } = await supabase
    .from("piket_schedules")
    .select(
      `
      id,
      day,
      piket_members (
        id,
        profile_id,
        profiles (
          id,
          nim,
          full_name,
          registrations (
            full_name
          )
        )
      )
    `,
    )
    .order("id", { ascending: true });

  if (schedulesError) {
    console.error("[PIKET_PAGE_ERROR] Schedules query error:", schedulesError);
  }

  const availablePeriods = ["2026/2027"];

  // 2. Fetch current user's schedule assignments across all periods
  const { data: myAssignments, error: assignmentsError } = await supabase
    .from("piket_members")
    .select(
      `
      schedule_id,
      piket_schedules (
        id,
        day
      )
    `,
    )
    .eq("profile_id", user.id);

  if (assignmentsError) {
    console.error(
      "[PIKET_PAGE_ERROR] Assignments query error:",
      assignmentsError,
    );
  }

  // 3. Fetch piket logs (all logs, order by date desc)
  const { data: logs, error: logsError } = await supabase
    .from("piket_logs")
    .select(
      `
      id,
      duty_date,
      notes,
      proof_image_url,
      is_verified,
      schedule_id,
      piket_schedules (
        id,
        day
      ),
      reported_by,
      profiles:reported_by (
        id,
        nim,
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

  // Format logs data
  const formattedLogs = ((logs as unknown as RawPiketLog[]) || []).map(
    (log) => {
      const parsed = parsePiketLogDetails(log);
      const dayName = log.piket_schedules?.day
        ? `HARI ${log.piket_schedules.day.toUpperCase()}`
        : "JADWAL PIKET";
      return {
        id: log.id,
        duty_date: log.duty_date,
        notes: parsed.cleanNotes,
        proof_image_url: parsed.afterUrl,
        proof_image_before_url: parsed.beforeUrl,
        is_verified: log.is_verified ?? true,
        schedule_id: log.schedule_id || "",
        academic_period: "2026/2027",
        schedule_day: dayName,
        reporter_id: log.reported_by || "",
        reporter_name:
          log.profiles?.full_name ||
          log.profiles?.registrations?.full_name ||
          "Anggota",
        reporter_nim: log.profiles?.nim || "",
      };
    },
  );

  // Format schedules data
  const formattedSchedules = (
    (schedules as unknown as RawPiketSchedule[]) || []
  ).map((sched) => ({
    id: sched.id,
    academic_period: "2026/2027",
    week_number: 1,
    day: sched.day,
    room_target: "Kesekretariatan & Workshop",
    members: (sched.piket_members || []).map((m) => ({
      member_id: m.id,
      profile_id: m.profile_id || "",
      nim: m.profiles?.nim || "",
      name:
        m.profiles?.full_name ||
        m.profiles?.registrations?.full_name ||
        "Anggota",
    })),
  }));

  const userAssignments = (
    (myAssignments as unknown as RawPiketAssignment[]) || []
  ).map((assign) => ({
    schedule_id: assign.schedule_id || "",
    academic_period: "2026/2027",
    week_number: 1,
    day: assign.piket_schedules?.day || "senin",
    room_target: "Kesekretariatan & Workshop",
  }));

  return (
    <Suspense fallback={<PiketSkeleton />}>
      <PiketClient
        profile={{
          id: profile.id,
          email: profile.email,
          role: profile.role,
          is_onboarded: profile.is_onboarded,
        }}
        availablePeriods={availablePeriods}
        schedules={formattedSchedules}
        myAssignments={userAssignments}
        logs={formattedLogs}
      />
    </Suspense>
  );
}

function PiketSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 px-2 sm:px-4 lg:px-6">
      <Skeleton className="h-24 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-64 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="md:col-span-2 h-64 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
      <Skeleton className="h-80 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}
