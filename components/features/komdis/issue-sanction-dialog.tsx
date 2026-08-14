"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { issueSanction } from "@/lib/actions/komdis";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, Loading01Icon } from "@hugeicons/core-free-icons";

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
  const router = useRouter();
  const [spLevel, setSpLevel] = useState<1 | 2 | 3>(
    currentNetPoints >= 100 ? 3 : currentNetPoints >= 50 ? 2 : 1,
  );
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setErrorMsg(null);
      setSuccessMsg(null);
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      try {
        await issueSanction({
          profileId,
          spLevel,
          pointsAtIssuance: currentNetPoints,
          notes: notes.trim() || undefined,
        });
        setSuccessMsg(`Surat Peringatan ${spLevel} berhasil diterbitkan.`);
        router.refresh();
        setTimeout(() => {
          onClose();
        }, 1000);
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Gagal menerbitkan Surat Peringatan",
        );
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <HugeiconsIcon icon={Alert01Icon} size={20} />
            <DialogTitle className="font-display text-lg font-bold text-[#0a192f] dark:text-slate-100">
              Penerbitan Surat Peringatan (SP)
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Terbitkan Surat Peringatan resmi kedisiplinan untuk anggota{" "}
            <span className="font-bold text-[#0a192f] dark:text-slate-200">
              {profileName}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-mono text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-mono text-xs rounded-lg">
              {successMsg}
            </div>
          )}

          {/* SP Level Select */}
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0a192f] dark:text-slate-100">
              Tingkat Surat Peringatan (SP)
            </Label>
            <select
              value={spLevel}
              onChange={(e) => setSpLevel(Number(e.target.value) as 1 | 2 | 3)}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-xs text-[#0a192f] dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316]"
            >
              <option value={1}>SP 1 (AKUMULASI POIN ≥ 30 PTS)</option>
              <option value={2}>SP 2 (AKUMULASI POIN ≥ 50 PTS)</option>
              <option value={3}>
                SP 3 / REKOMENDASI DO (AKUMULASI POIN ≥ 100 PTS)
              </option>
            </select>
          </div>

          {/* Telemetry Summary Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1 font-mono text-xs">
            <div className="text-slate-600 dark:text-slate-300">
              POIN NETTO SAAT INI:{" "}
              <span className="font-bold text-[#0a192f] dark:text-slate-100">
                {currentNetPoints} PTS
              </span>
            </div>
            <div className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
              SANKSI:{" "}
              {spLevel === 1
                ? "Goro minimal 4x/bulan & Pemutihan -10 Poin."
                : spLevel === 2
                  ? "Penahanan Baju PDH + Evaluasi Tim KRI + Goro 6x/bulan."
                  : "Rekomendasi Pemberhentian / Dikeluarkan dari UKM Robotik PNP."}
            </div>
          </div>

          {/* Notes Textarea */}
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0a192f] dark:text-slate-100">
              Catatan / Alasan Penerbitan SP
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Terbit SP1 karena mencapai akumulasi 32 poin sanksi presensi..."
              className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 font-mono text-xs text-[#0a192f] dark:text-slate-100 placeholder:text-slate-400 min-h-24 rounded-lg"
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="font-mono text-xs uppercase h-9 rounded-lg border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs uppercase h-9 rounded-lg"
            >
              {isPending ? (
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon
                    icon={Loading01Icon}
                    className="animate-spin"
                    size={14}
                  />
                  Menyimpan...
                </span>
              ) : (
                "Terbit SP"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
