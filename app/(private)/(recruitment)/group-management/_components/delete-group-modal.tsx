"use client";

import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

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

import { softDeleteGroupParent } from "@/lib/firebase/services/group-service";
import { GroupParent } from "@/schemas/groups";
import { useAuth } from "@/hooks/useAuth";

interface DeleteGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: GroupParent | null;
  onSuccess: () => void;
}

export function DeleteGroupModal({
  open,
  onOpenChange,
  group,
  onSuccess,
}: DeleteGroupModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();

  const handleDelete = async () => {
    if (!group || !user) return;

    setIsDeleting(true);
    try {
      await softDeleteGroupParent(group.id, user.uid);
      toast.success("Kelompok berhasil dipindahkan ke sampah");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Gagal menghapus kelompok");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!group) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle>Hapus Kelompok?</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus kelompok{" "}
            <span className="font-semibold text-foreground">
              &quot;{group.name}&quot;
            </span>
            ?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground space-y-2">
          <p>
            Tindakan ini akan memindahkan kelompok dan seluruh sub-kelompoknya
            ke <span className="font-semibold">Trash (Sampah)</span>.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>Kelompok akan dinonaktifkan</li>
            <li>Data anggota tidak akan hilang</li>
            <li>Anda dapat memulihkannya kapan saja dari folder Trash</li>
          </ul>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Hapus Kelompok
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
