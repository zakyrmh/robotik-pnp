"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Activity, ActivityType } from "@/types/activities";
import { ActivityMode } from "@/types/enum";
import { createActivity, getActivities, updateActivity } from "@/lib/firebase/activities";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import slugify from "slugify";

// 1. Ubah Schema menjadi fungsi dinamis berdasarkan tipe aktivitas
const getActivitySchema = (type: ActivityType) => z.object({
  title: z.string().min(5, "Judul minimal 5 karakter"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  // Validasi orPeriod hanya wajib jika tipe recruitment
  orPeriod: type === 'recruitment' 
    ? z.string().min(1, "OR Period wajib diisi") 
    : z.string().optional(),
  startDateTime: z.date(),
  endDateTime: z.date(),
  mode: z.nativeEnum(ActivityMode),
  location: z.string().optional(),
  onlineLink: z.string().url("URL tidak valid").optional().or(z.literal("")),
  attendanceEnabled: z.boolean(),
  attendanceOpenTime: z.date().optional(),
  attendanceCloseTime: z.date().optional(),
  lateTolerance: z.number().min(0).optional(),
  isVisible: z.boolean(),
  isActive: z.boolean(),
  status: z.enum(["upcoming", "ongoing", "completed", "cancelled"]),
});

type ActivityFormData = z.infer<ReturnType<typeof getActivitySchema>>;

interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: Activity;
  onSuccess: () => void;
  currentUserId: string | null;
  // 2. Tambahkan prop defaultType
  defaultType?: ActivityType; 
}

export default function ActivityDialog({
  open,
  onOpenChange,
  activity,
  onSuccess,
  currentUserId,
  defaultType = 'recruitment', // Default fallback
}: ActivityDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!activity;

  // Gunakan schema yang sesuai dengan defaultType
  const schema = useMemo(() => getActivitySchema(defaultType), [defaultType]);

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      // Reset orPeriod jika internal, set default jika recruitment
      orPeriod: defaultType === 'recruitment' ? "OR 21" : "", 
      startDateTime: new Date(),
      endDateTime: new Date(),
      mode: ActivityMode.OFFLINE,
      location: "",
      onlineLink: "",
      attendanceEnabled: true,
      attendanceOpenTime: undefined,
      attendanceCloseTime: undefined,
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
        orPeriod: activity.orPeriod || "",
        startDateTime: activity.startDateTime.toDate(),
        endDateTime: activity.endDateTime.toDate(),
        mode: activity.mode,
        location: activity.location || "",
        onlineLink: activity.onlineLink || "",
        attendanceEnabled: activity.attendanceEnabled,
        attendanceOpenTime: activity.attendanceOpenTime?.toDate(),
        attendanceCloseTime: activity.attendanceCloseTime?.toDate(),
        lateTolerance: activity.lateTolerance,
        isVisible: activity.isVisible,
        isActive: activity.isActive,
        status: activity.status,
      });
    } else if (!open) {
      form.reset({
         ...form.getValues(), // Keep current values structure
         title: "",
         description: "",
         // Reset conditional default value
         orPeriod: defaultType === 'recruitment' ? "OR 21" : "",
         status: "upcoming",
         startDateTime: new Date(),
         endDateTime: new Date()
      });
    }
  }, [activity, open, form, defaultType]);

  const onSubmit = async (data: ActivityFormData) => {
    if (!currentUserId) {
      toast.error("User tidak terautentikasi");
      return;
    }

    setLoading(true);
    try {
      console.log("Form data:", data);

      let slug = slugify(data.title, {
        lower: true,
        strict: true,
      });

      // Cek slug unik (bisa dioptimasi nanti dengan query specific slug)
      // Saat ini mengambil semua status untuk cek duplikasi
      const activities = await getActivities({ status: "all" });
      const existingSlugs = activities
        .filter(a => a.id !== activity?.id) // Exclude current activity if edit
        .map((activity) => activity.slug);
        
      const slugExists = existingSlugs.includes(slug);

      if (slugExists) {
        let counter = 1;
        let newSlug = slug;
        while (existingSlugs.includes(newSlug)) {
          newSlug = `${slug}-${counter}`;
          counter++;
        }
        slug = newSlug;
      }

      // Build base activity data with required fields
      const activityData: Omit<Activity, "id" | "createdAt" | "updatedAt"> = {
        title: data.title,
        slug: slug,
        // 3. Pastikan type tersimpan
        type: defaultType, 
        description: data.description,
        // Simpan orPeriod hanya jika recruitment, jika internal kirim undefined/null
        orPeriod: defaultType === 'recruitment' ? data.orPeriod : undefined,
        
        startDateTime: Timestamp.fromDate(data.startDateTime),
        endDateTime: Timestamp.fromDate(data.endDateTime),
        mode: data.mode,
        attendanceEnabled: data.attendanceEnabled,
        isVisible: data.isVisible,
        isActive: data.isActive,
        status: data.status,
        createdBy: currentUserId,
        
        // Optional fields - only add if they exist
        ...(data.location && { location: data.location }),
        ...(data.onlineLink && { onlineLink: data.onlineLink }),
        ...(data.attendanceOpenTime && {
          attendanceOpenTime: Timestamp.fromDate(data.attendanceOpenTime),
        }),
        ...(data.attendanceCloseTime && {
          attendanceCloseTime: Timestamp.fromDate(data.attendanceCloseTime),
        }),
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

  const selectedMode = form.watch("mode");
  const attendanceEnabled = form.watch("attendanceEnabled");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Aktivitas" : `Buat Aktivitas ${defaultType === 'recruitment' ? 'Seleksi' : 'Internal'}`}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Ubah informasi aktivitas"
              : defaultType === 'recruitment' 
                  ? "Buat jadwal seleksi atau wawancara untuk calon anggota"
                  : "Buat jadwal rapat atau event untuk anggota"}
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
                    <FormLabel>
                      Judul Aktivitas<span className="text-red-500"> *</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={defaultType === 'recruitment' ? "Wawancara Tahap 1" : "Rapat Pleno Komdis"}
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
                    <FormLabel>
                      Deskripsi<span className="text-red-500"> *</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Deskripsi detail aktivitas..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 4. Conditional Rendering untuk OR Period */}
              {defaultType === 'recruitment' && (
                <FormField
                  control={form.control}
                  name="orPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        OR Period<span className="text-red-500"> *</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="OR 21" {...field} />
                      </FormControl>
                      <FormDescription>
                        Tandai aktivitas ini untuk angkatan OR tertentu.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Jadwal</h3>

              <div className="grid grid-cols-2 gap-4">
                {/* START DATETIME */}
                <FormField
                  control={form.control}
                  name="startDateTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-2">
                      <FormLabel>
                        Mulai
                        <span className="text-red-500"> *</span>
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value
                                ? format(field.value, "dd MMM yyyy, HH:mm")
                                : "Pilih tanggal & waktu"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-4 space-y-2">
                          <Calendar
                            mode="single"
                            selected={field.value ?? undefined}
                            onSelect={(date) => {
                              if (!date) return;
                              const current = field.value ?? new Date();
                              date.setHours(
                                current.getHours(),
                                current.getMinutes()
                              );
                              field.onChange(date);
                            }}
                            initialFocus
                          />
                          <input
                            type="time"
                            className="border rounded-md p-2 w-full"
                            value={
                              field.value
                                ? `${String(field.value.getHours()).padStart(
                                    2,
                                    "0"
                                  )}:${String(
                                    field.value.getMinutes()
                                  ).padStart(2, "0")}`
                                : ""
                            }
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value
                                .split(":")
                                .map(Number);
                              const newDate = field.value ?? new Date();
                              newDate.setHours(hours, minutes);
                              field.onChange(newDate);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* END DATETIME */}
                <FormField
                  control={form.control}
                  name="endDateTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-2">
                      <FormLabel>
                        Selesai
                        <span className="text-red-500"> *</span>
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value
                                ? format(field.value, "dd MMM yyyy, HH:mm")
                                : "Pilih tanggal & waktu"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-4 space-y-2">
                          <Calendar
                            mode="single"
                            selected={field.value ?? undefined}
                            onSelect={(date) => {
                              if (!date) return;
                              const current = field.value ?? new Date();
                              date.setHours(
                                current.getHours(),
                                current.getMinutes()
                              );
                              field.onChange(date);
                            }}
                            initialFocus
                          />
                          <input
                            type="time"
                            className="border rounded-md p-2 w-full"
                            value={
                              field.value
                                ? `${String(field.value.getHours()).padStart(
                                    2,
                                    "0"
                                  )}:${String(
                                    field.value.getMinutes()
                                  ).padStart(2, "0")}`
                                : ""
                            }
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value
                                .split(":")
                                .map(Number);
                              const newDate = field.value ?? new Date();
                              newDate.setHours(hours, minutes);
                              field.onChange(newDate);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Mode & Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Mode & Lokasi</h3>

              <div className="flex justify-between items-center gap-4">
                <FormField
                  control={form.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem className="w-1/3">
                      <FormLabel>
                        Mode<span className="text-red-500"> *</span>
                      </FormLabel>
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

                <div className="flex-1">
                  {selectedMode === "offline" && (
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lokasi</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Workshop UKM Robotik"
                              {...field}
                            />
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
              </div>
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
                        {defaultType === 'recruitment' 
                           ? "Calon anggota wajib melakukan absensi"
                           : "Anggota wajib melakukan absensi"}
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
                  <div className="grid grid-cols-2 gap-4">
                    {/* ATTENDANCE OPEN TIME */}
                    <FormField
                      control={form.control}
                      name="attendanceOpenTime"
                      render={({ field }) => (
                        <FormItem className="flex flex-col space-y-2">
                          <FormLabel>Buka Absensi</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value
                                    ? format(field.value, "dd MMM yyyy, HH:mm")
                                    : "Pilih tanggal & waktu"}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-4 space-y-2">
                              <Calendar
                                mode="single"
                                selected={field.value ?? undefined}
                                onSelect={(date) => {
                                  if (!date) return;
                                  const current = field.value ?? new Date();
                                  date.setHours(
                                    current.getHours(),
                                    current.getMinutes()
                                  );
                                  field.onChange(date);
                                }}
                                initialFocus
                              />
                              <input
                                type="time"
                                className="border rounded-md p-2 w-full"
                                value={
                                  field.value
                                    ? `${String(
                                        field.value.getHours()
                                      ).padStart(2, "0")}:${String(
                                        field.value.getMinutes()
                                      ).padStart(2, "0")}`
                                    : ""
                                }
                                onChange={(e) => {
                                  const [hours, minutes] = e.target.value
                                    .split(":")
                                    .map(Number);
                                  const newDate = field.value ?? new Date();
                                  newDate.setHours(hours, minutes);
                                  field.onChange(newDate);
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Waktu mulai bisa absen
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* ATTENDANCE CLOSE TIME */}
                    <FormField
                      control={form.control}
                      name="attendanceCloseTime"
                      render={({ field }) => (
                        <FormItem className="flex flex-col space-y-2">
                          <FormLabel>Tutup Absensi</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value
                                    ? format(field.value, "dd MMM yyyy, HH:mm")
                                    : "Pilih tanggal & waktu"}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-4 space-y-2">
                              <Calendar
                                mode="single"
                                selected={field.value ?? undefined}
                                onSelect={(date) => {
                                  if (!date) return;
                                  const current = field.value ?? new Date();
                                  date.setHours(
                                    current.getHours(),
                                    current.getMinutes()
                                  );
                                  field.onChange(date);
                                }}
                                initialFocus
                              />
                              <input
                                type="time"
                                className="border rounded-md p-2 w-full"
                                value={
                                  field.value
                                    ? `${String(
                                        field.value.getHours()
                                      ).padStart(2, "0")}:${String(
                                        field.value.getMinutes()
                                      ).padStart(2, "0")}`
                                    : ""
                                }
                                onChange={(e) => {
                                  const [hours, minutes] = e.target.value
                                    .split(":")
                                    .map(Number);
                                  const newDate = field.value ?? new Date();
                                  newDate.setHours(hours, minutes);
                                  field.onChange(newDate);
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Waktu absensi ditutup
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Status<span className="text-red-500"> *</span>
                      </FormLabel>
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

                <div className="space-y-2">
                   <FormField
                    control={form.control}
                    name="isVisible"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">
                            Visible
                          </FormLabel>
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
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Aktif</FormLabel>
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
              </div>
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