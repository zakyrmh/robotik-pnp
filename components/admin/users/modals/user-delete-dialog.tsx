"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserManagementItem } from "@/lib/types/user-management";
import { softDeleteUserAction } from "@/lib/actions/admin-users";
import { toast } from "sonner";
import { AlertTriangle, Loader2, UserX } from "lucide-react";

interface UserDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserManagementItem | null;
  currentUserId: string;
}

export function UserDeleteDialog({
  isOpen,
  onClose,
  user,
  currentUserId,
}: UserDeleteDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteReason, setDeleteReason] = useState("");

  if (!user) return null;

  const isSelf = currentUserId === user.id;

  const handleConfirm = () => {
    if (isSelf) {
      toast.error("Anda tidak dapat menonaktifkan akun Anda sendiri.");
      return;
    }

    if (!deleteReason.trim() || deleteReason.trim().length < 5) {
      toast.error("Alasan penonaktifan wajib diisi (minimal 5 karakter).");
      return;
    }

    startTransition(async () => {
      try {
        const res = await softDeleteUserAction({
          userId: user.id,
          deleteReason: deleteReason.trim(),
        });

        if (res.success) {
          toast.success(res.message);
          setDeleteReason("");
          onClose();
        } else {
          toast.error("Gagal menonaktifkan akun.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(msg);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Arsipkan / Menonaktifkan Pengguna
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500">
                Akun akan dinonaktifkan (Soft Delete) tanpa menghapus data
                secara permanen.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            <p className="text-neutral-700 dark:text-neutral-300 font-medium">
              Pengguna Target: <strong>{user.fullName || user.email}</strong> (
              {user.role})
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Alasan Penonaktifan / Pengarsipan{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Textarea
              placeholder="Jelaskan alasan organisasi (misal: Lulus kuliah, mengundurkan diri, atau duplikat akun)..."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              className="rounded-xl text-xs min-h-[90px] focus-visible:ring-red-500"
            />
            <p className="text-[11px] text-neutral-400">
              Minimal 5 karakter. Alasan ini akan dicatat ke dalam log audit
              sistem.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="h-9 rounded-xl text-xs"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending || isSelf || deleteReason.trim().length < 5}
            className="h-9 rounded-xl text-xs font-medium gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <UserX className="w-3.5 h-3.5" />
                <span>Konfirmasi Nonaktifkan</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
