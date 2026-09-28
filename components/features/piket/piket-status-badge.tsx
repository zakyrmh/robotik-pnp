"use client";

import { Badge } from "@/components/ui/badge";
import type { PiketLogStatus } from "./types";
import type { PiketComplianceStatus } from "@/lib/repositories/piket";

export function PiketLogStatusBadge({ status }: { status: PiketLogStatus }) {
  switch (status) {
    case "approved":
      return (
        <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 text-[10px] rounded-full">
          TERVERIFIKASI
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 text-[10px] rounded-full">
          MENUNGGU REVIEW
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 text-[10px] rounded-full">
          DITOLAK
        </Badge>
      );
    case "auto_final":
      return (
        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] rounded-full">
          FINAL OTOMATIS
        </Badge>
      );
  }
}

export function PiketComplianceBadge({
  status,
}: {
  status: PiketComplianceStatus;
}) {
  const map: Record<
    PiketComplianceStatus,
    { label: string; className: string }
  > = {
    "sudah-lapor": {
      label: "SUDAH LAPOR",
      className:
        "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60",
    },
    alpha: {
      label: "ALPHA",
      className:
        "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60",
    },
    berlangsung: {
      label: "BERLANGSUNG",
      className:
        "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60",
    },
    magang: {
      label: "MAGANG",
      className:
        "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
    },
  };
  const cfg = map[status];
  return (
    <Badge className={`${cfg.className} text-[10px] rounded-full`}>
      {cfg.label}
    </Badge>
  );
}
