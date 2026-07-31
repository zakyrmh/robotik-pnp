"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";

export function RejectedCard() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        <Card className="border border-border dark:border-white/10 bg-card text-card-foreground text-center rounded-xl shadow-sm dark:shadow-none relative overflow-hidden transition-colors duration-200">
          {/* PNP Accent Line at Top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-dongker-surface via-pnp-orange to-destructive" />

          <CardHeader className="pt-8 pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/30 shadow-sm">
              <HugeiconsIcon icon={Cancel01Icon} size={32} />
            </div>

            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-destructive block mb-1">
              STATUS: REJECTED
            </span>

            <CardTitle className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-foreground font-display">
              Pendaftaran Ditolak
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5 pb-8 px-5 sm:px-6">
            <p className="text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed">
              Maaf, pendaftaran kamu sebagai Calon Anggota UKM Robotik PNP tidak dapat disetujui saat ini.
            </p>

            <div className="flex items-center justify-center gap-3 font-medium text-destructive bg-destructive/10 p-3.5 rounded-lg border border-destructive/20 text-xs sm:text-sm">
              <HugeiconsIcon
                icon={InformationCircleIcon}
                size={18}
                className="shrink-0 text-destructive"
              />
              <span className="text-left font-sans">
                Silakan hubungi pengurus untuk informasi lebih lanjut.
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="text-center font-sans">
          <p className="text-xs text-muted-foreground">
            Ada pertanyaan?{" "}
            <a
              href="https://instagram.com/ukmrobotikpnp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pnp-orange hover:underline font-mono text-micro font-semibold uppercase tracking-wider block sm:inline mt-1 sm:mt-0"
            >
              Hubungi Instagram Kami
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
