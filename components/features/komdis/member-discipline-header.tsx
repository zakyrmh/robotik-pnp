"use client";

import { useState } from "react";
import { GoroReductionDialog } from "./goro-reduction-dialog";
import { IssueSanctionDialog } from "./issue-sanction-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert01Icon,
  RecycleIcon,
  Audit01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

interface MemberDisciplineHeaderProps {
  profileId: string;
  fullName: string;
  nim: string;
  role: string;
  netPoints: number;
  activeSanctionLevel: number | null;
  isKomdisAdmin: boolean;
}

export function MemberDisciplineHeader({
  profileId,
  fullName,
  nim,
  role,
  netPoints,
  activeSanctionLevel,
  isKomdisAdmin,
}: MemberDisciplineHeaderProps) {
  const [isGoroOpen, setIsGoroOpen] = useState(false);
  const [isSpOpen, setIsSpOpen] = useState(false);

  let spStatusClass =
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  let spStatusText = "AMAN / TANPA SANKSI";

  if (activeSanctionLevel === 3 || netPoints >= 100) {
    spStatusClass =
      "bg-crimson-red/20 text-crimson-red border-crimson-red/50 animate-pulse";
    spStatusText = "SURAT PERINGATAN 3 (REKOMENDASI DO)";
  } else if (activeSanctionLevel === 2 || netPoints >= 50) {
    spStatusClass = "bg-orange-500/10 text-orange-400 border-orange-500/30";
    spStatusText = "SURAT PERINGATAN 2 (AKTIF)";
  } else if (activeSanctionLevel === 1 || netPoints >= 30) {
    spStatusClass = "bg-amber-500/10 text-amber-400 border-amber-500/30";
    spStatusText = "SURAT PERINGATAN 1 (AKTIF)";
  }

  return (
    <div className="space-y-4">
      {/* Active SP Warning Banner */}
      {activeSanctionLevel && activeSanctionLevel > 0 ? (
        <div className="bg-crimson-red/10 border-l-4 border-crimson-red p-4 flex items-center justify-between text-crimson-red font-mono text-xs uppercase tracking-wider">
          <div className="flex items-center gap-3">
            <HugeiconsIcon
              icon={Alert01Icon}
              size={24}
              className="animate-pulse"
            />
            <div>
              <div className="font-bold">
                STATUS PERINGATAN KEDISIPLINAN AKTIF!
              </div>
              <div className="text-[10px] text-gray-300 font-sans mt-0.5">
                {activeSanctionLevel === 1
                  ? "Anggota wajib melaksanakan sanksi Goro minimal 4x/bulan untuk pemutihan -10 Poin."
                  : activeSanctionLevel === 2
                    ? "Penahanan Baju PDH + Evaluasi Tim KRI + Goro minimal 6x/bulan."
                    : "Rekomendasi pemberhentian dari keanggotaan UKM Robotik PNP."}
              </div>
            </div>
          </div>
          <span className="px-3 py-1 bg-crimson-red text-white font-bold rounded-none">
            SP {activeSanctionLevel}
          </span>
        </div>
      ) : null}

      {/* Profile & Net Points Card */}
      <Card className="bg-surface-card-dark border-hairline-dark rounded-none p-6 shadow-none">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue flex items-center justify-center rounded-none font-mono text-xl font-bold">
              <HugeiconsIcon icon={UserIcon} size={32} />
            </div>
            <div>
              <span className="font-mono text-xs text-cyber-blue uppercase tracking-widest">
                NIM: {nim} &bull; ROLE: {role.toUpperCase()}
              </span>
              <h1 className="text-2xl font-bold uppercase text-white font-sans tracking-tight">
                {fullName}
              </h1>
              <span
                className={`inline-block mt-1 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider border ${spStatusClass}`}
              >
                {spStatusText}
              </span>
            </div>
          </div>

          {/* Net Points Display & Komdis Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
            <div className="bg-canvas-dark p-4 border border-hairline-dark text-center min-w-36 w-full sm:w-auto">
              <div className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                AKUMULASI POIN NETTO
              </div>
              <div className="font-mono text-3xl font-bold text-cyber-blue">
                {netPoints} <span className="text-xs text-gray-400">PTS</span>
              </div>
            </div>

            {isKomdisAdmin && (
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  onClick={() => setIsGoroOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs uppercase tracking-wider rounded-none cursor-pointer"
                >
                  <HugeiconsIcon
                    icon={RecycleIcon}
                    size={16}
                    className="mr-1.5"
                  />
                  [ + PEMUTIHAN GORO ]
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsSpOpen(true)}
                  className="bg-crimson-red hover:bg-crimson-red/90 text-white font-mono text-xs uppercase tracking-wider rounded-none cursor-pointer"
                >
                  <HugeiconsIcon
                    icon={Audit01Icon}
                    size={16}
                    className="mr-1.5"
                  />
                  [ + TERBITKAN SP ]
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Dialog Modals */}
      <GoroReductionDialog
        profileId={profileId}
        profileName={fullName}
        isOpen={isGoroOpen}
        onClose={() => setIsGoroOpen(false)}
      />

      <IssueSanctionDialog
        profileId={profileId}
        profileName={fullName}
        currentNetPoints={netPoints}
        isOpen={isSpOpen}
        onClose={() => setIsSpOpen(false)}
      />
    </div>
  );
}
