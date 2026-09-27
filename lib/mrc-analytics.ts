/**
 * Analitik tren pendaftaran MRC — fungsi murni (tanpa React/DOM).
 *
 * Dipisah dari komponen chart agar logika bucketing tanggal dapat diuji
 * langsung dengan Vitest, dan agar komponen hanya bertanggung jawab merender.
 *
 * Semua pengelompokan harian memakai zona waktu **WIB (UTC+7)** sesuai
 * kebutuhan panitia di Indonesia. `created_at` dari database tersimpan UTC,
 * sehingga pendaftaran pukul 00:00–06:59 WIB harus masuk ke tanggal WIB yang
 * benar (bukan tanggal UTC sebelumnya).
 */

import type { EventRegistration } from "@/types/event-registration";

/** Offset WIB terhadap UTC dalam menit (UTC+7). */
const WIB_OFFSET_MINUTES = 7 * 60;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Rentang waktu yang dapat dipilih admin pada grafik tren. */
export type TrendRange = "7d" | "30d" | "all";

/** Metrik yang digambarkan pada garis utama grafik. */
export type TrendMetric = "total" | "paid";

/** Mode tampilan seri grafik. */
export type TrendMode = "single" | "batch" | "category";

/** Subset registrasi yang dibutuhkan analitik (prop-tolerant). */
export type TrendRegistration = Pick<
  EventRegistration,
  | "created_at"
  | "payment_status"
  | "category_id"
  | "registration_batch"
  | "category"
>;

/** Satu titik bucket harian. */
export interface DayBucket {
  /** Kunci tanggal WIB `YYYY-MM-DD`. */
  date: string;
  /** Label singkat untuk sumbu X (mis. `16 Sep`). */
  label: string;
  /** Total tim yang mendaftar pada tanggal ini (semua status). */
  total: number;
  /** Tim dengan pembayaran `paid`. */
  paid: number;
  /** Tim yang mendaftar pada Batch 1. */
  batch1: number;
  /** Tim yang mendaftar pada Batch 2. */
  batch2: number;
  /** Jumlah per kategori: `{ [categoryId]: count }`. */
  byCategory: Record<string, number>;
}

/** Ringkasan cepat untuk kartu metrik di atas grafik. */
export interface TrendSummary {
  total: number;
  /** Rata-rata pendaftar per hari (dibulatkan 1 desimal). */
  avgPerDay: number;
  /** Hari dengan pendaftar terbanyak (null bila tidak ada data). */
  peak: { date: string; label: string; count: number } | null;
}

const MONTHS_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

/**
 * Menggeser timestamp UTC ke "dinding jam" WIB tanpa bergantung pada zona
 * waktu proses server. Mengembalikan objek `Date` yang komponen tanggalnya
 * (getUTCFullYear/Month/Date) merepresentasikan tanggal WIB.
 */
function toWibWallClock(iso: string): Date | null {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed + WIB_OFFSET_MINUTES * 60 * 1000);
}

/**
 * Konversi `created_at` UTC menjadi kunci tanggal WIB `YYYY-MM-DD`.
 * Mengembalikan `null` bila nilai tanggal tidak valid (baris dilewati).
 */
export function toWibDateKey(iso: string): string | null {
  const wib = toWibWallClock(iso);
  if (!wib) return null;
  const y = wib.getUTCFullYear();
  const m = String(wib.getUTCMonth() + 1).padStart(2, "0");
  const d = String(wib.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Label singkat `DD Mmm` untuk sumbu X dari kunci tanggal WIB. */
export function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  return `${d} ${MONTHS_ID[m - 1]}`;
}

/**
 * Daftar SEMUA tanggal (inklusif) antara `fromKey` dan `toKey`.
 * Dipakai agar hari tanpa pendaftaran tetap tampil dengan nilai 0 (garis
 * kontinu) sesuai kebutuhan pembacaan tren.
 */
export function buildDateRange(fromKey: string, toKey: string): string[] {
  const from = Date.parse(`${fromKey}T00:00:00Z`);
  const to = Date.parse(`${toKey}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) return [];

  const keys: string[] = [];
  for (let t = from; t <= to; t += MS_PER_DAY) {
    const d = new Date(t);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    keys.push(`${y}-${m}-${day}`);
  }
  return keys;
}

/**
 * Menentukan tanggal acuan "sekarang" dalam kunci WIB. Bila `nowWib` (ISO UTC)
 * diberikan, ia dikonversi; jika tidak, memakai waktu sistem saat ini.
 */
export function todayWibKey(nowWib?: string): string {
  const source = nowWib ?? new Date().toISOString();
  return toWibDateKey(source) ?? new Date().toISOString().slice(0, 10);
}

/**
 * Memfilter registrasi sesuai rentang pilihan. Rentang relatif ("7d"/"30d")
 * dihitung mundur dari `todayKey` (WIB), "all" mengembalikan seluruh baris.
 */
export function filterByRange(
  registrations: TrendRegistration[],
  range: TrendRange,
  todayKey: string,
): TrendRegistration[] {
  if (range === "all") return registrations;

  const days = range === "7d" ? 7 : 30;
  const today = Date.parse(`${todayKey}T00:00:00Z`);
  const cutoff = today - (days - 1) * MS_PER_DAY;

  return registrations.filter((reg) => {
    const key = toWibDateKey(reg.created_at);
    if (!key) return false;
    const t = Date.parse(`${key}T00:00:00Z`);
    return t >= cutoff && t <= today;
  });
}

/**
 * Mengelompokkan registrasi menjadi bucket harian berurutan.
 *
 * Rentang tanggal dibangun dari data yang sudah difilter: `fromKey` = tanggal
 * paling awal, `toKey` = `todayKey`. Bila tidak ada data, mengembalikan array
 * kosong. Hari tanpa pendaftaran tetap diisi 0.
 */
export function bucketByDay(
  registrations: TrendRegistration[],
  todayKey: string,
): DayBucket[] {
  const keysInData = registrations
    .map((reg) => toWibDateKey(reg.created_at))
    .filter((key): key is string => key !== null);

  if (keysInData.length === 0) return [];

  const sorted = [...keysInData].sort();
  const fromKey = sorted[0];
  const toKey =
    sorted[sorted.length - 1] > todayKey ? sorted[sorted.length - 1] : todayKey;
  const rangeKeys = buildDateRange(fromKey, toKey);

  const buckets = new Map<string, DayBucket>();
  for (const key of rangeKeys) {
    buckets.set(key, {
      date: key,
      label: formatDateLabel(key),
      total: 0,
      paid: 0,
      batch1: 0,
      batch2: 0,
      byCategory: {},
    });
  }

  for (const reg of registrations) {
    const key = toWibDateKey(reg.created_at);
    if (!key) continue;
    const bucket = buckets.get(key);
    if (!bucket) continue;

    bucket.total += 1;
    if (reg.payment_status === "paid") bucket.paid += 1;
    if (reg.registration_batch === "batch1") bucket.batch1 += 1;
    else if (reg.registration_batch === "batch2") bucket.batch2 += 1;

    const catId = reg.category_id;
    if (catId) {
      bucket.byCategory[catId] = (bucket.byCategory[catId] ?? 0) + 1;
    }
  }

  return rangeKeys.map((key) => buckets.get(key)!);
}

/** Menghitung ringkasan cepat (total, rata-rata harian, hari puncak). */
export function summarize(buckets: DayBucket[]): TrendSummary {
  if (buckets.length === 0) {
    return { total: 0, avgPerDay: 0, peak: null };
  }

  let total = 0;
  let peak: DayBucket | null = null;
  for (const bucket of buckets) {
    total += bucket.total;
    if (bucket.total > 0 && (peak === null || bucket.total > peak.total)) {
      peak = bucket;
    }
  }

  return {
    total,
    avgPerDay: Math.round((total / buckets.length) * 10) / 10,
    peak: peak
      ? { date: peak.date, label: peak.label, count: peak.total }
      : null,
  };
}

/** Palet warna seri kategori (fallback bila token CSS tidak terbaca). */
export const CATEGORY_PALETTE_FALLBACK = [
  "#3b5b84",
  "#f0975a",
  "#7c9cbf",
  "#64748b",
  "#f4b183",
  "#94a3b8",
  "#5b7fa6",
  "#9a5b30",
] as const;

/** Warna deterministik per kategori berdasarkan indeks daftar kategori. */
export function categoryColor(index: number, resolved: string[]): string {
  if (resolved.length > 0) return resolved[index % resolved.length];
  return CATEGORY_PALETTE_FALLBACK[index % CATEGORY_PALETTE_FALLBACK.length];
}
