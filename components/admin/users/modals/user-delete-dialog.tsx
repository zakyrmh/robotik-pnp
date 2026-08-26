"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  Loading03Icon,
  UserBlock01Icon,
} from "@hugeicons/core-free-icons";

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
  const router = useRouter();
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
          router.refresh();
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
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border border-border shadow-lg">
        <DialogHeader className="p-5 sm:p-6 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={AlertCircleIcon} size={20} />
            </div>
            <div>
              <DialogTitle className="font-display text-base font-semibold tracking-tight text-foreground">
                Arsipkan / Nonaktifkan Pengguna
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Akun akan dinonaktifkan (Soft Delete) tanpa menghapus data
                secara permanen.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 p-5 sm:p-6 bg-background text-xs">
          <div className="p-3.5 rounded-xl bg-surface/50 dark:bg-card border border-border">
            <p className="text-foreground font-medium">
              Pengguna Target: <strong>{user.fullName || user.email}</strong> (
              <span className="font-mono text-muted-foreground">
                {user.role}
              </span>
              )
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              Alasan Penonaktifan / Pengarsipan{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              placeholder="Jelaskan alasan (misal: Lulus kuliah/alumni, mengundurkan diri, atau duplikat akun)..."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              className="rounded-lg text-xs min-h-[90px] border-border bg-background focus-visible:ring-destructive/20"
            />
            <p className="text-[11px] text-muted-foreground">
              Minimal 5 karakter. Catatan ini akan disimpan ke dalam log audit
              kepatuhan sistem.
            </p>
          </div>
        </div>

        <DialogFooter className="p-4 sm:p-5 border-t border-border bg-surface/40 dark:bg-card flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="min-h-[44px] rounded-lg text-xs"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending || isSelf || deleteReason.trim().length < 5}
            className="min-h-[44px] rounded-lg text-xs font-medium gap-1.5 shadow-xs"
          >
            {isPending ? (
              <>
                <HugeiconsIcon
                  icon={Loading03Icon}
                  size={15}
                  className="animate-spin"
                />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <HugeiconsIcon icon={UserBlock01Icon} size={15} />
                <span>Konfirmasi Nonaktifkan</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
