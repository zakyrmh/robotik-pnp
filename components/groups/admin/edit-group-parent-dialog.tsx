"use client";

import { useState, useEffect } from "react";
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
import { updateGroupParent } from "@/lib/firebase/groups";
import { GroupParent } from "@/types/groups";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EditGroupParentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupParent: GroupParent;
  onSuccess: () => void;
}

export default function EditGroupParentDialog({
  open,
  onOpenChange,
  groupParent,
  onSuccess,
}: EditGroupParentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: groupParent.name,
    description: groupParent.description || "",
    orPeriod: groupParent.orPeriod,
  });

  useEffect(() => {
    setFormData({
      name: groupParent.name,
      description: groupParent.description || "",
      orPeriod: groupParent.orPeriod,
    });
  }, [groupParent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Nama kelompok harus diisi");
      return;
    }

    setLoading(true);
    try {
      await updateGroupParent(groupParent.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        orPeriod: formData.orPeriod,
      });

      toast.success("Kelompok berhasil diperbarui!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating group parent:", error);
      toast.error("Gagal memperbarui kelompok. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Kelompok</DialogTitle>
          <DialogDescription>
            Edit informasi kelompok parent
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Nama Kelompok */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nama Kelompok <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Contoh: Kelompok Project 1"
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
                placeholder="Deskripsi kelompok (opsional)"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* OR Period */}
            <div className="space-y-2">
              <Label htmlFor="orPeriod">
                Periode OR <span className="text-red-500">*</span>
              </Label>
              <Input
                id="orPeriod"
                placeholder="Contoh: OR 21"
                value={formData.orPeriod}
                onChange={(e) =>
                  setFormData({ ...formData, orPeriod: e.target.value })
                }
                required
              />
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
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
