"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trash2,
  ArrowLeft,
  RotateCcw,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Activity } from "@/schemas/activities";
import {
  getDeletedRecruitmentActivities,
  restoreActivity,
  permanentDeleteActivity,
  formatActivityDate,
  formatActivityTime,
} from "@/lib/firebase/services/activity-service";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { toast } from "sonner";

// =========================================================
// SKELETON LOADING COMPONENT
// =========================================================

function TrashSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div>
          <div className="h-8 w-56 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-5 w-72 bg-slate-200 dark:bg-slate-800 rounded mt-2" />
        </div>
      </div>

      {/* List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-9 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading Indicator */}
      <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Memuat data...</span>
      </div>
    </div>
  );
}

// =========================================================
// EMPTY STATE COMPONENT
// =========================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <Trash2 className="w-10 h-10 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
        Tempat Sampah Kosong
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm">
        Tidak ada aktivitas yang dihapus. Aktivitas yang dihapus akan muncul di
        sini.
      </p>
      <Link href="/activity-management/recruitment">
        <Button variant="outline" className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
      </Link>
    </div>
  );
}

// =========================================================
// DELETED ACTIVITY CARD COMPONENT
// =========================================================

interface DeletedActivityCardProps {
  activity: Activity;
  onRestore: (activity: Activity) => void;
  onPermanentDelete: (activity: Activity) => void;
  isRestoring: boolean;
}

function DeletedActivityCard({
  activity,
  onRestore,
  onPermanentDelete,
  isRestoring,
}: DeletedActivityCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Activity Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {activity.title}
          </h3>
          {activity.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
              {activity.description}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatActivityDate(activity.startDateTime)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatActivityTime(activity.startDateTime)}</span>
            </div>
            {activity.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[150px]">
                  {activity.location}
                </span>
              </div>
            )}
          </div>

          {/* Deleted Info */}
          <div className="flex items-center gap-1 mt-2 text-xs text-red-500 dark:text-red-400">
            <Trash2 className="w-3 h-3" />
            <span>
              Dihapus:{" "}
              {activity.deletedAt
                ? formatActivityDate(activity.deletedAt)
                : "Tidak diketahui"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRestore(activity)}
            disabled={isRestoring}
            className="flex items-center gap-2 border-green-200 dark:border-green-900 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/50"
          >
            <RotateCcw className="w-4 h-4" />
            Pulihkan
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPermanentDelete(activity)}
            disabled={isRestoring}
            className="flex items-center gap-2 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
          >
            <Trash2 className="w-4 h-4" />
            Hapus Permanen
          </Button>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// PERMANENT DELETE CONFIRMATION MODAL
// =========================================================

interface PermanentDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

function PermanentDeleteModal({
  isOpen,
  onClose,
  activity,
  onConfirm,
  isDeleting,
}: PermanentDeleteModalProps) {
  if (!activity) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader className="pb-4">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <DialogTitle className="text-center text-xl font-bold text-slate-900 dark:text-slate-100">
            Hapus Permanen?
          </DialogTitle>
          <DialogDescription className="text-center text-slate-500 dark:text-slate-400">
            Aktivitas akan dihapus secara permanen dan tidak dapat dipulihkan
            lagi.
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
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900/50">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-red-800 dark:text-red-200">
                Peringatan
              </p>
              <p className="text-red-700 dark:text-red-300 mt-0.5">
                Tindakan ini TIDAK DAPAT dibatalkan. Semua data terkait
                aktivitas ini akan hilang selamanya.
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
              onClick={onConfirm}
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
                  Hapus Permanen
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================
// MAIN PAGE COMPONENT
// =========================================================

export default function ActivityTrashPage() {
  const { roles, isLoading: dashboardLoading } = useDashboard();

  const [isLoading, setIsLoading] = useState(true);
  const [deletedActivities, setDeletedActivities] = useState<Activity[]>([]);
  const [isRestoring, setIsRestoring] = useState(false);

  // Permanent delete modal state
  const [isPermanentDeleteModalOpen, setIsPermanentDeleteModalOpen] =
    useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Check authorization
  const isAuthorized =
    roles?.isRecruiter === true || roles?.isSuperAdmin === true;

  // Fetch deleted activities
  useEffect(() => {
    const fetchData = async () => {
      if (dashboardLoading) return;

      if (!isAuthorized) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await getDeletedRecruitmentActivities();
        setDeletedActivities(data);
      } catch (error) {
        console.error("Error fetching deleted activities:", error);
        toast.error("Gagal memuat data aktivitas yang dihapus");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dashboardLoading, isAuthorized]);

  // Handle restore
  const handleRestore = async (activity: Activity) => {
    setIsRestoring(true);

    try {
      const result = await restoreActivity(activity.id);

      if (result.success) {
        toast.success("Aktivitas berhasil dipulihkan");
        setDeletedActivities((prev) =>
          prev.filter((a) => a.id !== activity.id)
        );
      } else {
        toast.error(result.error || "Gagal memulihkan aktivitas");
      }
    } catch (error) {
      console.error("Restore error:", error);
      toast.error("Terjadi kesalahan saat memulihkan aktivitas");
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle permanent delete
  const handlePermanentDelete = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsPermanentDeleteModalOpen(true);
  };

  const confirmPermanentDelete = async () => {
    if (!selectedActivity) return;

    setIsDeleting(true);

    try {
      const result = await permanentDeleteActivity(selectedActivity.id);

      if (result.success) {
        toast.success("Aktivitas berhasil dihapus secara permanen");
        setDeletedActivities((prev) =>
          prev.filter((a) => a.id !== selectedActivity.id)
        );
        setIsPermanentDeleteModalOpen(false);
        setSelectedActivity(null);
      } else {
        toast.error(result.error || "Gagal menghapus aktivitas");
      }
    } catch (error) {
      console.error("Permanent delete error:", error);
      toast.error("Terjadi kesalahan saat menghapus aktivitas");
    } finally {
      setIsDeleting(false);
    }
  };

  // Show skeleton loader
  if (isLoading || dashboardLoading) {
    return <TrashSkeleton />;
  }

  // Not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Akses Ditolak
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md">
            Anda tidak memiliki akses ke halaman ini.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/activity-management/recruitment">
          <Button
            variant="outline"
            size="icon"
            className="border-slate-200 dark:border-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            <Trash2 className="w-8 h-8 text-red-600" />
            Tempat Sampah
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Aktivitas yang dihapus dapat dipulihkan atau dihapus secara permanen
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            Informasi
          </p>
          <p className="text-amber-700 dark:text-amber-300 mt-0.5">
            Aktivitas di tempat sampah akan disimpan selama 30 hari sebelum
            dihapus secara otomatis.
          </p>
        </div>
      </div>

      {/* Deleted Activities List */}
      {deletedActivities.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {deletedActivities.map((activity) => (
            <DeletedActivityCard
              key={activity.id}
              activity={activity}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
              isRestoring={isRestoring}
            />
          ))}
        </div>
      )}

      {/* Footer Info */}
      {deletedActivities.length > 0 && (
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {deletedActivities.length} aktivitas di tempat sampah
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      <PermanentDeleteModal
        isOpen={isPermanentDeleteModalOpen}
        onClose={() => {
          setIsPermanentDeleteModalOpen(false);
          setSelectedActivity(null);
        }}
        activity={selectedActivity}
        onConfirm={confirmPermanentDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
