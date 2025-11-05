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
import { generateGroupParent } from "@/lib/firebase/groups";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface GenerateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  currentUserId: string | null;
}

export default function GenerateGroupDialog({
  open,
  onOpenChange,
  onSuccess,
  currentUserId,
}: GenerateGroupDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    numberOfSubGroups: 5,
    orPeriod: "OR 21",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUserId) {
      toast.error("User tidak terautentikasi");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Nama kelompok harus diisi");
      return;
    }

    if (formData.numberOfSubGroups < 1 || formData.numberOfSubGroups > 50) {
      toast.error("Jumlah sub-kelompok harus antara 1-50");
      return;
    }

    setLoading(true);
    try {
      await generateGroupParent(
        formData.name.trim(),
        formData.numberOfSubGroups,
        formData.orPeriod,
        formData.description.trim(),
        currentUserId
      );

      toast.success("Kelompok berhasil di-generate!");
      onSuccess();
      onOpenChange(false);

      // Reset form
      setFormData({
        name: "",
        description: "",
        numberOfSubGroups: 5,
        orPeriod: "OR 21",
      });
    } catch (error) {
      console.error("Error generating group:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal membuat kelompok. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Kelompok</DialogTitle>
          <DialogDescription>
            Generate kelompok baru dengan otomatis assign anggota dari user caang
            berdasarkan attendance
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Nama Kelompok */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nama Kelompok Parent <span className="text-red-500">*</span>
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

            {/* Jumlah Sub-kelompok */}
            <div className="space-y-2">
              <Label htmlFor="numberOfSubGroups">
                Jumlah Sub-kelompok <span className="text-red-500">*</span>
              </Label>
              <Input
                id="numberOfSubGroups"
                type="number"
                min={1}
                max={50}
                value={formData.numberOfSubGroups}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    numberOfSubGroups: parseInt(e.target.value) || 1,
                  })
                }
                required
              />
              <p className="text-xs text-gray-500">
                Anggota akan otomatis di-distribusikan ke sub-kelompok secara merata
              </p>
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

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-semibold mb-1">ℹ️ Informasi:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Anggota diambil dari user dengan role CAANG</li>
                <li>Prioritas: user dengan attendance tertinggi</li>
                <li>User dengan attendance &lt; 25% akan di-highlight</li>
                <li>Distribusi anggota dilakukan secara merata</li>
              </ul>
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
              {loading ? "Generating..." : "Generate Kelompok"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
