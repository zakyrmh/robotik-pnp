"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Download, FileJson, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { exportUserDataAction } from "@/lib/actions/settings";

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportDataModal({ isOpen, onClose }: ExportDataModalProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await exportUserDataAction();
      if (res.success && res.data) {
        // Create downloadable JSON file
        const dataStr =
          "data:text/json;charset=utf-8," +
          encodeURIComponent(JSON.stringify(res.data, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute(
          "download",
          `data-pribadi-ukm-robotik-${Date.now()}.json`,
        );
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        toast.success("File arsip data pribadi berhasil diunduh.");
        onClose();
      } else {
        toast.error(res.message || "Gagal mengekspor data.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat mengekspor data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-400">
            <FileJson className="w-5 h-5 text-orange-500" />
            <DialogTitle className="text-base font-semibold tracking-tight">
              Unduh Data Pribadi (UU PDP No. 27/2022)
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Sesuai Hak Subjek Data, Anda dapat mengunduh salinan lengkap data
            profil, pendaftaran, presensi, dan riwayat tugas Anda.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-lg text-xs text-blue-800 dark:text-blue-300 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              Perlindungan Privasi Data
            </p>
            <p className="text-micro leading-relaxed text-blue-700/90 dark:text-blue-300/90">
              File `.json` yang diunduh berisi data terenkripsi dan ringkasan
              riwayat akun Anda. Jagalah file ini dengan aman.
            </p>
          </div>
        </div>

        <DialogFooter className="pt-2 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={loading}
            className="h-9 text-xs bg-blue-900 hover:bg-blue-800 text-white dark:bg-blue-600 dark:hover:bg-blue-500 font-medium px-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Mengekspor...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Unduh File (.json)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
