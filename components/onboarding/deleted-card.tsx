"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";

interface DeletedCardProps {
  formattedDate: string;
  deleteReason: string | null;
}

export function DeletedCard({ formattedDate, deleteReason }: DeletedCardProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        <Card className="border border-border bg-card text-card-foreground text-center rounded-2xl shadow-xs relative overflow-hidden transition-colors duration-200">
          {/* Top Decorative Stripe */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-destructive" />

          <CardHeader className="pt-8 pb-3">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/20 shadow-xs">
              <HugeiconsIcon icon={Delete01Icon} size={28} />
            </div>

            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-destructive block mb-1">
              STATUS: DEACTIVATED
            </span>

            <CardTitle className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-foreground font-heading">
              Pendaftaran Dinonaktifkan
            </CardTitle>

            <span className="text-[11px] font-mono text-muted-foreground uppercase mt-1 tracking-wider block">
              WAKTU: {formattedDate} WIB
            </span>
          </CardHeader>

          <CardContent className="space-y-4 pb-8 px-5 sm:px-6">
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Data pendaftaran Anda sebagai Calon Anggota UKM Robotik Politeknik
              Negeri Padang telah dinonaktifkan dari sistem.
            </p>

            <div className="bg-secondary p-4 border border-border rounded-xl text-left space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
                ALASAN PENONAKTIFAN:
              </span>
              <div className="flex items-start gap-2.5 bg-destructive/10 p-3 border border-destructive/20 rounded-lg">
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  size={16}
                  className="text-destructive shrink-0 mt-0.5"
                />
                <span className="text-xs font-mono text-foreground leading-relaxed uppercase break-all font-semibold">
                  {deleteReason || "TIDAK ADA ALASAN DILAMPIRKAN"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <p>
            Ada pertanyaan atau ingin konfirmasi?{" "}
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
