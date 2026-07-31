"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon, RocketIcon } from "@hugeicons/core-free-icons";

export function VerifiedCard() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    // Redirect setelah 3 detik ke halaman login
    const timeout = setTimeout(() => {
      router.push("/login?message=Email+berhasil+diverifikasi.+Silakan+login.");
    }, 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="border border-border dark:border-white/10 bg-card text-card-foreground text-center rounded-xl shadow-sm dark:shadow-none transition-colors duration-200">
        <CardHeader className="pt-8 pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-wash dark:bg-pnp-orange/15 text-orange-deep dark:text-pnp-orange border border-pnp-orange/30 shadow-sm">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={32} />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-foreground font-display">
            EMAIL TERVERIFIKASI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pb-8 px-6">
          <p className="text-xs sm:text-sm text-muted-foreground font-sans font-normal leading-relaxed">
            Selamat, akun UKM Robotik PNP Anda telah aktif. Sistem sedang
            mengalihkan sesi Anda ke halaman login.
          </p>

          <div className="flex items-center justify-center gap-2.5 font-mono text-xs uppercase tracking-wider text-orange-deep dark:text-pnp-orange bg-orange-wash/60 dark:bg-pnp-orange/15 py-3 px-4 rounded-lg border border-pnp-orange/20">
            <HugeiconsIcon
              icon={RocketIcon}
              size={16}
              className="animate-pulse shrink-0"
            />
            Otomatis redirect dalam {countdown} detik...
          </div>
        </CardContent>
      </Card>

      <button
        onClick={() =>
          router.push(
            "/login?message=Email+berhasil+diverifikasi.+Silakan+login.",
          )
        }
        className="w-full text-micro font-mono uppercase tracking-widest text-muted-foreground hover:text-pnp-orange transition-colors cursor-pointer"
      >
        [ Lewati Redirect dan Login ]
      </button>
    </div>
  );
}
