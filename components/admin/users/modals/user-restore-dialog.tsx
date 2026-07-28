"use client";

import { useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserManagementItem } from "@/lib/types/user-management";
import { restoreUserAction } from "@/lib/actions/admin-users";
import { toast } from "sonner";
import { RotateCcw, Loader2, UserCheck } from "lucide-react";

interface UserRestoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserManagementItem | null;
}

export function UserRestoreDialog({
  isOpen,
  onClose,
  user,
}: UserRestoreDialogProps) {
  const [isPending, startTransition] = useTransition();

  if (!user) return null;

  const handleRestore = () => {
    startTransition(async () => {
      try {
        const res = await restoreUserAction({ userId: user.id });

        if (res.success) {
          toast.success(res.message);
          onClose();
        } else {
          toast.error("Gagal memulihkan akun pengguna.");
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
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Pulihkan Akun Pengguna
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500">
                Mengembalikan status aktif pengguna agar dapat kembali mengakses
                sistem.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2 text-xs text-neutral-600 dark:text-neutral-400">
          <p>
            Apakah Anda yakin ingin memulihkan akun{" "}
            <strong>{user.fullName || user.email}</strong>?
          </p>
          {user.deleteReason && (
            <p className="mt-2 text-[11px] text-neutral-500 bg-neutral-100 dark:bg-neutral-800 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <strong>Catatan Penonaktifan Sebelumnya:</strong>{" "}
              {user.deleteReason}
            </p>
          )}
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
            onClick={handleRestore}
            disabled={isPending}
            className="h-9 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                <span>Pulihkan Akun</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
