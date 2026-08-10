"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, UserCog, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProfileAction } from "@/lib/actions/settings";
import type { UpdateProfileInput } from "@/lib/schemas/settings";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    full_name?: string | null;
    nickname?: string | null;
    gender?: "L" | "P" | null;
    pob?: string | null;
    dob?: string | null;
    phone_number?: string | null;
    study_program_id?: string | null;
    entry_year?: number | null;
    current_class?: string | null;
    high_school?: string | null;
    origin_address?: string | null;
    domicile_address?: string | null;
    motivation?: string | null;
    org_experience?: string | null;
    achievements?: string | null;
    avatar_url?: string | null;
  };
  studyPrograms: Array<{
    id: string;
    name: string;
    degree: string;
    majors?: { name: string } | Array<{ name: string }> | null;
  }>;
}

export function EditProfileModal({
  isOpen,
  onClose,
  initialData,
  studyPrograms,
}: EditProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileInput>({
    full_name: initialData.full_name || "",
    nickname: initialData.nickname || "",
    gender: (initialData.gender as "L" | "P") || "L",
    pob: initialData.pob || "",
    dob: initialData.dob || "",
    phone_number: initialData.phone_number || "",
    study_program_id: initialData.study_program_id || "",
    entry_year: initialData.entry_year || new Date().getFullYear(),
    current_class: initialData.current_class || "",
    high_school: initialData.high_school || "",
    origin_address: initialData.origin_address || "",
    domicile_address: initialData.domicile_address || "",
    motivation: initialData.motivation || "",
    org_experience: initialData.org_experience || "",
    achievements: initialData.achievements || "",
    avatar_url: initialData.avatar_url || "",
  });

  const handleChange = (
    field: keyof UpdateProfileInput,
    value: string | number | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await updateProfileAction(formData);
      if (res.success) {
        toast.success(res.message);
        onClose();
      } else {
        toast.error(res.message || "Gagal memperbarui profil.");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-400">
            <UserCog className="w-5 h-5 text-orange-500" />
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Edit Data Profil & Akademik
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Perbarui data diri, kontak, dan informasi pendaftaran Anda secara
            lengkap.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Identitas Diri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Nama Lengkap
              </Label>
              <Input
                value={formData.full_name || ""}
                onChange={(e) => handleChange("full_name", e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Nama Panggilan
              </Label>
              <Input
                value={formData.nickname || ""}
                onChange={(e) => handleChange("nickname", e.target.value)}
                placeholder="Nama panggilan"
                className="h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Jenis Kelamin
              </Label>
              <Select
                value={formData.gender || "L"}
                onValueChange={(val) =>
                  handleChange("gender", val as "L" | "P")
                }
              >
                <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Pilih Jenis Kelamin" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <SelectItem value="L">Laki-Laki (L)</SelectItem>
                  <SelectItem value="P">Perempuan (P)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Tempat Lahir
              </Label>
              <Input
                value={formData.pob || ""}
                onChange={(e) => handleChange("pob", e.target.value)}
                placeholder="Contoh: Padang"
                className="h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Tanggal Lahir
              </Label>
              <Input
                type="date"
                value={formData.dob || ""}
                onChange={(e) => handleChange("dob", e.target.value)}
                className="h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                No. WhatsApp / HP
              </Label>
              <Input
                value={formData.phone_number || ""}
                onChange={(e) => handleChange("phone_number", e.target.value)}
                placeholder="081234567890"
                className="h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Program Studi
              </Label>
              <Select
                value={formData.study_program_id || ""}
                onValueChange={(val) => handleChange("study_program_id", val)}
              >
                <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Pilih Program Studi" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto">
                  {studyPrograms.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>
                      {sp.degree} {sp.name}{" "}
                      {sp.majors
                        ? `(${Array.isArray(sp.majors) ? sp.majors[0]?.name : sp.majors.name})`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Tahun Masuk (Angkatan)
              </Label>
              <Input
                type="number"
                value={formData.entry_year || new Date().getFullYear()}
                onChange={(e) =>
                  handleChange("entry_year", Number(e.target.value))
                }
                className="h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Kelas Saat Ini
              </Label>
              <Input
                value={formData.current_class || ""}
                onChange={(e) => handleChange("current_class", e.target.value)}
                placeholder="Contoh: 1A / 2B"
                className="h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Asal Sekolah (SMA/SMK)
              </Label>
              <Input
                value={formData.high_school || ""}
                onChange={(e) => handleChange("high_school", e.target.value)}
                placeholder="SMKN 1 Padang"
                className="h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Alamat Asal
              </Label>
              <Textarea
                value={formData.origin_address || ""}
                onChange={(e) => handleChange("origin_address", e.target.value)}
                placeholder="Alamat rumah asal"
                rows={2}
                className="text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Alamat Domisili di Padang
              </Label>
              <Textarea
                value={formData.domicile_address || ""}
                onChange={(e) =>
                  handleChange("domicile_address", e.target.value)
                }
                placeholder="Alamat kos / tempat tinggal sekarang"
                rows={2}
                className="text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 resize-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Motivasi Bergabung UKM Robotik
            </Label>
            <Textarea
              value={formData.motivation || ""}
              onChange={(e) => handleChange("motivation", e.target.value)}
              placeholder="Ceritakan motivasi Anda..."
              rows={2}
              className="text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 resize-none"
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 text-xs bg-blue-900 hover:bg-blue-800 text-white dark:bg-blue-600 dark:hover:bg-blue-500 font-medium px-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
