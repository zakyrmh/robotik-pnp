"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
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
import { changePasswordAction } from "@/lib/actions/settings";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error("Semua field wajib diisi.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Kata sandi baru minimal 8 karakter.");
      return;
    }

    setLoading(true);
    try {
      const res = await changePasswordAction({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      if (res.success) {
        toast.success(res.message);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        onClose();
      } else {
        toast.error(res.message || "Gagal memperbarui kata sandi.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-400">
            <Lock className="w-5 h-5 text-orange-500" />
            <DialogTitle className="text-base font-semibold tracking-tight">
              Ganti Kata Sandi (Password)
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Pastikan kata sandi baru Anda memiliki minimal 8 karakter dan susah ditebak orang lain.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Kata Sandi Baru
              </Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Konfirmasi Kata Sandi Baru
              </Label>
              <Input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                className="h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                required
              />
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
              type="submit"
              disabled={loading}
              className="h-9 text-xs bg-blue-900 hover:bg-blue-800 text-white dark:bg-blue-600 dark:hover:bg-blue-500 font-medium px-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Memperbarui...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                  Simpan Kata Sandi Baru
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
