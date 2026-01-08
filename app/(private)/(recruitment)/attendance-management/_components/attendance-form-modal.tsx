"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import {
  AttendanceStatusEnum,
  AttendanceMethodEnum,
  AttendanceMethod,
  Attendance,
} from "@/schemas/attendances";
import {
  createAttendance,
  updateAttendance,
  UserAttendanceData,
  getAttendanceStatusLabel,
} from "@/lib/firebase/services/attendance-service";

// Form Schema
const AttendanceFormSchema = z.object({
  status: AttendanceStatusEnum,
  method: AttendanceMethodEnum,
  checkedInAt: z.string().optional(), // We'll use datetime-local string format
  userNotes: z.string().optional(),
  adminNotes: z.string().optional(),
});

type AttendanceFormValues = z.infer<typeof AttendanceFormSchema>;

interface AttendanceFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: UserAttendanceData | null;
  activityId: string;
  activityOrPeriod: string;
  currentUserId: string;
  onSuccess: () => void;
}

export function AttendanceFormModal({
  open,
  onOpenChange,
  data,
  activityId,
  activityOrPeriod,
  currentUserId,
  onSuccess,
}: AttendanceFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AttendanceFormValues>({
    resolver: zodResolver(AttendanceFormSchema),
    defaultValues: {
      status: "present",
      method: "manual",
      checkedInAt: new Date().toISOString().slice(0, 16),
      userNotes: "",
      adminNotes: "",
    },
  });

  // Reset form when props change
  useEffect(() => {
    if (open && data) {
      if (data.hasAttendanceRecord) {
        // Edit mode
        reset({
          status: data.status,
          method: (data.method as AttendanceMethod) || "manual",
          checkedInAt: data.checkedInAt
            ? new Date(data.checkedInAt).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16),
          userNotes: data.userNotes || "",
          adminNotes: data.adminNotes || "",
        });
      } else {
        // Create mode (default values)
        reset({
          status: "present",
          method: "manual",
          checkedInAt: new Date().toISOString().slice(0, 16),
          userNotes: "",
          adminNotes: "",
        });
      }
    }
  }, [open, data, reset]);

  const onSubmit = async (values: AttendanceFormValues) => {
    if (!data) return;

    try {
      setIsSubmitting(true);

      const payload = {
        status: values.status,
        method: values.method,
        checkedInAt: values.checkedInAt
          ? new Date(values.checkedInAt)
          : new Date(),
        userNotes: values.userNotes,
        adminNotes: values.adminNotes,
        updatedAt: new Date(),
      };

      if (data.hasAttendanceRecord && data.attendanceId) {
        // UPDATE
        await updateAttendance(data.attendanceId, payload);
        toast.success("Data presensi berhasil diperbarui");
      } else {
        // CREATE
        const createPayload: Omit<
          Attendance,
          "id" | "createdAt" | "updatedAt" | "points"
        > = {
          activityId,
          userId: data.userId,
          orPeriod: activityOrPeriod,
          checkedInBy: currentUserId,
          status: values.status,
          method: values.method,
          userNotes: values.userNotes,
          adminNotes: values.adminNotes,
          needsApproval: false,
          ...(values.checkedInAt
            ? { checkedInAt: new Date(values.checkedInAt) }
            : {}),
        };

        await createAttendance(createPayload);
        toast.success("Presensi berhasil ditambahkan");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting attendance:", error);
      toast.error("Gagal menyimpan data presensi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEdit = data?.hasAttendanceRecord;
  const targetName = data?.userName || "User";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Presensi" : "Tambah Presensi Manual"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Ubah data kehadiran untuk ${targetName}`
              : `Input presensi manual untuk ${targetName}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status Kehadiran</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      {AttendanceStatusEnum.options.map((status) => (
                        <SelectItem key={status} value={status}>
                          {getAttendanceStatusLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && (
                <p className="text-sm text-red-500">{errors.status.message}</p>
              )}
            </div>

            {/* Method */}
            <div className="space-y-2">
              <Label htmlFor="method">Metode Absen</Label>
              <Controller
                control={control}
                name="method"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <SelectTrigger id="method">
                      <SelectValue placeholder="Pilih metode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual (Admin)</SelectItem>
                      <SelectItem value="qr_code">QR Code scan</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.method && (
                <p className="text-sm text-red-500">{errors.method.message}</p>
              )}
            </div>
          </div>

          {/* Checked In At */}
          <div className="space-y-2">
            <Label htmlFor="checkedInAt">Waktu Check-in</Label>
            <Input
              id="checkedInAt"
              type="datetime-local"
              {...register("checkedInAt")}
            />
            {errors.checkedInAt && (
              <p className="text-sm text-red-500">
                {errors.checkedInAt.message}
              </p>
            )}
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="adminNotes">Catatan Admin (Opsional)</Label>
            <Textarea
              id="adminNotes"
              placeholder="Tambahkan catatan jika perlu..."
              className="resize-none"
              {...register("adminNotes")}
            />
          </div>

          {/* User Notes */}
          <div className="space-y-2">
            <Label htmlFor="userNotes">Catatan User (Opsional)</Label>
            <Input
              id="userNotes"
              placeholder="Catatan dari user..."
              {...register("userNotes")}
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
              {isEdit ? "Simpan Perubahan" : "Simpan Presensi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
