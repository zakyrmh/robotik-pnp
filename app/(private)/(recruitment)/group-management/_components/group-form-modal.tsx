"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import { GroupParent } from "@/schemas/groups";
import {
  createGroupParent,
  updateGroupParent,
} from "@/lib/firebase/services/group-service";
import { useAuth } from "@/hooks/useAuth";

// Form Schema for Group Parent
const formSchema = z.object({
  name: z.string().min(1, "Nama kelompok wajib diisi"),
  description: z.string().optional(),
  orPeriod: z.string().min(1, "Periode OR wajib diisi"),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface GroupFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: GroupParent | null; // If present, entering Edit Mode (future implementation)
  onSuccess: () => void;
}

export function GroupFormModal({
  open,
  onOpenChange,
  group,
  onSuccess,
}: GroupFormModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      orPeriod: "",
      isActive: true,
    },
  });

  // Reset form when group changes or modal opens
  useEffect(() => {
    if (group) {
      // Edit Mode (future implementation)
      form.reset({
        name: group.name,
        description: group.description || "",
        orPeriod: group.orPeriod,
        isActive: group.isActive,
      });
    } else {
      // Create Mode
      form.reset({
        name: "",
        description: "",
        orPeriod: "",
        isActive: true,
      });
    }
  }, [group, form, open]);

  const onSubmit = async (values: FormValues) => {
    if (!user?.uid) {
      toast.error("User tidak terautentikasi");
      return;
    }

    setIsSubmitting(true);
    try {
      if (group) {
        // Edit Mode
        await updateGroupParent(group.id, {
          name: values.name,
          description: values.description,
          orPeriod: values.orPeriod,
          isActive: values.isActive,
        });
        toast.success("Kelompok berhasil diperbarui");
      } else {
        // Create Mode
        await createGroupParent({
          name: values.name,
          description: values.description,
          orPeriod: values.orPeriod,
          isActive: values.isActive,
          createdBy: user.uid,
        });
        toast.success("Kelompok baru berhasil dibuat");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting group:", error);
      toast.error("Gagal menyimpan kelompok");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {group ? "Edit Kelompok" : "Buat Kelompok Baru"}
          </DialogTitle>
          <DialogDescription>
            {group
              ? "Ubah informasi kelompok yang sudah ada."
              : "Buat kelompok baru untuk mengorganisir sub-kelompok peserta."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nama Kelompok <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Contoh: Kelompok Project 1"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi (Opsional)</Label>
            <Textarea
              id="description"
              placeholder="Jelaskan tujuan atau detail kelompok..."
              className="resize-none h-24"
              {...form.register("description")}
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
              {...form.register("orPeriod")}
            />
            {form.formState.errors.orPeriod && (
              <p className="text-sm text-red-500">
                {form.formState.errors.orPeriod.message}
              </p>
            )}
          </div>

          {/* Active Status Switch */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isActive" className="text-base">
                Status Aktif
              </Label>
              <p className="text-sm text-muted-foreground">
                Kelompok aktif dapat digunakan untuk pengelompokan peserta
              </p>
            </div>
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id="isActive"
                />
              )}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {group ? "Simpan Perubahan" : "Buat Kelompok"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
