"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Attendance } from "@/types/attendances";
import { deleteAttendance } from "@/lib/firebase/attendances";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface DeleteAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendance: Attendance;
  onSuccess: () => void;
  currentUserId: string | null;
  userName?: string;
  activityName?: string;
}

export default function DeleteAttendanceDialog({
  open,
  onOpenChange,
  attendance,
  onSuccess,
  currentUserId,
  userName = "Caang",
  activityName = "Aktivitas",
}: DeleteAttendanceDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!currentUserId) {
      toast.error("User tidak terautentikasi");
      return;
    }

    setLoading(true);
    try {
      await deleteAttendance(attendance.id, currentUserId);
      
      toast.success("Absensi berhasil dihapus");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting attendance:", error);
      toast.error("Gagal menghapus absensi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Absensi?</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus absensi <strong>{userName}</strong> pada aktivitas <strong>{activityName}</strong>? 
            <br />
            <br />
            Tindakan ini akan melakukan soft delete (data tidak dihapus permanen dan masih bisa dipulihkan).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}