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
import {
  updateSubGroup,
} from "@/lib/firebase/groups";
import { GroupParent, SubGroup, GroupMember } from "@/types/groups";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EditSubGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subGroup: SubGroup;
  groupParent: GroupParent;
  onSuccess: () => void;
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EditSubGroupDialog({
  open,
  onOpenChange,
  subGroup,
  onSuccess,
}: EditSubGroupDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: subGroup.name,
    description: subGroup.description || "",
  });

  const [currentMembers, setCurrentMembers] = useState<GroupMember[]>(
    subGroup.members
  );
  const [leaderId, setLeaderId] = useState(subGroup.leaderId || "");

  useEffect(() => {
    setFormData({
      name: subGroup.name,
      description: subGroup.description || "",
    });
    setCurrentMembers(subGroup.members);
    setLeaderId(subGroup.leaderId || "");
  }, [subGroup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Nama sub-kelompok harus diisi");
      return;
    }

    setLoading(true);
    try {
      await updateSubGroup(subGroup.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        leaderId: leaderId || undefined,
      });

      toast.success("Sub-kelompok berhasil diperbarui!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating sub-group:", error);
      toast.error("Gagal memperbarui sub-kelompok. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Sub-kelompok</DialogTitle>
          <DialogDescription>
            Ubah nama, deskripsi, dan ketua kelompok
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
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
                className="resize-none"
              />
            </div>

            {/* Leader Selection */}
            <div className="space-y-2">
              <Label htmlFor="leader">Ketua Kelompok (Opsional)</Label>
              <Select
                value={leaderId}
                onValueChange={setLeaderId}
                disabled={currentMembers.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih ketua kelompok..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada ketua</SelectItem>
                  {currentMembers.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {member.fullName} ({member.nim})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentMembers.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Sub-kelompok ini belum memiliki anggota. Tambahkan anggota melalui halaman Edit Anggota.
                </p>
              )}
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
