"use client";

import { useTransition } from "react";
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
import { UserManagementItem } from "@/lib/types/user-management";
import { restoreUserAction } from "@/lib/actions/admin-users";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  RotateLeft01Icon,
  Loading03Icon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";

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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!user) return null;

  const handleRestore = () => {
    startTransition(async () => {
      try {
        const res = await restoreUserAction({ userId: user.id });

        if (res.success) {
          toast.success(res.message);
          router.refresh();
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
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border border-border shadow-lg">
        <DialogHeader className="p-5 sm:p-6 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={RotateLeft01Icon} size={20} />
            </div>
            <div>
              <DialogTitle className="font-display text-base font-semibold tracking-tight text-foreground">
                Pulihkan Akun Pengguna
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Mengembalikan status aktif akun pengguna agar dapat kembali
                mengakses sistem.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 sm:p-6 bg-background space-y-3 text-xs text-muted-foreground">
          <p className="text-foreground">
            Apakah Anda yakin ingin memulihkan akun pengguna{" "}
            <strong>{user.fullName || user.email}</strong>?
          </p>
          {user.deleteReason && (
            <div className="text-[11px] bg-surface/50 dark:bg-card p-3 rounded-xl border border-border space-y-1">
              <span className="font-semibold text-foreground">
                Catatan Penonaktifan Sebelumnya:
              </span>
              <p className="text-muted-foreground">{user.deleteReason}</p>
            </div>
          )}
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
            onClick={handleRestore}
            disabled={isPending}
            className="min-h-[44px] rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5 shadow-xs"
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
                <HugeiconsIcon icon={UserCheck01Icon} size={15} />
                <span>Pulihkan Akun</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
