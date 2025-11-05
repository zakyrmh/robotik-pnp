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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSubGroup } from "@/lib/firebase/groups";
import { GroupParent } from "@/types/groups";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddSubGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupParent: GroupParent;
  onSuccess: () => void;
  currentUserId: string | null;
}

export default function AddSubGroupDialog({
  open,
  onOpenChange,
  groupParent,
  onSuccess,
  currentUserId,
}: AddSubGroupDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUserId) {
      toast.error("User tidak terautentikasi");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Nama sub-kelompok harus diisi");
      return;
    }

    setLoading(true);
    try {
      await createSubGroup({
        parentId: groupParent.id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        orPeriod: groupParent.orPeriod,
        memberIds: [],
        members: [],
        isActive: true,
        createdBy: currentUserId,
      });

      toast.success("Sub-kelompok berhasil ditambahkan!");
      onSuccess();
      onOpenChange(false);

      // Reset form
      setFormData({
        name: "",
        description: "",
      });
    } catch (error) {
      console.error("Error adding sub-group:", error);
      toast.error("Gagal menambahkan sub-kelompok. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tambah Sub-kelompok</DialogTitle>
          <DialogDescription>
            Tambah sub-kelompok baru ke {groupParent.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Nama Sub-kelompok */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nama Sub-kelompok <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Contoh: Kelompok 1"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            {/* Deskripsi */}
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                placeholder="Deskripsi sub-kelompok (opsional)"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p>
                Sub-kelompok akan dibuat tanpa anggota. Anda dapat menambahkan
                anggota setelah sub-kelompok dibuat.
              </p>
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
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Menambahkan..." : "Tambah Sub-kelompok"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
