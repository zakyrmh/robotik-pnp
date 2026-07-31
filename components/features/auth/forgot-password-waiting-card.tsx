"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon } from "@hugeicons/core-free-icons";

export function ForgotPasswordWaitingCard() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="border border-border dark:border-white/10 bg-card text-card-foreground text-center rounded-xl shadow-sm dark:shadow-none transition-colors duration-200">
        <CardHeader className="pt-8 pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-wash dark:bg-pnp-orange/15 text-orange-deep dark:text-pnp-orange border border-pnp-orange/30 shadow-sm">
            <HugeiconsIcon
              icon={Mail01Icon}
              size={32}
              className="animate-pulse"
            />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-foreground font-display">
            CEK EMAIL ANDA
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground font-sans font-normal leading-relaxed mt-1">
            Kami telah mengirimkan instruksi untuk mengatur ulang password ke email Anda.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pb-8 px-5 sm:px-6">
          <div className="space-y-2.5">
            {[
              "Buka aplikasi email di perangkat Anda",
              "Cari email pemulihan dari UKM Robotik PNP",
              "Klik tombol atau tautan yang tersedia",
            ].map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-3.5 border border-border bg-muted/40 p-3.5 sm:p-4 text-left hover:bg-muted/70 transition-colors rounded-lg"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-dongker-surface dark:bg-pnp-orange text-white font-mono text-xs font-bold rounded-full">
                  {i + 1}
                </span>
                <p className="text-xs sm:text-sm text-foreground font-sans font-normal leading-snug">
                  {step}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-pnp-orange/20 bg-orange-wash/40 dark:bg-pnp-orange/10 p-3.5 sm:p-4 text-xs font-sans text-muted-foreground text-left leading-relaxed">
            <p>
              Tidak menemukan email? Silakan periksa folder{" "}
              <strong className="text-foreground font-semibold">Spam</strong>{" "}
              atau kembali ke halaman lupa password.
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="text-center">
        <Link
          href="/forgot-password"
          className="font-mono text-micro uppercase tracking-wider text-pnp-orange hover:text-orange-deep dark:hover:text-orange-300 hover:underline transition-colors font-medium"
        >
          [ Kembali ke Lupa Password ]
        </Link>
      </p>
    </div>
  );
}
