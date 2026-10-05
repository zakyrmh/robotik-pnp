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

/**
 * Status turunan sebuah log piket. Sumber tunggal (single source of truth)
 * untuk server & klien — `components/features/piket/types.ts` hanya
 * me-re-export tipe ini.
 */
export type PiketLogStatus = "approved" | "pending" | "rejected" | "auto_final";

/**
 * Derivasi status log piket dari flag verifikasi (murni). Logika identik
 * dengan `getPiketLogStatus` di sisi komponen; disalin ke repo agar layer
 * data tidak mengimpor komponen.
 *
 * - `rejected`  → belum diverifikasi (`isVerified === false`)
 * - `auto_final` → final tanpa nama verifier (auto-finalize sistem)
 * - `approved`  → final dan ber-verifier
 * - `pending`   → selainnya
 *
 * `rejectionReason` disertakan agar pemanggil dapat menurunkan status dari
 * baris RPC secara lengkap tanpa pra-proses.
 */
export function deriveLogStatus(
  isVerified: boolean,
  isFinal: boolean,
  verifierName: string,
  rejectionReason: string,
): PiketLogStatus {
  void rejectionReason;
  if (!isVerified) return "rejected";
  if (isFinal) return verifierName ? "approved" : "auto_final";
  return "pending";
}

/** Baris histori log piket siap-pakai untuk halaman `/piket/riwayat`. */
export interface PiketHistoryLog {
  id: string;
  scheduleId: string | null;
  academicPeriod: string;
  weekNumber: number;
  roomTarget: string;
  dutyDate: string;
  reportedById: string | null;
  reporterName: string;
  reporterNim: string | null;
  status: PiketLogStatus;
  rejectionReason: string;
  verifiedAt: string;
  verifierName: string;
  notes: string;
  proofImageUrl: string;
  proofImageBeforeUrl: string;
  createdAt: string;
}

/** Filter histori piket (server/klien). `null`/`undefined` = tanpa filter. */
export interface PiketHistoryFilter {
  academicPeriod: string;
  year?: number | null;
  monthIndex0?: number | null;
  weekNumber?: number | null;
}

/** Parse `YYYY-MM-DD` → `{ y, m0 }`; null bila tanggal tidak valid. */
function parseIsoDate(iso: string): { y: number; m0: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  return { y: Number(match[1]), m0: Number(match[2]) - 1 };
}

/**
 * Apakah `(y, m0)` berada di dalam rentang periode akademik "YYYY/YYYY"
 * (1 Juli tahun pertama s.d. 30 Juni tahun kedua). Bila periode tak
 * terparsir, anggap cocok (jangan saring keluar).
 */
function withinPeriod(academicPeriod: string, y: number, m0: number): boolean {
  const span = getPeriodSpan(academicPeriod);
  if (!span) return true;
  const months = y * 12 + m0;
  const start = span.startYear * 12 + span.startMonthIndex0;
  const end = span.endYear * 12 + span.endMonthIndex0;
  return months >= start && months <= end;
}

function matchesFilter(
  parts: { y: number; m0: number } | null,
  f: PiketHistoryFilter,
  weekNumber: number,
): boolean {
  if (!parts) return false;
  // Batasi tahun kalender ke rentang periode akademik HANYA bila filter
  // tahun/bulan aktif, sehingga tanpa filter tahun/bulan seluruh baris
  // periode tetap lolos (mis. data lama di luar rentang tetap tampil).
  const yearOrMonthActive = f.year != null || f.monthIndex0 != null;
  if (yearOrMonthActive && !withinPeriod(f.academicPeriod, parts.y, parts.m0)) {
    return false;
  }
  if (f.year != null && parts.y !== f.year) return false;
  if (f.monthIndex0 != null && parts.m0 !== f.monthIndex0) return false;
  if (f.weekNumber != null && weekNumber !== f.weekNumber) return false;
  return true;
}

/**
 * Saring log histori berdasarkan periode akademik + tahun/bulan/pekan (murni).
 * Rentang periode akademik ikut membatasi tahun kalender (mis. "2026/2027"
 * hanya menjangkau Jul 2026 – Jun 2027), lalu hasil diurutkan menurun per
 * `dutyDate` mengikuti urutan RPC.
 */
export function filterPiketLogs(
  logs: PiketHistoryLog[],
  f: PiketHistoryFilter,
): PiketHistoryLog[] {
  return logs
    .filter(
      (log) =>
        log.academicPeriod === f.academicPeriod &&
        matchesFilter(parseIsoDate(log.dutyDate), f, log.weekNumber),
    )
    .sort((a, b) =>
      a.dutyDate < b.dutyDate ? 1 : a.dutyDate > b.dutyDate ? -1 : 0,
    );
}

/** Saring baris compliance berdasarkan periode akademik + tahun/bulan/pekan (murni). */
export function filterComplianceRows(
  rows: PiketComplianceRow[],
  f: PiketHistoryFilter,
): PiketComplianceRow[] {
  return rows.filter(
    (row) =>
      row.academicPeriod === f.academicPeriod &&
      matchesFilter(parseIsoDate(row.startIsoDate), f, row.weekNumber),
  );
}

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

/** Baris hasil RPC `get_piket_roster` (SECURITY DEFINER). */
interface RawPiketRosterRow {
  schedule_id: string;
  academic_period: string;
  week_number: number;
  room_target: string;
  member_id: string;
  profile_id: string | null;
  nim: string | null;
  full_name: string | null;
  is_on_internship: boolean;
  internship_start_date: string | null;
  internship_end_date: string | null;
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
      room_target
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

  const baseSchedules =
    (schedules as unknown as {
      id: string;
      academic_period: string;
      week_number: number;
      room_target: string;
    }[]) ?? [];
  if (baseSchedules.length === 0) return [];

  // Roster petugas via SECURITY DEFINER RPC. RLS `profiles` memblokir viewer
  // (mis. admin-kestari) membaca profil pengurus (super-admin/admin-*), sehingga
  // nested join `piket_members -> profiles` menghasilkan null untuk mereka.
  const { data: rosterRows, error: rosterError } = await supabase.rpc(
    "get_piket_roster",
    { p_academic_period: academicPeriod },
  );

  if (rosterError) {
    console.error("[PIKET_COMPLIANCE_ERROR] Roster:", rosterError);
    throw new PiketComplianceError(
      "Gagal memuat daftar petugas piket untuk periode ini.",
      rosterError,
    );
  }

  // Rekonstruksi bentuk RawComplianceSchedule dari (schedules + roster RPC)
  // agar buildComplianceRows tetap dipakai tanpa perubahan.
  const membersBySchedule = new Map<string, RawPiketRosterRow[]>();
  for (const row of (rosterRows ?? []) as unknown as RawPiketRosterRow[]) {
    const list = membersBySchedule.get(row.schedule_id) ?? [];
    list.push(row);
    membersBySchedule.set(row.schedule_id, list);
  }

  const typedSchedules: RawComplianceSchedule[] = baseSchedules.map((s) => ({
    id: s.id,
    academic_period: s.academic_period,
    week_number: s.week_number,
    room_target: s.room_target,
    piket_members: (membersBySchedule.get(s.id) ?? []).map((m) => ({
      id: m.member_id,
      profile_id: m.profile_id,
      profiles: m.profile_id
        ? {
            id: m.profile_id,
            nim: m.nim,
            full_name: m.full_name,
            is_on_internship: m.is_on_internship,
            internship_start_date: m.internship_start_date,
            internship_end_date: m.internship_end_date,
            registrations: null,
          }
        : null,
    })),
  }));

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

/** Baris hasil RPC `get_piket_history_logs` (SECURITY DEFINER). */
interface RawPiketHistoryRow {
  id: string;
  schedule_id: string | null;
  academic_period: string | null;
  week_number: number | null;
  room_target: string | null;
  duty_date: string | null;
  reported_by: string | null;
  reporter_name: string | null;
  reporter_nim: string | null;
  is_verified: boolean | null;
  is_final: boolean | null;
  rejection_reason: string | null;
  verified_at: string | null;
  verifier_name: string | null;
  notes: string | null;
  proof_image_url: string | null;
  proof_image_before_url: string | null;
  created_at: string | null;
}

export class PiketHistoryError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PiketHistoryError";
  }
}

/**
 * Ambil histori log piket via RPC `get_piket_history_logs` (SECURITY DEFINER,
 * menembus RLS `profiles` agar nama pengurus ikut terbaca). `academicPeriod`
 * `null` = seluruh periode.
 */
export async function getPiketHistoryLogs(
  academicPeriod: string | null,
): Promise<PiketHistoryLog[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_piket_history_logs", {
    p_academic_period: academicPeriod,
  });

  if (error) {
    console.error("[PIKET_HISTORY_ERROR] Logs:", error);
    throw new PiketHistoryError(
      "Gagal memuat histori piket untuk periode ini.",
      error,
    );
  }

  return ((data ?? []) as unknown as RawPiketHistoryRow[]).map((row) => {
    const isVerified = row.is_verified === true;
    const isFinal = row.is_final === true;
    const verifierName = row.verifier_name ?? "";
    const rejectionReason = row.rejection_reason ?? "";
    return {
      id: row.id,
      scheduleId: row.schedule_id,
      academicPeriod: row.academic_period ?? "",
      weekNumber: row.week_number ?? 0,
      roomTarget: row.room_target ?? "",
      dutyDate: row.duty_date ?? "",
      reportedById: row.reported_by,
      reporterName: row.reporter_name ?? "Anggota",
      reporterNim: row.reporter_nim,
      status: deriveLogStatus(
        isVerified,
        isFinal,
        verifierName,
        rejectionReason,
      ),
      rejectionReason,
      verifiedAt: row.verified_at ?? "",
      verifierName,
      notes: row.notes ?? "",
      proofImageUrl: row.proof_image_url ?? "",
      proofImageBeforeUrl: row.proof_image_before_url ?? "",
      createdAt: row.created_at ?? "",
    };
  });
}

/**
 * Laporan kepatuhan piket untuk halaman riwayat. Delegasi tipis ke
 * `getPiketComplianceReport` agar konsumen histori punya satu pintu.
 */
export async function getPiketHistoryCompliance(
  academicPeriod: string,
): Promise<PiketComplianceRow[]> {
  return getPiketComplianceReport(academicPeriod);
}

/**
 * Entri histori piket seorang anggota lintas periode, siap-pakai untuk
 * drawer riwayat anggota (`getPiketMemberHistory`).
 *
 * `id` bersifat sintetis (`${scheduleId ?? "no-schedule"}::${createdAt}`) karena
 * RPC `get_piket_member_history` tidak memproyeksikan `piket_logs.id`;
 * kombinasi jadwal + waktu dibuat unik dan stabil sebagai React key.
 */
export interface PiketMemberHistoryEntry {
  id: string;
  scheduleId: string | null;
  academicPeriod: string;
  weekNumber: number;
  roomTarget: string;
  dutyDate: string;
  status: PiketLogStatus;
  rejectionReason: string;
  verifierName: string;
  notes: string;
  proofImageUrl: string;
  proofImageBeforeUrl: string;
  createdAt: string;
}

/** Baris hasil RPC `get_piket_member_history` (SECURITY DEFINER). */
interface RawPiketMemberHistoryRow {
  schedule_id: string | null;
  academic_period: string | null;
  week_number: number | null;
  room_target: string | null;
  duty_date: string | null;
  is_verified: boolean | null;
  is_final: boolean | null;
  rejection_reason: string | null;
  verified_by: string | null;
  verifier_name: string | null;
  notes: string | null;
  proof_image_url: string | null;
  proof_image_before_url: string | null;
  created_at: string | null;
}

/**
 * Ambil histori log piket seorang anggota via RPC `get_piket_member_history`
 * (SECURITY DEFINER, menembus RLS `profiles` agar nama verifier pengurus ikut
 * terbaca). Mengembalikan seluruh periode, terurut menurun per `duty_date`.
 */
export async function getPiketMemberHistory(
  profileId: string,
): Promise<PiketMemberHistoryEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_piket_member_history", {
    p_profile_id: profileId,
  });

  if (error) {
    console.error("[PIKET_MEMBER_HISTORY_ERROR] Logs:", error);
    throw new PiketHistoryError(
      "Gagal memuat histori piket anggota ini.",
      error,
    );
  }

  return ((data ?? []) as unknown as RawPiketMemberHistoryRow[]).map((row) => {
    const isVerified = row.is_verified === true;
    const isFinal = row.is_final === true;
    const verifierName = row.verifier_name ?? "";
    const rejectionReason = row.rejection_reason ?? "";
    const createdAt = row.created_at ?? "";
    return {
      id: `${row.schedule_id ?? "no-schedule"}::${createdAt}`,
      scheduleId: row.schedule_id,
      academicPeriod: row.academic_period ?? "",
      weekNumber: row.week_number ?? 0,
      roomTarget: row.room_target ?? "",
      dutyDate: row.duty_date ?? "",
      status: deriveLogStatus(
        isVerified,
        isFinal,
        verifierName,
        rejectionReason,
      ),
      rejectionReason,
      verifierName,
      notes: row.notes ?? "",
      proofImageUrl: row.proof_image_url ?? "",
      proofImageBeforeUrl: row.proof_image_before_url ?? "",
      createdAt,
    };
  });
}
