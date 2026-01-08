"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Layers } from "lucide-react";
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

import { createEmptySubGroups } from "@/lib/firebase/services/group-service";
import { useAuth } from "@/hooks/useAuth";

// Form Schema
const formSchema = z.object({
  count: z
    .number()
    .int()
    .min(1, "Minimal 1 sub-kelompok")
    .max(20, "Maksimal 20 sub-kelompok"),
});

type FormValues = z.infer<typeof formSchema>;

interface AddSubGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentGroupId: string;
  orPeriod: string;
  existingSubGroupCount: number;
  onSuccess: (newSubGroupIds: string[]) => void;
}

export function AddSubGroupModal({
  open,
  onOpenChange,
  parentGroupId,
  orPeriod,
  existingSubGroupCount,
  onSuccess,
}: AddSubGroupModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      count: 1,
    },
  });

  const count = form.watch("count");

  const onSubmit = async (values: FormValues) => {
    if (!user?.uid) {
      toast.error("User tidak terautentikasi");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createEmptySubGroups({
        parentGroupId,
        orPeriod,
        count: values.count,
        startingNumber: existingSubGroupCount + 1,
        createdBy: user.uid,
      });

      toast.success(
        `Berhasil membuat ${result.createdCount} sub-kelompok baru`
      );
      onSuccess(result.subGroupIds);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error creating sub-groups:", error);
      toast.error("Gagal membuat sub-kelompok");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Tambah Sub-Kelompok</DialogTitle>
          <DialogDescription>
            Tentukan jumlah sub-kelompok baru yang ingin dibuat. Sub-kelompok
            akan dibuat kosong tanpa anggota.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Count Input */}
          <div className="space-y-2">
            <Label htmlFor="count">Jumlah Sub-Kelompok</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={20}
              placeholder="Contoh: 3"
              {...form.register("count", { valueAsNumber: true })}
            />
            {form.formState.errors.count && (
              <p className="text-sm text-red-500">
                {form.formState.errors.count.message}
              </p>
            )}
          </div>

          {/* Preview */}
          {count > 0 && (
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/30 border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Sub-kelompok yang akan dibuat:
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Kelompok {existingSubGroupCount + 1}
                    {count > 1 &&
                      ` - Kelompok ${existingSubGroupCount + count}`}
                  </p>
                </div>
              </div>
            </div>
          )}

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
              Buat & Edit Anggota
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
