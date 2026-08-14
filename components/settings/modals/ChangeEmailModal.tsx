"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, KeyRound } from "lucide-react";
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
import { updateEmailAction } from "@/lib/actions/settings";

interface ChangeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
}

export function ChangeEmailModal({
  isOpen,
  onClose,
  currentEmail,
}: ChangeEmailModalProps) {
  const [loading, setLoading] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !currentPassword) {
      toast.error("Semua field wajib diisi.");
      return;
    }

    if (newEmail.trim().toLowerCase() === currentEmail.trim().toLowerCase()) {
      toast.error("Alamat email baru harus berbeda dengan email saat ini.");
      return;
    }

    setLoading(true);
    try {
      const res = await updateEmailAction({ newEmail, currentPassword });
      if (res.success) {
        toast.success(res.message);
        setNewEmail("");
        setCurrentPassword("");
        onClose();
      } else {
        toast.error(res.message || "Gagal mengubah email.");
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
            <Mail className="w-5 h-5 text-orange-500" />
            <DialogTitle className="text-base font-semibold tracking-tight">
              Ubah Alamat Email
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Masukkan email baru dan konfirmasi kata sandi Anda saat ini. Link
            konfirmasi akan dikirimkan ke alamat email baru.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Email Saat Ini
              </Label>
              <Input
                value={currentEmail}
                disabled
                className="h-9 text-xs bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Alamat Email Baru
              </Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nama@domain.com"
                className="h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Kata Sandi Saat Ini (Verifikasi Keamanan)
            </Label>
            <div className="relative">
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 pr-9"
                required
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
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
                  Mengirim Konfirmasi...
                </>
              ) : (
                "Kirim Link Konfirmasi"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
