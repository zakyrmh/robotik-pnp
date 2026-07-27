"use client";

import { useState, useTransition } from "react";
import { logPointReduction } from "@/lib/actions/komdis";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, RecycleIcon } from "@hugeicons/core-free-icons";

interface GoroReductionDialogProps {
  profileId: string;
  profileName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function GoroReductionDialog({
  profileId,
  profileName,
  isOpen,
  onClose,
}: GoroReductionDialogProps) {
  const [category, setCategory] = useState<
    "goro_sp1" | "goro_sp2" | "penyesuaian_komdis"
  >("goro_sp1");
  const [points, setPoints] = useState<number>(-10);
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleCategoryChange = (
    cat: "goro_sp1" | "goro_sp2" | "penyesuaian_komdis",
  ) => {
    setCategory(cat);
    if (cat === "goro_sp1") setPoints(-10);
    else if (cat === "goro_sp2") setPoints(-15);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (points >= 0) {
      alert("Poin pemutihan harus bernilai negatif (contoh: -10 atau -15).");
      return;
    }
    if (!description.trim()) {
      alert("Deskripsi pemutihan wajib diisi.");
      return;
    }

    startTransition(async () => {
      try {
        await logPointReduction({
          profileId,
          category,
          points,
          description,
        });
        onClose();
      } catch (err: unknown) {
        alert(
          err instanceof Error ? err.message : "Gagal mencatat pemutihan poin",
        );
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-surface-card-dark border border-hairline-dark p-6 max-w-md w-full space-y-4">
        <div className="border-b border-hairline-dark pb-3 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 uppercase tracking-widest">
              <HugeiconsIcon icon={RecycleIcon} size={16} />
              <span>PEMUTIHAN POIN SANKSI GORO</span>
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
              KATEGORI PEMUTIHAN SANKSI:
            </label>
            <select
              value={category}
              onChange={(e) =>
                handleCategoryChange(
                  e.target.value as
                    | "goro_sp1"
                    | "goro_sp2"
                    | "penyesuaian_komdis",
                )
              }
              className="w-full bg-canvas-dark border border-hairline-dark p-2.5 text-xs font-mono text-white focus:outline-hidden focus:border-cyber-blue rounded-none"
            >
              <option value="goro_sp1">GORO SANKSI SP1 (-10 POIN)</option>
              <option value="goro_sp2">GORO SANKSI SP2 (-15 POIN)</option>
              <option value="penyesuaian_komdis">
                PENYESUAIAN KHUSUS KOMDIS
              </option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">
              NILAI POIN PEMUTIHAN (HARUS NEGATIF):
            </label>
            <input
              type="number"
              max={-1}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-full bg-canvas-dark border border-hairline-dark p-2.5 text-xs font-mono text-emerald-400 font-bold focus:outline-hidden focus:border-cyber-blue rounded-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">
              DESKRIPSI / CATATAN PELAKSANAAN GORO:
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Telah melaksanakan sanksi Goro laboratorium selama 4x pertemuan bulan Agustus..."
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
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs uppercase tracking-wider rounded-none cursor-pointer"
            >
              {isPending ? (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  size={16}
                  className="animate-spin"
                />
              ) : (
                "SIMPAN PEMUTIHAN"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
