"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon } from "@hugeicons/core-free-icons";

export function ForgotPasswordWaitingCard() {
  return (
    <Card className="rounded-lg text-center">
      <CardHeader className="gap-3">
        <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
          <HugeiconsIcon
            icon={Mail01Icon}
            size={32}
            className="animate-pulse"
          />
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle className="font-display text-lg sm:text-xl font-semibold tracking-tight">
            Cek Email Anda
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            Kami telah mengirimkan instruksi untuk mengatur ulang password ke
            email Anda.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2.5">
          {[
            "Buka aplikasi email di perangkat Anda",
            "Cari email pemulihan dari UKM Robotik PNP",
            "Klik tombol atau tautan yang tersedia",
          ].map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-3.5 rounded-lg border border-border bg-muted/40 p-3.5 sm:p-4 text-left"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <p className="text-sm text-foreground leading-snug">{step}</p>
            </div>
          ))}
        </div>

        <p className="rounded-lg bg-muted/40 p-3.5 sm:p-4 text-left text-sm text-muted-foreground leading-relaxed">
          Tidak menemukan email? Silakan periksa folder{" "}
          <strong className="font-semibold text-foreground">Spam</strong> atau
          kembali ke halaman lupa password.
        </p>
      </CardContent>

      <CardFooter className="justify-center px-5 sm:px-6">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline transition-colors"
        >
          Kembali ke Lupa Password
        </Link>
      </CardFooter>
    </Card>
  );
}
