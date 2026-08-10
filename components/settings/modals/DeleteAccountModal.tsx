"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
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
import { requestAccountDeletionAction } from "@/lib/actions/settings";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const REQUIRED_CONFIRM_TEXT = "SAYA INGIN MENGHAPUS AKUN";

export function DeleteAccountModal({
  isOpen,
  onClose,
}: DeleteAccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const isFormValid =
    currentPassword.length > 0 &&
    deleteReason.trim().length >= 5 &&
    confirmText === REQUIRED_CONFIRM_TEXT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      const res = await requestAccountDeletionAction({
        currentPassword,
        deleteReason,
        confirmText,
      });

      if (res.success) {
        toast.success(res.message);
        onClose();
        window.location.href = "/login?message=Akun+telah+dinonaktifkan";
      } else {
        toast.error(res.message || "Gagal menonaktifkan akun.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-red-200 dark:border-red-900/50 text-slate-900 dark:text-slate-100">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <DialogTitle className="text-base font-semibold tracking-tight text-red-600 dark:text-red-400">
              Konfirmasi Penghapusan Akun (Zona Bahaya)
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Tindakan ini akan menonaktifkan akun Anda. Seluruh riwayat presensi,
            kedisiplinan, dan akses portal akan dinonaktifkan secara aman.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-700 dark:text-red-300 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              ⚠️ Kepatuhan UU PDP No. 27/2022 & Audit Trail ISO 27001
            </p>
            <p className="text-micro leading-relaxed text-red-600/90 dark:text-red-400/90">
              Penghapusan akun bersifat Soft-Delete. Data pribadi Anda tidak
              dapat diakses lagi di aplikasi dan alasan penutupan akan dicatat
              secara immutable.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Alasan Penutupan / Deaktivasi Akun
            </Label>
            <Textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Jelaskan alasan Anda menonaktifkan akun (minimal 5 karakter)..."
              rows={3}
              className="text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 resize-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Kata Sandi Saat Ini
            </Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Ketikkan{" "}
              <span className="font-bold select-all text-red-600 dark:text-red-400">
                &quot;{REQUIRED_CONFIRM_TEXT}&quot;
              </span>
            </Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={REQUIRED_CONFIRM_TEXT}
              className="h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 font-mono"
              required
            />
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
              type="submit"
              disabled={!isFormValid || loading}
              className="h-9 text-xs bg-red-600 hover:bg-red-700 text-white font-medium px-4 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Menonaktifkan...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Hapus & Menonaktifkan Akun
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
