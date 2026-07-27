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
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  let spStatusText = "AMAN / TANPA SANKSI";

  if (activeSpLevel === 3 || netPoints >= 100) {
    spStatusClass =
      "bg-crimson-red/20 text-crimson-red border-crimson-red/50 animate-pulse";
    spStatusText = "SURAT PERINGATAN 3 (REKOMENDASI DO)";
  } else if (activeSpLevel === 2 || netPoints >= 50) {
    spStatusClass = "bg-orange-500/10 text-orange-400 border-orange-500/30";
    spStatusText = "SURAT PERINGATAN 2 (AKTIF)";
  } else if (activeSpLevel === 1 || netPoints >= 30) {
    spStatusClass = "bg-amber-500/10 text-amber-400 border-amber-500/30";
    spStatusText = "SURAT PERINGATAN 1 (AKTIF)";
  }

  return (
    <Card className="bg-surface-card-dark border-hairline-dark rounded-none shadow-none">
      <CardHeader className="border-b border-hairline-dark pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 text-cyber-blue font-mono text-xs uppercase tracking-widest">
          <HugeiconsIcon icon={Audit01Icon} size={18} />
          <span>RINGKASAN KEDISIPLINAN ORGANISASI</span>
        </div>
        <span
          className={`px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider rounded-sm border ${spStatusClass}`}
        >
          {spStatusText}
        </span>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Warning Banner if SP active */}
        {activeSpLevel && activeSpLevel > 0 ? (
          <div className="bg-crimson-red/10 border-l-2 border-crimson-red p-3 flex items-center gap-3 text-crimson-red font-mono text-xs uppercase">
            <HugeiconsIcon
              icon={Alert01Icon}
              size={20}
              className="animate-pulse shrink-0"
            />
            <div>
              <div className="font-bold">
                PERINGATAN SANKSI KOMDIS AKTIF (SP {activeSpLevel})
              </div>
              <div className="text-[10px] text-gray-300 font-sans mt-0.5">
                {activeSpLevel === 1
                  ? "Sanksi Goro minimal 4x/bulan untuk pemutihan -10 Poin."
                  : activeSpLevel === 2
                    ? "Penahanan Baju PDH + Evaluasi Tim KRI + Goro 6x/bulan."
                    : "Rekomendasi pemberhentian dari keanggotaan UKM Robotik PNP."}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 flex items-center gap-3 text-emerald-400 font-mono text-xs">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} />
            <span>
              AKUMULASI POIN PELANGGARAN ANDA MASIH DI BATA AMAN (&lt;30 PTS)
            </span>
          </div>
        )}

        {/* Points Display */}
        <div className="flex items-center justify-between bg-canvas-dark p-4 border border-hairline-dark">
          <div>
            <div className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">
              TOTAL POIN NETTO SAAT INI ($P_{"{net}"}$)
            </div>
            <div className="font-mono text-3xl font-bold text-white mt-0.5">
              {netPoints} <span className="text-xs text-cyber-blue">POIN</span>
            </div>
          </div>

          <Link
            href="/kegiatan"
            className="bg-cyber-blue hover:bg-cyber-blue/90 text-white font-mono text-xs uppercase tracking-wider px-4 py-2 border border-cyber-blue/30 rounded-none transition-colors"
          >
            [ PRESENSI KEGIATAN ]
          </Link>
        </div>

        {/* Info SOP Link */}
        <div className="flex justify-between items-center font-mono text-[10px] text-gray-500 uppercase tracking-widest pt-1">
          <span>SOP KOMDIS PERIODE 2025/2026</span>
          <span className="text-gray-400">
            SP1 ≥30 PTS · SP2 ≥50 PTS · SP3 ≥100 PTS
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
