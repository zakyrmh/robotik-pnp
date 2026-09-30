/**
 * Utilitas murni untuk ringkasan keuangan per rekening bank (tanpa React/DOM).
 *
 * Dipisah dari Server Action (`lib/actions/event-finance.ts`) dan komponen kartu
 * agar logika persentase, rekonsiliasi, dan pengurutan dapat diuji langsung
 * dengan Vitest — pola yang sama seperti `lib/mrc-analytics.ts` dan
 * `lib/event-quota.ts`.
 *
 * LATAR MASALAH YANG DITANGANI:
 * Penetapan rekening tujuan transfer bersifat MANUAL & OPSIONAL, sehingga
 * sebagian tim `paid` bisa belum punya `payment_bank_*`. RPC
 * `get_event_finance_summary_by_bank()` menyediakan baris agregat
 * "belum ditetapkan rekening" (`is_unassigned = true`) agar jumlah seluruh
 * rincian tetap sama dengan total pendapatan (`totalIncome`) — rekonsiliasi
 * 100%. Modul ini menjaga perhitungan persentase dan pengurutan tetap konsisten.
 */

/** Label baris agregat untuk pendapatan tanpa rekening tujuan. */
export const UNASSIGNED_BANK_LABEL = "Belum ditetapkan rekening";

/** Bentuk minimal satu baris rincian keuangan per rekening. */
export interface FinanceBreakdownRow {
  total_amount: number;
  is_unassigned: boolean;
  bank_name: string | null;
  account_number?: string | null;
}

/**
 * Persentase kontribusi satu rekening terhadap total pendapatan, dibulatkan.
 * Selalu mengembalikan angka 0–100 yang aman (tidak pernah `NaN`/`Infinity`),
 * termasuk saat total pendapatan masih 0.
 */
export function financePercentage(amount: number, total: number): number {
  if (!Number.isFinite(amount) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return Math.round((amount / total) * 100);
}

/** Jumlah total pendapatan dari seluruh baris rincian (untuk uji rekonsiliasi). */
export function sumFinanceTotal(
  rows: readonly { total_amount: number }[],
): number {
  return rows.reduce((sum, row) => sum + (row.total_amount || 0), 0);
}

/**
 * Urutkan baris: rekening nyata lebih dulu (abjad nama bank, locale `id`),
 * baris agregat "belum ditetapkan rekening" selalu paling akhir.
 * Tidak mengubah array input.
 */
export function sortFinanceRows<T extends FinanceBreakdownRow>(
  rows: readonly T[],
): T[] {
  return [...rows].sort((a, b) => {
    if (a.is_unassigned !== b.is_unassigned) return a.is_unassigned ? 1 : -1;
    const aName = a.bank_name ?? "";
    const bName = b.bank_name ?? "";
    return aName.localeCompare(bName, "id");
  });
}
