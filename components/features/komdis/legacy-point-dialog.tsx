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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { logLegacyDisciplinePoints } from "@/lib/actions/komdis";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, Loading01Icon } from "@hugeicons/core-free-icons";

interface LegacyPointDialogProps {
  profileId: string;
  profileName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function LegacyPointDialog({
  profileId,
  profileName,
  isOpen,
  onClose,
}: LegacyPointDialogProps) {
  const router = useRouter();
  const [category, setCategory] = useState<
    "poin_awal_periode20" | "transfer_periode" | "penyesuaian_komdis"
  >("poin_awal_periode20");
  const [points, setPoints] = useState<number>(15);
  const [description, setDescription] = useState("");
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

    if (points <= 0) {
      setErrorMsg("Poin sanksi awal harus bernilai positif (contoh: 15).");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Deskripsi catatan poin sanksi awal wajib diisi.");
      return;
    }

    startTransition(async () => {
      try {
        await logLegacyDisciplinePoints({
          profileId,
          category,
          points,
          description: description.trim(),
        });
        setSuccessMsg("Poin sanksi awal / transfer berhasil dicatat.");
        router.refresh();
        setTimeout(() => {
          onClose();
        }, 1000);
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Gagal mencatat poin sanksi awal",
        );
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <HugeiconsIcon icon={Alert01Icon} size={20} />
            <DialogTitle className="font-display text-lg font-bold text-[#0a192f] dark:text-slate-100">
              Input Poin Sanksi Awal / Transfer Periode
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Catat akumulasi poin sanksi pelanggaran periode terdahulu (seperti Periode 20) untuk anggota{" "}
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

          {/* Category Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0a192f] dark:text-slate-100">
              Kategori Transfer / Poin Awal
            </Label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value as
                    | "poin_awal_periode20"
                    | "transfer_periode"
                    | "penyesuaian_komdis",
                )
              }
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-xs text-[#0a192f] dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316]"
            >
              <option value="poin_awal_periode20">
                POIN AWAL PERIODE 20 (CARRY OVER)
              </option>
              <option value="transfer_periode">
                TRANSFER POIN ANTAR MASAJABATAN
              </option>
              <option value="penyesuaian_komdis">
                PENYESUAIAN KHUSUS KOMDIS (+POIN)
              </option>
            </select>
          </div>

          {/* Points Input */}
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0a192f] dark:text-slate-100">
              Nilai Poin Pelanggaran (Positif)
            </Label>
            <Input
              type="number"
              min={1}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-amber-600 dark:text-amber-400"
            />
          </div>

          {/* Description Textarea */}
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0a192f] dark:text-slate-100">
              Deskripsi / Catatan Poin Awal
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Akumulasi poin pelanggaran pada masa jabatan Periode 20 sebelum penerapan sistem digital..."
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
              className="bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs uppercase h-9 rounded-lg"
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
                "Simpan Poin Awal"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
