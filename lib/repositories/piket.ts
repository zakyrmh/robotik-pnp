import { createClient } from "@/lib/supabase/server";
import {
  getPiketWeekInfoForPeriod,
  isMemberOnInternship,
} from "@/lib/utils/piket-date";

export type PiketComplianceStatus =
  | "sudah-lapor"
  | "alpha"
  | "berlangsung"
  | "magang";

export interface PiketComplianceRow {
  profileId: string;
  memberName: string;
  nim: string | null;
  academicPeriod: string;
  weekNumber: number;
  roomTarget: string;
  startIsoDate: string;
  endIsoDate: string;
  status: PiketComplianceStatus;
}

export interface RawComplianceProfile {
  id: string;
  nim: string | null;
  full_name: string | null;
  is_on_internship?: boolean | null;
  internship_start_date?: string | null;
  internship_end_date?: string | null;
  registrations?: { full_name: string } | null;
}

export interface RawComplianceSchedule {
  id: string;
  academic_period: string;
  week_number: number;
  room_target: string;
  piket_members:
    | {
        id: string;
        profile_id: string | null;
        profiles: RawComplianceProfile | null;
      }[]
    | null;
}

export interface RawComplianceLog {
  schedule_id: string | null;
  reported_by: string | null;
  is_verified: boolean | null;
}

export function classifyPiketCompliance(
  hasValidLog: boolean,
  onInternship: boolean,
  weekEnded: boolean,
): PiketComplianceStatus {
  if (hasValidLog) return "sudah-lapor";
  if (onInternship) return "magang";
  return weekEnded ? "alpha" : "berlangsung";
}

export function buildComplianceRows(input: {
  academicPeriod: string;
  schedules: RawComplianceSchedule[];
  logs: RawComplianceLog[];
  today?: Date;
}): PiketComplianceRow[] {
  const today = input.today ?? new Date();
  const todayIso = formatIso(today);

  // Hanya log valid (bukan ditolak) yang dihitung. `is_verified === false`
  // berarti log ditolak (lihat lib/actions/piket.ts: .neq("is_verified", false)).
  const reportedSet = new Set(
    input.logs
      .filter((l) => l.reported_by && l.schedule_id && l.is_verified !== false)
      .map((l) => `${l.schedule_id}::${l.reported_by}`),
  );

  const rows: PiketComplianceRow[] = [];
  for (const sched of input.schedules) {
    const period = sched.academic_period || input.academicPeriod;
    const { startIsoDate, endIsoDate } = getPiketWeekInfoForPeriod(
      period,
      sched.week_number,
    );
    const weekEnded = endIsoDate < todayIso;

    for (const member of sched.piket_members ?? []) {
      const profile = member.profiles;
      if (!member.profile_id || !profile) continue;

      const hasValidLog = reportedSet.has(`${sched.id}::${member.profile_id}`);
      const onInternship = isMemberOnInternship(profile, startIsoDate);
      const status = classifyPiketCompliance(
        hasValidLog,
        onInternship,
        weekEnded,
      );

      rows.push({
        profileId: member.profile_id,
        memberName:
          profile.full_name || profile.registrations?.full_name || "Anggota",
        nim: profile.nim,
        academicPeriod: period,
        weekNumber: sched.week_number,
        roomTarget: sched.room_target,
        startIsoDate,
        endIsoDate,
        status,
      });
    }
  }
  return rows;
}

function formatIso(dt: Date): string {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function getPiketComplianceReport(
  academicPeriod: string,
): Promise<PiketComplianceRow[]> {
  const supabase = await createClient();

  const { data: schedules, error: schedError } = await supabase
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
          registrations ( full_name )
        )
      )
    `,
    )
    .eq("academic_period", academicPeriod)
    .order("week_number", { ascending: true });

  if (schedError) {
    console.error("[PIKET_COMPLIANCE_ERROR] Schedules:", schedError);
    return [];
  }

  const scheduleIds = (
    (schedules ?? []) as unknown as RawComplianceSchedule[]
  ).map((s) => s.id);
  if (scheduleIds.length === 0) return [];

  const { data: logs, error: logsError } = await supabase
    .from("piket_logs")
    .select("schedule_id, reported_by, is_verified")
    .in("schedule_id", scheduleIds);

  if (logsError) {
    console.error("[PIKET_COMPLIANCE_ERROR] Logs:", logsError);
  }

  return buildComplianceRows({
    academicPeriod,
    schedules: (schedules ?? []) as unknown as RawComplianceSchedule[],
    logs: (logs ?? []) as unknown as RawComplianceLog[],
  });
}
