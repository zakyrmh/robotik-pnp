/**
 * Kriteria tunggal untuk menentukan apakah sebuah pendaftaran sedang
 * "menempati" (menahan) slot kuota kategori.
 *
 * PENTING: definisi ini HARUS identik dengan fungsi RPC di database —
 * lihat `supabase/migrations/20261004000000_enforce_quota_at_payment_and_1h_hold.sql`
 * (`register_team`, `reserve_slot_for_payment`). Bila salah satu diubah, ubah
 * keduanya agar angka kuota yang ditampilkan ke publik tidak berbeda dari aturan
 * yang benar-benar diterapkan saat pendaftaran/pembayaran.
 *
 * Aturan:
 * - `paid` dan `pending_verification` menahan slot secara permanen.
 * - `unpaid` dan `pending` menahan slot selama masa tahan (MASA_TUNGGU_SLOT_MS),
 *   memberi waktu bagi panitia memverifikasi pembayaran manual via transfer bank.
 *   Setelah masa tahan habis, slot dilepas DAN pendaftaran ditutup permanen
 *   (peserta harus mendaftar ulang) — lihat `isRegistrationExpired`.
 * - Status final-gagal (`rejected`, `expired`, `failed`) tidak menahan slot.
 *
 * Karena MRC X 2026 tidak memakai payment gateway, pembayaran sepenuhnya manual
 * via transfer bank sehingga `unpaid` tetap harus menahan slot sejak form
 * dikirim, agar pendaftar yang sudah mengisi formulir tidak kehilangan tempat.
 */
export const MASA_TUNGGU_SLOT_MS = 1 * 60 * 60 * 1000; // 1 jam

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

/**
 * Menentukan apakah masa tahan slot sebuah pendaftaran sudah kedaluwarsa.
 *
 * Hanya berlaku untuk status sementara (`unpaid`/`pending`). Bila true, slot
 * sudah dilepas DAN pendaftaran ditutup permanen: peserta tidak lagi boleh
 * mengunggah bukti bayar dan harus mendaftar ulang (bila kuota masih tersedia).
 *
 * Harus identik dengan pengecekan `hold_expired` di RPC `reserve_slot_for_payment`.
 *
 * @param reg Data pendaftaran (minimal status pembayaran dan waktu dibuat).
 * @param now Waktu acuan; dapat diisi untuk pengujian.
 */
export function isRegistrationExpired(
  reg: QuotaBearingRegistration,
  now: Date = new Date(),
): boolean {
  const status = reg.payment_status;
  if (!(STATUS_SEMENTARA as readonly string[]).includes(status)) return false;

  const createdAt = Date.parse(reg.created_at);
  if (Number.isNaN(createdAt)) return false; // data cacat: jangan anggap kedaluwarsa
  return createdAt <= now.getTime() - MASA_TUNGGU_SLOT_MS;
}

/**
 * Menghitung sisa waktu (milidetik) sampai masa tahan slot sebuah pendaftaran
 * habis. Bernilai 0 bila sudah kedaluwarsa atau bukan status sementara.
 *
 * Dipakai untuk countdown di halaman tiket pembayaran peserta.
 */
export function getRemainingHoldMs(
  reg: QuotaBearingRegistration,
  now: Date = new Date(),
): number {
  const status = reg.payment_status;
  if (!(STATUS_SEMENTARA as readonly string[]).includes(status)) return 0;

  const createdAt = Date.parse(reg.created_at);
  if (Number.isNaN(createdAt)) return 0;

  const remaining = createdAt + MASA_TUNGGU_SLOT_MS - now.getTime();
  return remaining > 0 ? remaining : 0;
}
