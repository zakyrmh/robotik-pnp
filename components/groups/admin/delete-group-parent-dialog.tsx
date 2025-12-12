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
import { deleteGroupParent } from "@/lib/firebase/groups";
import { GroupParent } from "@/types/groups";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeleteGroupParentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupParent: GroupParent;
  onSuccess: () => void;
}

export default function DeleteGroupParentDialog({
  open,
  onOpenChange,
  groupParent,
  onSuccess,
}: DeleteGroupParentDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteGroupParent(groupParent.id);
      toast.success("Kelompok berhasil dihapus!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting group parent:", error);
      toast.error("Gagal menghapus kelompok. Silakan coba lagi.");
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
            Hapus Kelompok
          </DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus kelompok ini?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="font-semibold text-red-900 mb-2">
              {groupParent.name}
            </p>
            <div className="text-sm text-red-800 space-y-1">
              <p>• {groupParent.totalSubGroups} sub-kelompok akan disembunyikan</p>
              <p>• Anggota tidak akan melihat kelompok ini</p>
              <p className="font-semibold mt-2">
                ℹ️ Kelompok akan dipindahkan ke Sampah dan dapat dipulihkan.
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
            {loading ? "Menghapus..." : "Hapus Kelompok"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
