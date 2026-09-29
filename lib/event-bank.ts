import type { BankAccount, EventSettings } from "@/types/event-registration";

/**
 * Susun daftar rekening bank panitia dari `event_settings`.
 *
 * Prioritas:
 * 1. `bank_accounts` (JSONB array) bila terisi.
 * 2. Fallback ke tiga kolom tunggal (`bank_name` / `bank_account_number` /
 *    `bank_account_holder`) bila salah satunya terisi.
 * 3. Array kosong bila tidak ada konfigurasi.
 *
 * Dipakai bersama oleh formulir pembayaran (`qris-payment-view`) dan halaman
 * admin (penetapan rekening tujuan) agar sumber data konsisten. Tidak ada
 * nilai dummy — bila panitia belum mengonfigurasi rekening, kembalikan [].
 */
export function resolveBankAccounts(
  settings:
    | Pick<
        EventSettings,
        | "bank_accounts"
        | "bank_name"
        | "bank_account_number"
        | "bank_account_holder"
      >
    | null
    | undefined,
): BankAccount[] {
  if (!settings) return [];

  if (settings.bank_accounts && settings.bank_accounts.length > 0) {
    return settings.bank_accounts;
  }

  if (
    settings.bank_name ||
    settings.bank_account_number ||
    settings.bank_account_holder
  ) {
    return [
      {
        bank_name: settings.bank_name || "",
        account_number: settings.bank_account_number || "",
        account_holder: settings.bank_account_holder || "",
      },
    ];
  }

  return [];
}

/** Label ringkas satu rekening untuk dropdown/opsi pilihan. */
export function formatBankAccountLabel(account: BankAccount): string {
  const parts = [account.bank_name, account.account_number].filter(
    (p) => p && p.trim().length > 0,
  );
  const base = parts.join(" - ");
  return account.account_holder
    ? `${base} (a.n ${account.account_holder})`
    : base;
}
