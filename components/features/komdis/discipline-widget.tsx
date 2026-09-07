"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Audit01Icon,
  Alert01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";

interface DisciplineWidgetProps {
  netPoints: number;
  activeSpLevel: number | null;
}

export function DisciplineWidget({
  netPoints,
  activeSpLevel,
}: DisciplineWidgetProps) {
  let spStatusClass =
    "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60";
  let spStatusText = "AMAN / TANPA SANKSI";

  if (activeSpLevel === 3 || netPoints >= 100) {
    spStatusClass =
      "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/60 animate-pulse";
    spStatusText = "SURAT PERINGATAN 3 (REKOMENDASI DO)";
  } else if (activeSpLevel === 2 || netPoints >= 50) {
    spStatusClass =
      "bg-orange-50 dark:bg-orange-950/60 text-[#c2410c] dark:text-orange-300 border-orange-200 dark:border-orange-900/60";
    spStatusText = "SURAT PERINGATAN 2 (AKTIF)";
  } else if (activeSpLevel === 1 || netPoints >= 30) {
    spStatusClass =
      "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60";
    spStatusText = "SURAT PERINGATAN 1 (AKTIF)";
  }

  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 text-[#1e3a8a] dark:text-blue-400 font-mono text-xs uppercase tracking-widest font-semibold">
          <HugeiconsIcon icon={Audit01Icon} size={18} />
          <span>RINGKASAN KEDISIPLINAN ORGANISASI</span>
        </div>
        <span
          className={`px-3 py-1 font-mono text-[10px] uppercase tracking-wider rounded-full border font-semibold ${spStatusClass}`}
        >
          {spStatusText}
        </span>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Warning Banner if SP active */}
        {activeSpLevel && activeSpLevel > 0 ? (
          <div className="bg-red-50 dark:bg-red-950/40 border-l-4 border-red-600 p-3 rounded-r-lg flex items-center gap-3 text-red-700 dark:text-red-300 font-mono text-xs uppercase">
            <HugeiconsIcon
              icon={Alert01Icon}
              size={20}
              className="animate-pulse shrink-0"
            />
            <div>
              <div className="font-bold">
                PERINGATAN SANKSI KOMDIS AKTIF (SP {activeSpLevel})
              </div>
              <div className="text-[10px] text-slate-600 dark:text-slate-300 font-sans mt-0.5">
                {activeSpLevel === 1
                  ? "Sanksi Goro minimal 4x/bulan untuk pemutihan -10 Poin."
                  : activeSpLevel === 2
                    ? "Penahanan Baju PDH + Evaluasi Tim KRI + Goro 6x/bulan."
                    : "Rekomendasi pemberhentian dari keanggotaan UKM Robotik PNP."}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-3 rounded-lg flex items-center gap-3 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-semibold">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} />
            <span>
              AKUMULASI POIN PELANGGARAN ANDA MASIH DI BATAS AMAN (&lt;30 PTS)
            </span>
          </div>
        )}

        {/* Points Display */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div>
            <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              TOTAL POIN NETTO SAAT INI (P_NET)
            </div>
            <div className="font-mono text-3xl font-bold text-[#0a192f] dark:text-slate-100 mt-0.5">
              {netPoints}{" "}
              <span className="text-xs text-[#1e3a8a] dark:text-blue-400">
                POIN
              </span>
            </div>
          </div>

          <Link
            href="/kegiatan"
            className="bg-[#1e3a8a] hover:bg-[#1e40af] dark:bg-blue-600 text-white font-mono text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors text-center shrink-0"
          >
            Presensi Kegiatan
          </Link>
        </div>

        {/* Info SOP Link */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 font-mono text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest pt-1">
          <span>SOP KOMDIS PERIODE 2025/2026</span>
          <span>
            SP1 &ge;30 PTS &middot; SP2 &ge;50 PTS &middot; SP3 &ge;100 PTS
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
