"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";

export function RejectedCard() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        <Card className="border border-border bg-card text-card-foreground text-center rounded-2xl shadow-xs relative overflow-hidden transition-colors duration-200">
          {/* Top Decorative Stripe */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-destructive" />

          <CardHeader className="pt-8 pb-3">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/20 shadow-xs">
              <HugeiconsIcon icon={Cancel01Icon} size={28} />
            </div>

            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-destructive block mb-1">
              STATUS: REJECTED
            </span>

            <CardTitle className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-foreground font-heading">
              Pendaftaran Ditolak
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 pb-8 px-5 sm:px-6">
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Mohon maaf, pendaftaran Anda sebagai Calon Anggota UKM Robotik PNP
              belum dapat disetujui pada periode ini.
            </p>

            <div className="flex items-center justify-center gap-3 font-medium text-destructive bg-destructive/10 p-3.5 rounded-xl border border-destructive/20 text-xs sm:text-sm">
              <HugeiconsIcon
                icon={InformationCircleIcon}
                size={18}
                className="shrink-0 text-destructive"
              />
              <span className="text-left">
                Silakan hubungi pengurus divisi untuk informasi lebih lanjut.
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <p>
            Ada pertanyaan?{" "}
            <a
              href="https://instagram.com/ukmrobotikpnp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium inline-block"
            >
              Hubungi Instagram Kami ↗
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
