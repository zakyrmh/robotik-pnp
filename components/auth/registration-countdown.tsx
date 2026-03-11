"use client";

/**
 * RegistrationCountdown — Tampilan hitung mundur pembukaan pendaftaran
 *
 * Ditampilkan di halaman /register ketika:
 * - is_open = true DAN waktu sekarang < start_date
 *
 * Fitur:
 * - Countdown real-time (update setiap detik) menggunakan setInterval
 * - Menampilkan hari, jam, menit, detik tersisa
 * - Menampilkan tanggal pembukaan dalam format lokal Indonesia
 * - Otomatis reload halaman ketika countdown habis
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, CalendarDays } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface RegistrationCountdownProps {
  /** Tanggal pembukaan pendaftaran dalam format ISO string */
  startDateISO: string;
}

/** Menghitung sisa waktu dari sekarang ke targetDate */
function getTimeLeft(targetDate: Date): TimeLeft | null {
  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

/** Memformat angka menjadi 2 digit (contoh: 7 → "07") */
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

const COUNTDOWN_UNITS = [
  { key: "days" as const, label: "Hari" },
  { key: "hours" as const, label: "Jam" },
  { key: "minutes" as const, label: "Menit" },
  { key: "seconds" as const, label: "Detik" },
];

export function RegistrationCountdown({
  startDateISO,
}: RegistrationCountdownProps) {
  const router = useRouter();
  const targetDate = new Date(startDateISO);

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    getTimeLeft(targetDate),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeLeft(targetDate);
      setTimeLeft(remaining);

      // Saat countdown habis, refresh halaman agar status terupdate
      if (!remaining) {
        clearInterval(timer);
        router.refresh();
      }
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDateISO]);

  /** Format tanggal pembukaan: "Jumat, 20 Maret 2026 pukul 08.00" */
  const formattedDate = targetDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = targetDate.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <Card className="border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader className="text-center">
        {/* Ikon */}
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-orange-500/10">
          <Clock className="size-8 text-orange-500" />
        </div>

        <CardTitle className="text-2xl font-bold">
          Pendaftaran Segera Dibuka
        </CardTitle>
        <CardDescription className="mt-1 flex items-center justify-center gap-1.5 text-sm">
          <CalendarDays className="size-3.5 shrink-0" />
          <span>
            {formattedDate} pukul {formattedTime}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {timeLeft ? (
          <>
            {/* Blok countdown */}
            <div className="grid grid-cols-4 gap-2">
              {COUNTDOWN_UNITS.map(({ key, label }) => (
                <div
                  key={key}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl border bg-muted/40 px-2 py-4"
                >
                  <span className="text-3xl font-bold tabular-nums leading-none tracking-tight">
                    {pad(timeLeft[key])}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Info tambahan */}
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-center text-xs text-orange-700 dark:text-orange-400">
              Halaman akan otomatis memperbarui saat pendaftaran dibuka.
            </div>
          </>
        ) : (
          /* Fallback ketika countdown baru saja habis tapi belum refresh */
          <div className="rounded-lg border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
            Pendaftaran sudah dibuka — memperbarui halaman...
          </div>
        )}
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Masuk di sini
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
