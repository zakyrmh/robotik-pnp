"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit02Icon,
  Delete01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { EditKomdisActivityDialog } from "@/components/features/komdis/edit-komdis-activity-dialog";
import { softDeleteKomdisActivity } from "@/lib/actions/komdis";
import {
  softDeleteActivity,
  type ActivityItem,
} from "@/lib/actions/activities";

interface ActivityDetailActionsProps {
  activity: ActivityItem;
  userRole: string;
  canManage: boolean;
  isAttendanceActive: boolean;
}

export function ActivityDetailActions({
  activity,
  userRole,
  canManage,
  isAttendanceActive,
}: ActivityDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSoftDelete = async () => {
    if (!confirm(`Apakah Anda yakin ingin memindahkan "${activity.title}" ke tempat sampah?`)) {
      return;
    }

    setIsDeleting(true);
    const toastId = toast.loading("Memindahkan kegiatan ke tempat sampah...");

    try {
      let res;
      if (activity.target_audience === "anggota" && userRole === "admin-komdis") {
        await softDeleteKomdisActivity(activity.id);
        res = { success: true, message: "Kegiatan berhasil dipindahkan ke tempat sampah." };
      } else {
        res = await softDeleteActivity(activity.id);
      }

      toast.dismiss(toastId);
      if (res.success) {
        toast.success(res.message);
        router.push("/kegiatan");
      } else {
        toast.error(res.message);
      }
    } catch (err: unknown) {
      toast.dismiss(toastId);
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 w-full sm:w-auto">
      {canManage && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="rounded-md border-primary text-primary hover:bg-primary-soft text-xs font-medium h-9 px-3"
          >
            <HugeiconsIcon icon={Edit02Icon} size={15} />
            Edit Kegiatan
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={isDeleting}
            onClick={handleSoftDelete}
            className="rounded-md border-destructive/40 text-destructive hover:bg-destructive/10 text-xs font-medium h-9 px-3"
          >
            <HugeiconsIcon icon={Delete01Icon} size={15} />
            Hapus Kegiatan
          </Button>
        </>
      )}

      <Button
        onClick={() => router.push(`/presensi/${activity.id}`)}
        size="sm"
        className="rounded-md bg-primary text-primary-foreground hover:bg-primary-hover text-xs font-medium h-9 px-4 w-full sm:w-auto"
      >
        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} />
        {isAttendanceActive ? "Absen Sekarang" : "Buka Modul Presensi"}
      </Button>

      {isEditing && (
        <EditKomdisActivityDialog
          activity={activity}
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          onSuccess={() => {
            setIsEditing(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
