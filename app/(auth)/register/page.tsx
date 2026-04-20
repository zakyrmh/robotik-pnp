/**
 * Halaman Register — /register
 *
 * Server component yang mengecek status periode pendaftaran sebelum render.
 * Tiga kemungkinan tampilan:
 *
 * 1. OPEN     → Waktu sekarang berada di antara start_date dan end_date
 *               → Tampilkan form pendaftaran (RegisterForm)
 *
 * 2. COUNTDOWN → is_open = true, tetapi waktu sekarang < start_date
 *               → Tampilkan hitung mundur ke tanggal pembukaan (RegistrationCountdown)
 *
 * 3. CLOSED   → is_open = false, atau waktu sekarang > end_date,
 *               atau data tidak tersedia
 *               → Tampilkan pesan pendaftaran ditutup (RegistrationClosed)
 *
 * Catatan: Proteksi "user sudah login → redirect ke dashboard" ditangani
 * oleh proxy.ts (Next.js 16 Proxy) di root project.
 */

import { BentoAuthLayout } from "@/components/auth/bento-auth-layout";
import { RegisterForm } from "@/components/auth/register-form";
import { RegistrationClosed } from "@/components/auth/registration-closed";
import { RegistrationCountdown } from "@/components/auth/registration-countdown";
import { getPublicRegistrationPeriod } from "@/app/actions/or-settings.action";

/** Tipe status pendaftaran yang mungkin */
type RegistrationStatus =
  | { status: "open" }
  | { status: "countdown"; startDateISO: string }
  | { status: "closed" };

/** Menentukan status pendaftaran berdasarkan data dari database */
function resolveStatus(
  data: {
    is_open: boolean;
    start_date: string | null;
    end_date: string | null;
  } | null,
): RegistrationStatus {
  // Jika data tidak ada atau pendaftaran ditutup secara manual
  if (!data || !data.is_open) {
    return { status: "closed" };
  }

  // Jika is_open = true tapi tanggal tidak diisi → anggap ditutup
  if (!data.start_date || !data.end_date) {
    return { status: "closed" };
  }

  const now = new Date();
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);

  if (now >= start && now <= end) {
    // Sekarang berada di dalam rentang waktu pendaftaran
    return { status: "open" };
  }

  if (now < start) {
    // Pendaftaran belum dimulai → tampilkan countdown
    return { status: "countdown", startDateISO: data.start_date };
  }

  // now > end → pendaftaran sudah berakhir
  return { status: "closed" };
}

export default async function RegisterPage() {
  const { data } = await getPublicRegistrationPeriod();
  const resolved = resolveStatus(data);

  return (
    <BentoAuthLayout>
      {resolved.status === "open" && <RegistrationClosed />}

      {resolved.status === "countdown" && (
        <RegistrationCountdown startDateISO={resolved.startDateISO} />
      )}

      {resolved.status === "closed" && <RegisterForm />}
    </BentoAuthLayout>
  );
}
