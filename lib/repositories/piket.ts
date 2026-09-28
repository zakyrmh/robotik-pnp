import { createClient } from "@/lib/supabase/server";
import {
  getPiketWeeksForMonth,
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
  /** Label bulan siklus baris ini, mis. "Juli 2026". */
  cycleMonthLabel: string;
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
  duty_date: string | null;
}

/**
 * Konvensi rentang periode akademik: "YYYY/YYYY" membentang dari
 * 1 Juli tahun pertama s.d. 30 Juni tahun kedua (tahun akademik gaya
 * Indonesia). Dipilih karena `piket_schedules` hanya menyimpan periode DPH +
 * `week_number` (template bulanan berulang) tanpa tanggal, sehingga compliance
 * dievaluasi ulang untuk setiap bulan kalender dalam rentang ini.
 */
export function getPeriodSpan(academicPeriod: string): {
  startYear: number;
  startMonthIndex0: number;
  endYear: number;
  endMonthIndex0: number;
} | null {
  const match = /^(\d{4})\/(\d{4})$/.exec(academicPeriod);
  if (!match) return null;
  const startYear = Number(match[1]);
  const endYear = Number(match[2]);
  return { startYear, startMonthIndex0: 6, endYear, endMonthIndex0: 5 };
}

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

function monthLabel(year: number, monthIndex0: number): string {
  return `${MONTH_NAMES_ID[monthIndex0]} ${year}`;
}

/** Daftar bulan siklus (year, monthIndex0) dari awal periode s.d. bulan `today`. */
function enumerateCycleMonths(
  academicPeriod: string,
  today: Date,
): { year: number; monthIndex0: number }[] | null {
  const span = getPeriodSpan(academicPeriod);
  if (!span) return null;

  const periodStart = new Date(span.startYear, span.startMonthIndex0, 1);
  const periodEndExclusive = new Date(span.endYear, span.endMonthIndex0 + 1, 1);

  // Sebelum periode dimulai → tidak ada baris.
  if (today.getTime() < periodStart.getTime()) return [];

  // Bulan siklus berjalan (ditentukan oleh Kamis pekan ini).
  const currentCycle = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonth =
    currentCycle.getTime() > periodEndExclusive.getTime()
      ? new Date(span.endYear, span.endMonthIndex0, 1)
      : currentCycle;

  const months: { year: number; monthIndex0: number }[] = [];
  const cursor = new Date(periodStart.getTime());
  while (cursor.getTime() <= lastMonth.getTime()) {
    months.push({
      year: cursor.getFullYear(),
      monthIndex0: cursor.getMonth(),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
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

  const cycleMonths = enumerateCycleMonths(input.academicPeriod, today);
  if (!cycleMonths || cycleMonths.length === 0) return [];

  // Log valid (bukan ditolak) per (schedule_id, pelapor), beserta tanggal tugas.
  const validLogs = input.logs.filter(
    (l) => l.reported_by && l.schedule_id && l.is_verified !== false,
  );

  // Peta (schedule_id::profile_id) → daftar duty_date.
  const logsByMember = new Map<string, string[]>();
  for (const log of validLogs) {
    const key = `${log.schedule_id}::${log.reported_by}`;
    const dates = logsByMember.get(key) ?? [];
    if (log.duty_date) dates.push(log.duty_date);
    logsByMember.set(key, dates);
  }

  const rows: PiketComplianceRow[] = [];
  for (const sched of input.schedules) {
    const period = sched.academic_period || input.academicPeriod;

    for (const cycleMonth of cycleMonths) {
      const weeks = getPiketWeeksForMonth(
        cycleMonth.year,
        cycleMonth.monthIndex0,
      );
      const week = weeks.find((w) => w.weekNumber === sched.week_number);
      if (!week) continue;

      const weekEnded = week.endIsoDate < todayIso;
      const label = monthLabel(cycleMonth.year, cycleMonth.monthIndex0);

      for (const member of sched.piket_members ?? []) {
        const profile = member.profiles;
        if (!member.profile_id || !profile) continue;

        const logDates = logsByMember.get(`${sched.id}::${member.profile_id}`);
        const hasValidLog =
          logDates?.some(
            (d) => d >= week.startIsoDate && d <= week.endIsoDate,
          ) ?? false;
        const onInternship = isMemberOnInternship(profile, week.startIsoDate);
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
          startIsoDate: week.startIsoDate,
          endIsoDate: week.endIsoDate,
          cycleMonthLabel: label,
          status,
        });
      }
    }
  }

  // Urutkan per bulan siklus, lalu pekan, lalu nama anggota agar UI rapi.
  rows.sort((a, b) => {
    if (a.startIsoDate !== b.startIsoDate) {
      return a.startIsoDate < b.startIsoDate ? -1 : 1;
    }
    if (a.weekNumber !== b.weekNumber) return a.weekNumber - b.weekNumber;
    return a.memberName.localeCompare(b.memberName);
  });

  return rows;
}

function formatIso(dt: Date): string {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export class PiketComplianceError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PiketComplianceError";
  }
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
    throw new PiketComplianceError(
      "Gagal memuat jadwal piket untuk periode ini.",
      schedError,
    );
  }

  const typedSchedules = (schedules ??
    []) as unknown as RawComplianceSchedule[];
  if (typedSchedules.length === 0) return [];

  const scheduleIds = typedSchedules.map((s) => s.id);

  const { data: logs, error: logsError } = await supabase
    .from("piket_logs")
    .select("schedule_id, reported_by, is_verified, duty_date")
    .in("schedule_id", scheduleIds);

  if (logsError) {
    console.error("[PIKET_COMPLIANCE_ERROR] Logs:", logsError);
    throw new PiketComplianceError(
      "Gagal memuat riwayat laporan piket untuk periode ini.",
      logsError,
    );
  }

  return buildComplianceRows({
    academicPeriod,
    schedules: typedSchedules,
    logs: (logs ?? []) as unknown as RawComplianceLog[],
  });
}
