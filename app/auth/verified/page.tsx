"use client";

/**
 * Halaman Verifikasi Email Berhasil — /auth/verified
 *
 * Ditampilkan setelah user mengklik link verifikasi email dan
 * route handler /auth/callback berhasil menukar code dengan session.
 *
 * Fitur:
 * - Ikon sukses animasi
 * - Instruksi langkah selanjutnya
 * - Progress bar hitung mundur 5 detik
 * - Auto-redirect ke /login saat countdown habis
 * - Tombol "Lanjutkan Sekarang" untuk redirect manual
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  ArrowRight,
  Mail,
  LogIn,
  UserCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const COUNTDOWN_SECONDS = 5;

const STEPS = [
  {
    icon: LogIn,
    title: "Masuk ke Akun",
    description: "Gunakan email dan password yang telah Anda daftarkan.",
  },
  {
    icon: UserCircle,
    title: "Lengkapi Profil",
    description: "Isi data diri Anda agar pengurus dapat mengenal Anda.",
  },
  {
    icon: Mail,
    title: "Ikuti Proses Selanjutnya",
    description: "Pantau email dan dashboard untuk instruksi Open Recruitment.",
  },
] as const;

export default function EmailVerifiedPage() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (seconds <= 0) {
      router.push("/login");
      return;
    }

    const timer = setTimeout(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [seconds, router]);

  const progress = (seconds / COUNTDOWN_SECONDS) * 100;

  return (
    <div className="flex min-h-svh w-full">
      {/* ── Panel Kiri (sama dengan BentoAuthLayout) ── */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-8 text-primary-foreground lg:flex xl:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="Logo UKM Robotik PNP"
            width={44}
            height={44}
            className="rounded-full bg-white/10 p-0.5"
            priority
          />
          <div>
            <p className="text-sm font-bold leading-tight">UKM Robotik</p>
            <p className="text-xs opacity-70">Politeknik Negeri Padang</p>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center gap-4 py-8">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-white/10">
            <CheckCircle2 className="size-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold leading-tight xl:text-4xl">
            Verifikasi
            <br />
            <span className="text-primary-foreground/80">Berhasil!</span>
          </h1>
          <p className="max-w-sm text-sm leading-relaxed opacity-70">
            Akun Anda di Sistem Informasi UKM Robotik PNP telah aktif. Selamat
            bergabung dan ikuti proses Open Recruitment selanjutnya.
          </p>
        </div>

        <p className="relative z-10 text-xs opacity-50">
          © {new Date().getFullYear()} UKM Robotik — Politeknik Negeri Padang
        </p>
      </aside>

      {/* ── Panel Kanan — Konten Utama ── */}
      <main className="flex w-full flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 lg:w-1/2">
        {/* Logo mobile */}
        <div className="mb-6 flex flex-col items-center gap-2 lg:hidden">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="Logo UKM Robotik PNP"
              width={56}
              height={56}
              className="rounded-full"
              priority
            />
            <div>
              <p className="text-sm font-bold leading-tight">UKM Robotik</p>
              <p className="text-xs text-muted-foreground">
                Politeknik Negeri Padang
              </p>
            </div>
          </Link>
        </div>

        <div className="w-full max-w-md space-y-4">
          {/* Card sukses utama */}
          <Card className="border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader className="text-center pb-4">
              {/* Ikon sukses */}
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 animate-in zoom-in-75 duration-500">
                <CheckCircle2 className="size-9 text-emerald-500" />
              </div>

              <CardTitle className="text-2xl font-bold">
                Email Berhasil Diverifikasi!
              </CardTitle>
              <CardDescription className="mt-1">
                Akun Anda telah aktif dan siap digunakan. Silakan masuk untuk
                melanjutkan ke sistem.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Langkah selanjutnya */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Langkah Selanjutnya
                </p>
                <div className="space-y-2">
                  {STEPS.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-lg border bg-muted/30 px-3 py-2.5"
                    >
                      <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <step.icon className="size-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold leading-snug">
                          {step.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress bar countdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Mengalihkan ke halaman login...</span>
                  <span className="tabular-nums font-medium">{seconds}s</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button asChild className="w-full cursor-pointer" size="lg">
                <Link href="/login">
                  Lanjutkan Sekarang
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Footer mobile */}
        <p className="mt-8 text-center text-xs text-muted-foreground lg:hidden">
          © {new Date().getFullYear()} UKM Robotik — Politeknik Negeri Padang
        </p>
      </main>
    </div>
  );
}
