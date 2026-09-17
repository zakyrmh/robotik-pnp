/**
 * Piket Date Utilities for UKM Robotik PNP
 * Calculates ISO cross-month calendar week (Monday to Sunday) and cycle month.
 */

/** Batas upload laporan per anggota per pekan (termasuk yang ditolak). */
export const MAX_PIKET_ATTEMPTS_PER_WEEK = 2;

/** Nominal default denda administratif piket (Rupiah). */
export const DEFAULT_PIKET_FINE_AMOUNT = 10000;

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

const MONTH_SHORT_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ags",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

export interface PiketWeekInfo {
  monday: Date;
  sunday: Date;
  thursday: Date;
  cycleYear: number;
  cycleMonth: number; // 0..11
  cycleMonthName: string;
  weekNumber: number; // 1..4
  dateRangeFormatted: string;
  startIsoDate: string; // YYYY-MM-DD
  endIsoDate: string; // YYYY-MM-DD
}

function formatLocalDate(dt: Date): string {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Calculates cycle month and week number (1 to 4) for a given date.
 * A week runs Monday 00:00:00 to Sunday 23:59:59.
 * The cycle month is determined by Thursday of the week.
 */
export function getPiketWeekInfo(targetDate: Date = new Date()): PiketWeekInfo {
  const d = new Date(targetDate.getTime());
  const day = d.getDay(); // 0 (Sun) .. 6 (Sat)

  // Difference to Monday (Monday = 1)
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(
    d.getFullYear(),
    d.getMonth(),
    diffToMonday,
    0,
    0,
    0,
    0,
  );

  const sunday = new Date(
    monday.getFullYear(),
    monday.getMonth(),
    monday.getDate() + 6,
    23,
    59,
    59,
    999,
  );
  const thursday = new Date(
    monday.getFullYear(),
    monday.getMonth(),
    monday.getDate() + 3,
    12,
    0,
    0,
    0,
  );

  const cycleYear = thursday.getFullYear();
  const cycleMonth = thursday.getMonth();
  const cycleMonthName = MONTH_NAMES_ID[cycleMonth];

  // Find Monday of Week 1 of cycleMonth
  // Week 1 of cycleMonth is the week containing the first Thursday of cycleMonth
  const firstOfMonth = new Date(cycleYear, cycleMonth, 1);
  const firstOfMonthDay = firstOfMonth.getDay(); // 0 (Sun) .. 6 (Sat)
  const firstMondayDiff = 1 - (firstOfMonthDay === 0 ? 6 : firstOfMonthDay - 1);
  const week1Monday = new Date(
    cycleYear,
    cycleMonth,
    firstMondayDiff,
    0,
    0,
    0,
    0,
  );

  // Difference in weeks between current Monday and week1Monday
  const diffInDays = Math.round(
    (monday.getTime() - week1Monday.getTime()) / (1000 * 60 * 60 * 24),
  );
  let weekNumber = Math.floor(diffInDays / 7) + 1;

  if (weekNumber > 4) weekNumber = 4;
  if (weekNumber < 1) weekNumber = 1;

  // Format date range: e.g. "31 Ags - 6 Sep 2026"
  const mDay = monday.getDate();
  const mMonth = MONTH_SHORT_ID[monday.getMonth()];
  const sDay = sunday.getDate();
  const sMonth = MONTH_SHORT_ID[sunday.getMonth()];
  const sYear = sunday.getFullYear();

  const dateRangeFormatted =
    monday.getMonth() === sunday.getMonth()
      ? `${mDay} - ${sDay} ${sMonth} ${sYear}`
      : `${mDay} ${mMonth} - ${sDay} ${sMonth} ${sYear}`;

  const startIsoDate = formatLocalDate(monday);
  const endIsoDate = formatLocalDate(sunday);

  return {
    monday,
    sunday,
    thursday,
    cycleYear,
    cycleMonth,
    cycleMonthName,
    weekNumber,
    dateRangeFormatted,
    startIsoDate,
    endIsoDate,
  };
}

/** Toleransi jam untuk perbedaan clock client vs server (5 menit). */
const FUTURE_SKEW_MS = 5 * 60 * 1000;

/**
 * Menentukan apakah sebuah tanggal/instan pengambilan foto berada dalam
 * rentang pekan piket (Senin–Minggu, startIsoDate s.d. endIsoDate).
 *
 * Kebijakan: bukti foto boleh diambil di hari berbeda, selama masih dalam
 * pekan yang sama dengan pekan upload (contoh: foto Senin, upload Rabu).
 * Foto bertanggal masa depan (melebihi waktu upload + toleransi) ditolak.
 *
 * Perbandingan memakai kandidat tanggal UTC dan WIB untuk menoleransi
 * selisih zona waktu client (WIB) vs server (UTC).
 */
export interface InternshipProfileInfo {
  is_on_internship?: boolean | null;
  internship_start_date?: string | null;
  internship_end_date?: string | null;
}

/**
 * Menentukan apakah seorang anggota berstatus magang/PKL pada tanggal referensi tertentu (YYYY-MM-DD).
 * Jika is_on_internship = true:
 * - Apabila tidak ada tanggal mulai/selesai, anggota dianggap magang.
 * - Apabila ada tanggal referensi, dicek apakah tanggal tersebut berada dalam [start_date, end_date].
 */
export function isMemberOnInternship(
  profile: InternshipProfileInfo | null | undefined,
  referenceDateStr?: string | null,
): boolean {
  if (!profile || !profile.is_on_internship) return false;

  if (!profile.internship_start_date && !profile.internship_end_date) {
    return true;
  }

  if (referenceDateStr) {
    const startOk =
      !profile.internship_start_date ||
      profile.internship_start_date <= referenceDateStr;
    const endOk =
      !profile.internship_end_date ||
      profile.internship_end_date >= referenceDateStr;
    return startOk && endOk;
  }

  return true;
}

export function isDateInPiketWeek(
  target: Date,
  week: Pick<PiketWeekInfo, "startIsoDate" | "endIsoDate">,
  now: Date = new Date(),
): boolean {
  if (!(target instanceof Date) || Number.isNaN(target.getTime())) return false;

  // Tolak tanggal masa depan (melebihi waktu saat ini + toleransi skew).
  if (target.getTime() > now.getTime() + FUTURE_SKEW_MS) return false;

  const utcDate = target.toISOString().split("T")[0];
  const wibDate = new Date(target.getTime() + 7 * 3600 * 1000)
    .toISOString()
    .split("T")[0];

  return (
    (utcDate >= week.startIsoDate && utcDate <= week.endIsoDate) ||
    (wibDate >= week.startIsoDate && wibDate <= week.endIsoDate)
  );
}
