"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";

interface DeletedCardProps {
  formattedDate: string;
  deleteReason: string | null;
}

export function DeletedCard({ formattedDate, deleteReason }: DeletedCardProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        <Card className="border border-border dark:border-white/10 bg-card text-card-foreground text-center rounded-xl shadow-sm dark:shadow-none relative overflow-hidden transition-colors duration-200">
          {/* PNP Accent Line at Top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-dongker-surface via-pnp-orange to-destructive" />

          <CardHeader className="pt-8 pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/30 shadow-sm">
              <HugeiconsIcon icon={Delete01Icon} size={32} />
            </div>

            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-destructive block mb-1">
              STATUS: DEACTIVATED
            </span>

            <CardTitle className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-foreground font-display">
              Pendaftaran Dihapus
            </CardTitle>

            <span className="text-micro font-mono text-muted-foreground uppercase mt-1 tracking-wider block">
              DIHAPUS PADA: {formattedDate} WIB
            </span>
          </CardHeader>

          <CardContent className="space-y-5 pb-8 px-5 sm:px-6">
            <p className="text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed">
              Maaf, data pendaftaran Anda sebagai Calon Anggota UKM Robotik Politeknik Negeri Padang telah dinonaktifkan dari sistem.
            </p>

            <div className="bg-muted/40 p-4 border border-border rounded-lg text-left space-y-2">
              <span className="text-micro font-mono font-semibold uppercase tracking-widest text-muted-foreground block">
                ALASAN PENONAKTIFAN:
              </span>
              <div className="flex items-start gap-3 bg-destructive/10 p-3 border border-destructive/20 rounded-md">
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  size={18}
                  className="text-destructive shrink-0 mt-0.5"
                />
                <span className="text-xs font-mono text-foreground leading-relaxed uppercase break-all font-medium">
                  {deleteReason || "TIDAK ADA ALASAN DIKIRIM OLEH PENGURUS"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center font-sans">
          <p className="text-xs text-muted-foreground">
            Ada pertanyaan atau ingin mengajukan banding?{" "}
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
