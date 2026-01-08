"use client";

import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { deleteSubGroup } from "@/lib/firebase/services/group-service";
import { SubGroup } from "@/schemas/groups";

interface DeleteSubGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subGroup: SubGroup | null;
  onSuccess: () => void;
}

export function DeleteSubGroupModal({
  open,
  onOpenChange,
  subGroup,
  onSuccess,
}: DeleteSubGroupModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!subGroup) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSubGroup(subGroup.id, subGroup.parentId);
      toast.success(`${subGroup.name} berhasil dihapus`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting sub-group:", error);
      toast.error("Gagal menghapus sub-kelompok");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <AlertDialogTitle>Hapus Sub-Kelompok</AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                Apakah Anda yakin ingin menghapus{" "}
                <span className="font-semibold text-foreground">
                  {subGroup.name}
                </span>
                ?
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="my-4 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Peringatan:</strong> Tindakan ini tidak dapat dibatalkan.
            Sub-kelompok akan dihapus secara permanen beserta semua data
            anggotanya.
          </p>
          {subGroup.members.length > 0 && (
            <p className="text-sm text-red-700 dark:text-red-300 mt-2">
              Sub-kelompok ini memiliki{" "}
              <strong>{subGroup.members.length} anggota</strong> yang akan
              kehilangan keanggotaan mereka.
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Hapus Permanen
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
