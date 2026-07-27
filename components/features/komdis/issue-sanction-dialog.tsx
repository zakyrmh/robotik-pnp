"use client";

import { useState, useTransition } from "react";
import { issueSanction } from "@/lib/actions/komdis";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, Alert01Icon } from "@hugeicons/core-free-icons";

interface IssueSanctionDialogProps {
  profileId: string;
  profileName: string;
  currentNetPoints: number;
  isOpen: boolean;
  onClose: () => void;
}

export function IssueSanctionDialog({
  profileId,
  profileName,
  currentNetPoints,
  isOpen,
  onClose,
}: IssueSanctionDialogProps) {
  const [spLevel, setSpLevel] = useState<1 | 2 | 3>(
    currentNetPoints >= 100 ? 3 : currentNetPoints >= 50 ? 2 : 1,
  );
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await issueSanction({
          profileId,
          spLevel,
          pointsAtIssuance: currentNetPoints,
          notes: notes.trim() || undefined,
        });
        onClose();
      } catch (err: unknown) {
        alert(
          err instanceof Error
            ? err.message
            : "Gagal menerbitkan Surat Peringatan",
        );
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-surface-card-dark border border-hairline-dark p-6 max-w-md w-full space-y-4">
        <div className="border-b border-hairline-dark pb-3 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-crimson-red uppercase tracking-widest">
              <HugeiconsIcon icon={Alert01Icon} size={16} />
              <span>PENERBITAN SURAT PERINGATAN (SP)</span>
            </div>
            <h3 className="text-lg font-bold text-white uppercase font-sans mt-0.5">
              {profileName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white font-mono text-xs cursor-pointer"
          >
            [ TUTUP X ]
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">
              TINGKAT SURAT PERINGATAN (SP):
            </label>
            <select
              value={spLevel}
              onChange={(e) => setSpLevel(Number(e.target.value) as 1 | 2 | 3)}
              className="w-full bg-canvas-dark border border-hairline-dark p-2.5 text-xs font-mono text-white focus:outline-hidden focus:border-cyber-blue rounded-none"
            >
              <option value={1}>SP 1 (AKUMULASI POIN ≥ 30 PTS)</option>
              <option value={2}>SP 2 (AKUMULASI POIN ≥ 50 PTS)</option>
              <option value={3}>
                SP 3 / REKOMENDASI DO (AKUMULASI POIN ≥ 100 PTS)
              </option>
            </select>
          </div>

          <div className="bg-canvas-dark/60 p-3 border border-hairline-dark font-mono text-xs text-gray-300 space-y-1">
            <div>
              POIN NETTO SAAT INI:{" "}
              <span className="text-white font-bold">
                {currentNetPoints} PTS
              </span>
            </div>
            <div className="text-[10px] text-amber-400">
              SANKSI:{" "}
              {spLevel === 1
                ? "Goro minimal 4x/bulan & Pemutihan -10 Poin."
                : spLevel === 2
                  ? "Penahanan Baju PDH + Evaluasi Tim KRI + Goro 6x/bulan."
                  : "Rekomendasi Pemberhentian / Dikeluarkan dari UKM Robotik PNP."}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">
              CATATAN / ALASAN PENERBITAN SP:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Terbit SP1 karena mencapai akumulasi 32 poin sanksi presensi..."
              className="w-full bg-canvas-dark border border-hairline-dark p-3 text-xs font-sans text-white placeholder-gray-500 focus:outline-hidden focus:border-cyber-blue rounded-none h-24"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-hairline-dark">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-canvas-dark border-hairline-dark text-gray-400 font-mono text-xs rounded-none cursor-pointer"
            >
              BATAL
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-crimson-red hover:bg-crimson-red/90 text-white font-mono text-xs uppercase tracking-wider rounded-none cursor-pointer"
            >
              {isPending ? (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  size={16}
                  className="animate-spin"
                />
              ) : (
                "TERBITKAN SP"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
