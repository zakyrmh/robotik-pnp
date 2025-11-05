"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteSubGroup } from "@/lib/firebase/groups";
import { SubGroup } from "@/types/groups";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeleteSubGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subGroup: SubGroup;
  onSuccess: () => void;
}

export default function DeleteSubGroupDialog({
  open,
  onOpenChange,
  subGroup,
  onSuccess,
}: DeleteSubGroupDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteSubGroup(subGroup.id);
      toast.success("Sub-kelompok berhasil dihapus!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting sub-group:", error);
      toast.error("Gagal menghapus sub-kelompok. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Hapus Sub-kelompok
          </DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus sub-kelompok ini?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="font-semibold text-red-900 mb-2">{subGroup.name}</p>
            <div className="text-sm text-red-800 space-y-1">
              <p>• {subGroup.memberIds.length} anggota akan kehilangan kelompok</p>
              <p className="font-semibold mt-2">
                ⚠️ Tindakan ini tidak dapat dibatalkan!
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Menghapus..." : "Hapus Sub-kelompok"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
