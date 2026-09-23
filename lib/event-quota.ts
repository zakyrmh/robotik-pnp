/**
 * Kriteria tunggal untuk menentukan apakah sebuah pendaftaran sedang
 * "menempati" (menahan) slot kuota kategori.
 *
 * PENTING: definisi ini HARUS identik dengan fungsi `register_team` di
 * database — lihat `supabase/migrations/20260923000000_fix_quota_manual_bank_and_extend_hold.sql`.
 * Bila salah satu diubah, ubah keduanya agar angka kuota yang ditampilkan ke
 * publik tidak berbeda dari aturan yang benar-benar diterapkan saat pendaftaran.
 *
 * Aturan:
 * - `paid` dan `pending_verification` menahan slot secara permanen.
 * - `unpaid` dan `pending` menahan slot selama masa tunggu (MASA_TUNGGU_SLOT_MS),
 *   memberi waktu bagi panitia memverifikasi pembayaran manual via transfer bank.
 * - Status final-gagal (`rejected`, `expired`, `failed`) tidak menahan slot.
 *
 * Karena MRC X 2026 tidak memakai payment gateway, pembayaran sepenuhnya manual
 * via transfer bank sehingga `unpaid` tetap harus menahan slot sejak form
 * dikirim, agar pendaftar yang sudah mengisi formulir tidak kehilangan tempat.
 */
export const MASA_TUNGGU_SLOT_MS = 5 * 60 * 60 * 1000; // 5 jam

/** Status yang menahan slot secara permanen. */
const STATUS_PERMANEN = ["paid", "pending_verification"] as const;

/** Status yang menahan slot hanya selama masa tunggu. */
const STATUS_SEMENTARA = ["unpaid", "pending"] as const;

export interface QuotaBearingRegistration {
  payment_status: string;
  created_at: string;
}

/**
 * Menentukan apakah satu pendaftaran sedang menahan slot kuota.
 *
 * @param reg Data pendaftaran (minimal status pembayaran dan waktu dibuat).
 * @param now Waktu acuan; dapat diisi untuk pengujian.
 */
export function isRegistrationHoldingSlot(
  reg: QuotaBearingRegistration,
  now: Date = new Date(),
): boolean {
  const status = reg.payment_status;
  if ((STATUS_PERMANEN as readonly string[]).includes(status)) return true;

  if ((STATUS_SEMENTARA as readonly string[]).includes(status)) {
    const createdAt = Date.parse(reg.created_at);
    if (Number.isNaN(createdAt)) return false; // data cacat: jangan menahan slot
    return createdAt > now.getTime() - MASA_TUNGGU_SLOT_MS;
  }

  return false;
}
