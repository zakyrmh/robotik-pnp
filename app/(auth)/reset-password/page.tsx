import type { Metadata } from "next";
import { ConfirmResetButton } from "@/components/features/auth/confirm-reset-button";

export const metadata: Metadata = {
  title: "Konfirmasi Reset Password | UKM Robotik PNP",
  description: "Konfirmasi permintaan reset password akun UKM Robotik PNP Anda",
};

/**
 * Halaman perantara (intermediary) untuk link pemulihan password.
 *
 * PENTING — Mengapa halaman ini ada:
 * Link di email TIDAK lagi mengarah langsung ke endpoint verifikasi token.
 * Ia mengarah ke halaman ini (GET biasa), yang hanya menampilkan tombol.
 *
 * Ini mencegah "email prefetching": klien email / scanner keamanan (mis.
 * Microsoft Defender Safe Links) yang otomatis membuka link tidak akan
 * mengonsumsi token sekali-pakai. Token (token_hash) baru ditukar menjadi
 * sesi HANYA ketika user asli menekan tombol — melalui Server Action
 * `confirmRecoveryAction`.
 *
 * Karena halaman ini tidak memverifikasi apa pun saat render, token tetap
 * valid berdasarkan waktu (TTL) dan dapat dibuka berkali-kali selama belum
 * kedaluwarsa.
 */
export default async function ResetPasswordConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
}) {
  const { token_hash, type, next } = await searchParams;

  const isValid = Boolean(token_hash) && type === "recovery";

  return (
    <ConfirmResetButton
      tokenHash={token_hash ?? ""}
      type="recovery"
      next={next ?? "/update-password"}
      isValid={isValid}
    />
  );
}
