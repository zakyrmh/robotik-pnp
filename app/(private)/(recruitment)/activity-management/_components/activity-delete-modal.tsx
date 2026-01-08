"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Activity } from "@/schemas/activities";
import { deleteActivity } from "@/lib/firebase/services/activity-service";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

// =========================================================
// TYPES
// =========================================================

interface ActivityDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity | null;
  onSuccess: () => void;
}

// =========================================================
// MAIN COMPONENT
// =========================================================

export function ActivityDeleteModal({
  isOpen,
  onClose,
  activity,
  onSuccess,
}: ActivityDeleteModalProps) {
  const { user } = useDashboard();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!activity) return null;

  const handleDelete = async () => {
    if (!user?.uid) {
      toast.error("User tidak terautentikasi");
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteActivity(activity.id, user.uid);

      if (result.success) {
        toast.success("Aktivitas berhasil dihapus");
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Gagal menghapus aktivitas");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Terjadi kesalahan saat menghapus aktivitas");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader className="pb-4">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <DialogTitle className="text-center text-xl font-bold text-slate-900 dark:text-slate-100">
            Hapus Aktivitas?
          </DialogTitle>
          <DialogDescription className="text-center text-slate-500 dark:text-slate-400">
            Apakah Anda yakin ingin menghapus aktivitas ini? Tindakan ini tidak
            dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Activity Info Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
              {activity.title}
            </h4>
            {activity.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                {activity.description}
              </p>
            )}
          </div>

          {/* Warning Message */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900/50">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Perhatian
              </p>
              <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                Data kehadiran dan informasi terkait aktivitas ini juga akan
                disembunyikan dari sistem.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 border-slate-200 dark:border-slate-700"
            >
              Batal
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
