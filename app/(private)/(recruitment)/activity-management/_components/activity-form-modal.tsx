"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  ActivityFormSchema,
  ActivityFormValues,
} from "@/schemas/activities";
import {
  createActivity,
  updateActivity,
  activityToFormValues,
  parseFormDateTime,
} from "@/lib/firebase/services/activity-service";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import {
  Loader2,
  CalendarPlus,
  Edit,
  MapPin,
  Link as LinkIcon,
  Clock,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// =========================================================
// TYPES
// =========================================================

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity?: Activity | null; // null = create mode, Activity = edit mode
  onSuccess: () => void;
}

// =========================================================
// MAIN COMPONENT
// =========================================================

export function ActivityFormModal({
  isOpen,
  onClose,
  activity,
  onSuccess,
}: ActivityFormModalProps) {
  const { user } = useDashboard();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!activity;

  // Form setup with Zod validation
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(ActivityFormSchema),
    defaultValues: {
      title: "",
      description: "",
      orPeriod: "",
      startDate: "",
      startTime: "08:00",
      endDate: "",
      endTime: "17:00",
      mode: "offline",
      location: "",
      onlineLink: "",
      attendanceEnabled: false,
      lateTolerance: 15,
      status: "upcoming",
    },
  });

  // Watch mode for conditional fields
  const selectedMode = watch("mode");

  // Reset form when modal opens/closes or activity changes
  useEffect(() => {
    if (isOpen) {
      if (activity) {
        // Edit mode: populate form with activity data
        const formValues = activityToFormValues(activity);
        reset(formValues);
      } else {
        // Create mode: reset to defaults
        const today = new Date().toISOString().split("T")[0];
        reset({
          title: "",
          description: "",
          orPeriod: "",
          startDate: today,
          startTime: "08:00",
          endDate: today,
          endTime: "17:00",
          mode: "offline",
          location: "",
          onlineLink: "",
          attendanceEnabled: false,
          lateTolerance: 15,
          status: "upcoming",
        });
      }
    }
  }, [isOpen, activity, reset]);

  // Handle form submission
  const onSubmit = async (data: ActivityFormValues) => {
    if (!user?.uid) {
      toast.error("User tidak terautentikasi");
      return;
    }

    setIsSubmitting(true);

    try {
      const startDateTime = parseFormDateTime(data.startDate, data.startTime);
      const endDateTime = parseFormDateTime(data.endDate, data.endTime);

      // Validate dates
      if (endDateTime <= startDateTime) {
        toast.error("Waktu selesai harus setelah waktu mulai");
        setIsSubmitting(false);
        return;
      }

      if (isEditMode && activity) {
        // Update existing activity
        const result = await updateActivity({
          id: activity.id,
          title: data.title,
          description: data.description,
          orPeriod: data.orPeriod,
          startDateTime,
          endDateTime,
          mode: data.mode,
          location: data.location,
          onlineLink: data.onlineLink,
          attendanceEnabled: data.attendanceEnabled,
          lateTolerance: data.lateTolerance,
          status: data.status,
        });

        if (result.success) {
          toast.success("Aktivitas berhasil diupdate");
          onSuccess();
          onClose();
        } else {
          toast.error(result.error || "Gagal mengupdate aktivitas");
        }
      } else {
        // Create new activity
        const result = await createActivity({
          type: "recruitment",
          title: data.title,
          description: data.description,
          orPeriod: data.orPeriod,
          startDateTime,
          endDateTime,
          mode: data.mode,
          location: data.location,
          onlineLink: data.onlineLink,
          attendanceEnabled: data.attendanceEnabled,
          lateTolerance: data.lateTolerance,
          status: data.status,
          createdBy: user.uid,
        });

        if (result.success) {
          toast.success("Aktivitas berhasil dibuat");
          onSuccess();
          onClose();
        } else {
          toast.error(result.error || "Gagal membuat aktivitas");
        }
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader className="pb-4 border-b border-slate-200 dark:border-slate-800">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100">
            {isEditMode ? (
              <>
                <Edit className="w-5 h-5 text-blue-600" />
                Edit Aktivitas
              </>
            ) : (
              <>
                <CalendarPlus className="w-5 h-5 text-blue-600" />
                Buat Aktivitas Baru
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            {isEditMode
              ? "Ubah detail aktivitas recruitment yang sudah ada"
              : "Isi form berikut untuk membuat aktivitas recruitment baru"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Informasi Dasar
            </h3>

            {/* Title */}
            <div className="space-y-2">
              <Label
                htmlFor="title"
                className="text-slate-700 dark:text-slate-300"
              >
                Judul Aktivitas <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Contoh: Wawancara Tahap 1"
                {...register("title")}
                className={cn(
                  "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
                  errors.title && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-slate-700 dark:text-slate-300"
              >
                Deskripsi
              </Label>
              <Textarea
                id="description"
                placeholder="Deskripsi singkat tentang aktivitas ini..."
                rows={3}
                {...register("description")}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 resize-none"
              />
            </div>

            {/* OR Period */}
            <div className="space-y-2">
              <Label
                htmlFor="orPeriod"
                className="text-slate-700 dark:text-slate-300"
              >
                Periode OR
              </Label>
              <Input
                id="orPeriod"
                placeholder="Contoh: 2024/2025"
                {...register("orPeriod")}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          {/* Schedule Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Jadwal
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label
                  htmlFor="startDate"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Tanggal Mulai <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register("startDate")}
                  className={cn(
                    "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
                    errors.startDate && "border-red-500"
                  )}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              {/* Start Time */}
              <div className="space-y-2">
                <Label
                  htmlFor="startTime"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Jam Mulai <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  {...register("startTime")}
                  className={cn(
                    "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
                    errors.startTime && "border-red-500"
                  )}
                />
                {errors.startTime && (
                  <p className="text-sm text-red-500">
                    {errors.startTime.message}
                  </p>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label
                  htmlFor="endDate"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Tanggal Selesai <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register("endDate")}
                  className={cn(
                    "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
                    errors.endDate && "border-red-500"
                  )}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-500">
                    {errors.endDate.message}
                  </p>
                )}
              </div>

              {/* End Time */}
              <div className="space-y-2">
                <Label
                  htmlFor="endTime"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Jam Selesai <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  {...register("endTime")}
                  className={cn(
                    "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
                    errors.endTime && "border-red-500"
                  )}
                />
                {errors.endTime && (
                  <p className="text-sm text-red-500">
                    {errors.endTime.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Lokasi & Mode
            </h3>

            {/* Mode */}
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">
                Mode Pelaksanaan <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch("mode")}
                onValueChange={(value: "online" | "offline" | "hybrid") =>
                  setValue("mode", value)
                }
              >
                <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Pilih mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offline">Offline (Luring)</SelectItem>
                  <SelectItem value="online">Online (Daring)</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location - shown for offline/hybrid */}
            {(selectedMode === "offline" || selectedMode === "hybrid") && (
              <div className="space-y-2">
                <Label
                  htmlFor="location"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Lokasi / Ruangan
                </Label>
                <Input
                  id="location"
                  placeholder="Contoh: Ruang Robotik Lt. 2"
                  {...register("location")}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>
            )}

            {/* Online Link - shown for online/hybrid */}
            {(selectedMode === "online" || selectedMode === "hybrid") && (
              <div className="space-y-2">
                <Label
                  htmlFor="onlineLink"
                  className="text-slate-700 dark:text-slate-300 flex items-center gap-1"
                >
                  <LinkIcon className="w-3 h-3" />
                  Link Meeting
                </Label>
                <Input
                  id="onlineLink"
                  type="url"
                  placeholder="https://meet.google.com/..."
                  {...register("onlineLink")}
                  className={cn(
                    "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
                    errors.onlineLink && "border-red-500"
                  )}
                />
                {errors.onlineLink && (
                  <p className="text-sm text-red-500">
                    {errors.onlineLink.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Attendance Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4" />
              Presensi
            </h3>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="space-y-0.5">
                <Label className="text-slate-700 dark:text-slate-300 font-medium">
                  Aktifkan Presensi
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Peserta dapat melakukan presensi online
                </p>
              </div>
              <Switch
                checked={watch("attendanceEnabled")}
                onCheckedChange={(checked) =>
                  setValue("attendanceEnabled", checked)
                }
              />
            </div>

            {watch("attendanceEnabled") && (
              <div className="space-y-2">
                <Label
                  htmlFor="lateTolerance"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Toleransi Keterlambatan (menit)
                </Label>
                <Input
                  id="lateTolerance"
                  type="number"
                  min={0}
                  max={60}
                  {...register("lateTolerance", { valueAsNumber: true })}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 w-32"
                />
              </div>
            )}
          </div>

          {/* Status Section (Edit mode only) */}
          {isEditMode && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Status
              </h3>
              <Select
                value={watch("status")}
                onValueChange={(
                  value: "upcoming" | "ongoing" | "completed" | "cancelled"
                ) => setValue("status", value)}
              >
                <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Akan Datang</SelectItem>
                  <SelectItem value="ongoing">Berlangsung</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-slate-200 dark:border-slate-700"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditMode ? "Menyimpan..." : "Membuat..."}
                </>
              ) : isEditMode ? (
                "Simpan Perubahan"
              ) : (
                "Buat Aktivitas"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
