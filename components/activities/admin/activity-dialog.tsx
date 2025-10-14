"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Activity } from "@/types/activities";
import {
  ActivityType,
  OrPhase,
  ActivityMode,
  TrainingCategory,
  AttendanceMethod,
} from "@/types/enum";
import { createActivity, updateActivity } from "@/lib/firebase/activities";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";

const activitySchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  type: z.nativeEnum(ActivityType),
  phase: z.nativeEnum(OrPhase),
  orPeriod: z.string().min(1, "OR Period wajib diisi"),
  category: z.nativeEnum(TrainingCategory).optional(),
  sessionNumber: z.number().optional(),
  totalSessions: z.number().optional(),
  scheduledDate: z.date(),
  endDate: z.date().optional(),
  duration: z.number().min(15, "Durasi minimal 15 menit").optional(),
  mode: z.nativeEnum(ActivityMode),
  location: z.string().optional(),
  onlineLink: z.string().url("URL tidak valid").optional().or(z.literal("")),
  picName: z.string().min(1, "PIC wajib diisi"),
  attendanceEnabled: z.boolean(),
  attendanceMethod: z.nativeEnum(AttendanceMethod),
  lateTolerance: z.number().min(0).optional(),
  isVisible: z.boolean(),
  isActive: z.boolean(),
  status: z.enum(["upcoming", "ongoing", "completed", "cancelled"]),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: Activity;
  onSuccess: () => void;
  currentUserId: string | null;
}

export default function ActivityDialog({
  open,
  onOpenChange,
  activity,
  onSuccess,
  currentUserId,
}: ActivityDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!activity;

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: "",
      description: "",
      type: ActivityType.TRAINING,
      phase: OrPhase.PELATIHAN,
      orPeriod: "OR 21",
      category: undefined,
      sessionNumber: undefined,
      totalSessions: undefined,
      scheduledDate: new Date(),
      endDate: undefined,
      duration: undefined,
      mode: ActivityMode.OFFLINE,
      location: "",
      onlineLink: "",
      picName: "",
      attendanceEnabled: true,
      attendanceMethod: AttendanceMethod.QR_CODE,
      lateTolerance: 15,
      isVisible: true,
      isActive: true,
      status: "upcoming",
    },
  });

  useEffect(() => {
    if (activity && open) {
      form.reset({
        title: activity.title,
        description: activity.description,
        type: activity.type,
        phase: activity.phase,
        orPeriod: activity.orPeriod,
        category: activity.category,
        sessionNumber: activity.sessionNumber,
        totalSessions: activity.totalSessions,
        scheduledDate: activity.scheduledDate.toDate(),
        endDate: activity.endDate?.toDate(),
        duration: activity.duration,
        mode: activity.mode,
        location: activity.location,
        onlineLink: activity.onlineLink,
        picName: activity.picName,
        attendanceEnabled: activity.attendanceEnabled,
        attendanceMethod: activity.attendanceMethod,
        lateTolerance: activity.lateTolerance,
        isVisible: activity.isVisible,
        isActive: activity.isActive,
        status: activity.status,
      });
    } else if (!open) {
      form.reset();
    }
  }, [activity, open, form]);

  const onSubmit = async (data: ActivityFormData) => {
    if (!currentUserId) {
      toast.error("User tidak terautentikasi");
      return;
    }

    setLoading(true);
    try {
      console.log("Form data:", data);

      // Build base activity data with required fields
      const activityData: Omit<Activity, "id" | "createdAt" | "updatedAt"> = {
        title: data.title,
        description: data.description,
        type: data.type,
        phase: data.phase,
        orPeriod: data.orPeriod,
        scheduledDate: Timestamp.fromDate(data.scheduledDate),
        mode: data.mode,
        picName: data.picName,
        picId: currentUserId,
        attendanceEnabled: data.attendanceEnabled,
        attendanceMethod: data.attendanceMethod,
        isVisible: data.isVisible,
        isActive: data.isActive,
        status: data.status,
        hasTask: false,
        totalParticipants: 0,
        attendedCount: 0,
        absentCount: 0,
        createdBy: currentUserId,
        // Optional fields - only add if they exist
        ...(data.category && { category: data.category }),
        ...(data.sessionNumber && { sessionNumber: data.sessionNumber }),
        ...(data.totalSessions && { totalSessions: data.totalSessions }),
        ...(data.endDate && { endDate: Timestamp.fromDate(data.endDate) }),
        ...(data.duration && { duration: data.duration }),
        ...(data.location && { location: data.location }),
        ...(data.onlineLink && { onlineLink: data.onlineLink }),
        ...(data.lateTolerance !== undefined && {
          lateTolerance: data.lateTolerance,
        }),
      };

      console.log("Activity data to save:", activityData);

      if (isEdit && activity) {
        await updateActivity(activity.id, activityData);
        toast.success("Aktivitas berhasil diupdate");
      } else {
        const newId = await createActivity(activityData);
        console.log("Created activity with ID:", newId);
        toast.success("Aktivitas berhasil dibuat");
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error saving activity:", error);
      toast.error(
        `Gagal menyimpan aktivitas: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedType = form.watch("type");
  const selectedMode = form.watch("mode");
  const attendanceEnabled = form.watch("attendanceEnabled");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Aktivitas" : "Buat Aktivitas Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Ubah informasi aktivitas"
              : "Buat aktivitas baru untuk calon anggota"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informasi Dasar</h3>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul Aktivitas*</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Pelatihan Sensor Ultrasonik"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi*</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Deskripsi aktivitas..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Aktivitas*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ActivityType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fase*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(OrPhase).map((phase) => (
                            <SelectItem key={phase} value={phase}>
                              {phase.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="orPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OR Period*</FormLabel>
                    <FormControl>
                      <Input placeholder="OR 21" {...field} />
                    </FormControl>
                    <FormDescription>
                      Contoh: OR 21, OR 22, dst.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="picName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama PIC*</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama Penanggung Jawab" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Training Specific Fields */}
              {selectedType === ActivityType.TRAINING && (
                <>
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategori Pelatihan</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(TrainingCategory).map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sessionNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sesi Ke-</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="1"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(
                                  val === "" ? undefined : parseInt(val)
                                );
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="totalSessions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Sesi</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="3"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(
                                  val === "" ? undefined : parseInt(val)
                                );
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Jadwal</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tanggal Mulai*</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value
                                ? format(field.value, "PPP")
                                : "Pilih tanggal"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durasi (menit)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="120"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(
                              val === "" ? undefined : parseInt(val)
                            );
                          }}
                        />
                      </FormControl>
                      <FormDescription>Minimal 15 menit</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Mode & Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Mode & Lokasi</h3>

              <FormField
                control={form.control}
                name="mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ActivityMode).map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {mode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedMode === "offline" && (
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lokasi</FormLabel>
                      <FormControl>
                        <Input placeholder="Workshop UKM Robotik" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedMode === "online" && (
                <FormField
                  control={form.control}
                  name="onlineLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link Online</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://meet.google.com/..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Attendance */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Absensi</h3>

              <FormField
                control={form.control}
                name="attendanceEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Aktifkan Absensi
                      </FormLabel>
                      <FormDescription>
                        Calon anggota harus melakukan absensi
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {attendanceEnabled && (
                <>
                  <FormField
                    control={form.control}
                    name="attendanceMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Metode Absensi*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="qr_code">QR Code</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lateTolerance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Toleransi Keterlambatan (menit)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="15"
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(
                                val === "" ? undefined : parseInt(val)
                              );
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Toleransi keterlambatan sebelum dianggap terlambat
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Status & Visibilitas</h3>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="upcoming">Akan Datang</SelectItem>
                        <SelectItem value="ongoing">Berlangsung</SelectItem>
                        <SelectItem value="completed">Selesai</SelectItem>
                        <SelectItem value="cancelled">Dibatalkan</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isVisible"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Visible untuk CAANG
                      </FormLabel>
                      <FormDescription>
                        Aktivitas terlihat di dashboard CAANG
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Aktif</FormLabel>
                      <FormDescription>
                        CAANG bisa akses & absen aktivitas ini
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
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
                {isEdit ? "Update" : "Buat"} Aktivitas
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
