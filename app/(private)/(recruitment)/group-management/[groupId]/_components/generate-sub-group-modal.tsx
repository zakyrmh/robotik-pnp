"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Users, Layers } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { generateSubGroups } from "@/lib/firebase/services/group-service";
import { useAuth } from "@/hooks/useAuth";

// Form Schema
const formSchema = z.object({
  mode: z.enum(["by_group_count", "by_member_count"]),
  groupCount: z.number().int().min(1).max(50).optional(),
  memberPerGroup: z.number().int().min(1).max(50).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface GenerateSubGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentGroupId: string;
  orPeriod: string;
  onSuccess: () => void;
  totalCaang?: number;
}

export function GenerateSubGroupModal({
  open,
  onOpenChange,
  parentGroupId,
  orPeriod,
  onSuccess,
  totalCaang = 0,
}: GenerateSubGroupModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<{
    groupCount: number;
    membersPerGroup: number;
    remainder: number;
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mode: "by_group_count",
      groupCount: 5,
      memberPerGroup: 5,
    },
  });

  const mode = form.watch("mode");
  const groupCount = form.watch("groupCount");
  const memberPerGroup = form.watch("memberPerGroup");

  // Calculate preview based on mode
  const calculatePreview = () => {
    if (totalCaang === 0) {
      setPreview(null);
      return;
    }

    if (mode === "by_group_count" && groupCount && groupCount > 0) {
      const membersPerGroup = Math.floor(totalCaang / groupCount);
      const remainder = totalCaang % groupCount;
      setPreview({
        groupCount,
        membersPerGroup,
        remainder,
      });
    } else if (
      mode === "by_member_count" &&
      memberPerGroup &&
      memberPerGroup > 0
    ) {
      const groupCountCalc = Math.ceil(totalCaang / memberPerGroup);
      const remainder = totalCaang - (groupCountCalc - 1) * memberPerGroup;
      setPreview({
        groupCount: groupCountCalc,
        membersPerGroup: memberPerGroup,
        remainder:
          remainder !== memberPerGroup
            ? totalCaang % memberPerGroup || memberPerGroup
            : 0,
      });
    } else {
      setPreview(null);
    }
  };

  // Update preview when values change
  const handleModeChange = (value: string) => {
    form.setValue("mode", value as "by_group_count" | "by_member_count");
    setTimeout(calculatePreview, 0);
  };

  const handleGroupCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    form.setValue("groupCount", value);
    setTimeout(calculatePreview, 0);
  };

  const handleMemberPerGroupChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(e.target.value) || 0;
    form.setValue("memberPerGroup", value);
    setTimeout(calculatePreview, 0);
  };

  const onSubmit = async (values: FormValues) => {
    if (!user?.uid) {
      toast.error("User tidak terautentikasi");
      return;
    }

    if (totalCaang === 0) {
      toast.error("Tidak ada caang yang tersedia untuk dibagi");
      return;
    }

    const targetGroupCount =
      values.mode === "by_group_count"
        ? values.groupCount
        : values.memberPerGroup
        ? Math.ceil(totalCaang / values.memberPerGroup)
        : 0;

    if (!targetGroupCount || targetGroupCount <= 0) {
      toast.error("Jumlah kelompok tidak valid");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await generateSubGroups({
        parentGroupId,
        orPeriod,
        groupCount: targetGroupCount,
        createdBy: user.uid,
      });

      toast.success(
        `Berhasil membuat ${result.createdCount} sub-kelompok dengan ${result.totalMembers} anggota`
      );
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error generating sub-groups:", error);
      toast.error("Gagal membuat sub-kelompok");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Sub-Kelompok Otomatis</DialogTitle>
          <DialogDescription>
            Bagi anggota caang secara merata ke dalam sub-kelompok berdasarkan
            persentase kehadiran (tertinggi ke terendah, distribusi
            round-robin).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Info Total Caang */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Total Caang Aktif
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {totalCaang} orang
              </p>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="space-y-2">
            <Label>Mode Pembagian</Label>
            <Controller
              control={form.control}
              name="mode"
              render={({ field }) => (
                <Select
                  onValueChange={(v) => {
                    field.onChange(v);
                    handleModeChange(v);
                  }}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="by_group_count">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Berdasarkan Jumlah Kelompok
                      </div>
                    </SelectItem>
                    <SelectItem value="by_member_count">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Berdasarkan Anggota per Kelompok
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Input based on mode */}
          {mode === "by_group_count" ? (
            <div className="space-y-2">
              <Label htmlFor="groupCount">Jumlah Kelompok</Label>
              <Input
                id="groupCount"
                type="number"
                min={1}
                max={50}
                placeholder="Contoh: 5"
                {...form.register("groupCount", { valueAsNumber: true })}
                onChange={handleGroupCountChange}
              />
              {form.formState.errors.groupCount && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.groupCount.message}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="memberPerGroup">Anggota per Kelompok</Label>
              <Input
                id="memberPerGroup"
                type="number"
                min={1}
                max={50}
                placeholder="Contoh: 5"
                {...form.register("memberPerGroup", { valueAsNumber: true })}
                onChange={handleMemberPerGroupChange}
              />
              {form.formState.errors.memberPerGroup && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.memberPerGroup.message}
                </p>
              )}
            </div>
          )}

          {/* Preview */}
          {preview && totalCaang > 0 && (
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/30 border">
              <p className="text-sm font-medium mb-2">Estimasi Hasil:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  • <span className="font-medium">{preview.groupCount}</span>{" "}
                  sub-kelompok akan dibuat
                </li>
                <li>
                  • Sekitar{" "}
                  <span className="font-medium">{preview.membersPerGroup}</span>{" "}
                  anggota per kelompok
                </li>
                {preview.remainder > 0 && (
                  <li className="text-amber-600 dark:text-amber-400">
                    • {preview.remainder} kelompok pertama akan memiliki 1
                    anggota lebih
                  </li>
                )}
              </ul>
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
            <Button type="submit" disabled={isSubmitting || totalCaang === 0}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Generate Sub-Kelompok
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
