"use client";

import { useEffect, useState, useMemo } from "react"; // Hapus useMemo karena tidak digunakan lagi
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Activity } from "@/types/activities";
import { Task } from "@/types/tasks"; // Tambah import ini
import { SubmissionType, TaskType } from "@/types/enum";
import { createTask, updateTask } from "@/lib/firebase/tasks"; // Tambah updateTask
import { Loader2, Upload } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { format } from "date-fns"; // Tambah import ini untuk format deadline

const taskSchema = z.object({
  activityId: z.string().optional(),
  orPeriod: z.string().min(2, "OR Period minimal 2 karakter"),
  title: z.string().min(5, "Judul minimal 5 karakter"),
  description: z.string().min(5, "Deskripsi minimal 5 karakter"),
  instructions: z.string().optional(),
  type: z.nativeEnum(TaskType),
  groupParentId: z.string().optional(),
  deadline: z.string().min(1, "Deadline wajib diisi"),
  submissionTypes: z
    .array(z.nativeEnum(SubmissionType))
    .min(1, "Minimal satu tipe submission"),
  allowedFileTypes: z.string().optional(),
  isScorePublished: z.boolean(),
  isPublished: z.boolean(),
  isVisible: z.boolean(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  currentUserId: string | null;
  activities: Activity[];
  selectedTask?: Task | null;
}

const TaskDialog = ({
  open,
  onOpenChange,
  onSuccess,
  currentUserId,
  activities,
  selectedTask, // Tambah selectedTask ke destructuring
}: TaskDialogProps) => {
  const [loading, setLoading] = useState(false);

  const defaultValues: TaskFormValues = useMemo(() => ({
    activityId: "",
    orPeriod: "",
    title: "",
    description: "",
    instructions: "",
    type: TaskType.INDIVIDUAL,
    groupParentId: "",
    deadline: "",
    submissionTypes: [SubmissionType.FILE],
    allowedFileTypes: "",
    isScorePublished: false,
    isPublished: true,
    isVisible: true,
  }), []);
  

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      form.reset(defaultValues);
    }
  }, [open, form]);

  const handleSubmit = async (values: TaskFormValues) => {
    if (!currentUserId) {
      toast.error("User belum terautentikasi");
      return;
    }

    setLoading(true);

    try {
      const allowedFileTypes = values.allowedFileTypes
        ? values.allowedFileTypes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
        : undefined;

      const deadlineDate = new Date(values.deadline);
      if (Number.isNaN(deadlineDate.getTime())) {
        throw new Error("Format deadline tidak valid");
      }

      const payload = {
        activityId: values.activityId || undefined,
        orPeriod: values.orPeriod,
        title: values.title,
        description: values.description,
        instructions: values.instructions || "",
        type: values.type,
        groupParentId: values.groupParentId || undefined,
        deadline: Timestamp.fromDate(deadlineDate),
        submissionTypes: values.submissionTypes,
        allowedFileTypes,
        isScorePublished: values.isScorePublished,
        isPublished: values.isPublished,
        isVisible: values.isVisible,
        updatedBy: currentUserId,
      };

      if (selectedTask) {
        // Mode edit
        await updateTask(selectedTask.id, payload);
        toast.success("Tugas berhasil diupdate");
      } else {
        // Mode create
        await createTask({
          ...payload,
          createdBy: currentUserId,
        });
        toast.success("Tugas berhasil dibuat");
      }

      onSuccess();
      setTimeout(() => onOpenChange(false), 0);
    } catch (error) {
      console.error(error);
      toast.error(
        `Gagal menyimpan tugas: ${error instanceof Error ? error.message : "Terjadi kesalahan"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTask) {
      // Mode edit: Isi form dengan data selectedTask
      form.reset({
        activityId: selectedTask.activityId || "",
        orPeriod: selectedTask.orPeriod,
        title: selectedTask.title,
        description: selectedTask.description,
        instructions: selectedTask.instructions || "",
        type: selectedTask.type,
        deadline: selectedTask.deadline ? format(selectedTask.deadline.toDate(), "yyyy-MM-dd'T'HH:mm") : "",
        submissionTypes: selectedTask.submissionTypes || [SubmissionType.FILE],
        allowedFileTypes: selectedTask.allowedFileTypes?.join(", ") || "",
        isScorePublished: selectedTask.isScorePublished,
        isPublished: selectedTask.isPublished,
        isVisible: selectedTask.isVisible,
      });
    } else {
      // Mode create: Reset ke default
      form.reset(defaultValues);
    }
  }, [selectedTask, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Tugas Baru</DialogTitle>
          <DialogDescription>
            Lengkapi informasi tugas, pengaturan submission, dan lampiran jika
            diperlukan.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Informasi Dasar</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="activityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aktivitas</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!activities.length}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih aktivitas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activities.map((activity) => (
                            <SelectItem key={activity.id} value={activity.id}>
                              {activity.title}
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
                  name="orPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OR Period</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: OR 23" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul</FormLabel>
                    <FormControl>
                      <Input placeholder="Latihan Sensor Ultrasonik" {...field} />
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
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Deskripsikan harapan dan konteks tugas..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instruksi</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Instruksi detail pengerjaan (opsional)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Sertakan detail teknis, format file, atau referensi tambahan.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Tugas</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(TaskType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type === TaskType.GROUP ? "Kelompok" : "Individual"}
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
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deadline</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="groupParentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Group Parent (opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Isi jika tugas untuk group tertentu" {...field} />
                    </FormControl>
                    <FormDescription>
                      Biarkan kosong bila tugas berlaku umum.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Pengaturan Submission</h3>

              <FormField
                control={form.control}
                name="submissionTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe Submission</FormLabel>
                    <div className="grid gap-2 md:grid-cols-3">
                      {Object.values(SubmissionType).map((type) => {
                        const checked = field.value?.includes(type);
                        return (
                          <label
                            key={type}
                            className="flex items-center gap-2 rounded-md border p-3 text-sm font-medium capitalize"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(nextChecked) => {
                                const isChecked = Boolean(nextChecked);
                                if (isChecked) {
                                  field.onChange([...(field.value || []), type]);
                                } else {
                                  field.onChange(
                                    (field.value || []).filter((item) => item !== type)
                                  );
                                }
                              }}
                            />
                            {type.toLowerCase()}
                          </label>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allowedFileTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe File Diizinkan</FormLabel>
                    <FormControl>
                      <Input placeholder=".pdf, .docx, .pptx" {...field} />
                    </FormControl>
                    <FormDescription>
                      Pisahkan dengan koma. Kosongkan untuk mengizinkan semua tipe.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="isScorePublished"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Publish Nilai</FormLabel>
                        <FormDescription>
                          Atur apakah nilai dapat dilihat peserta sejak awal.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Publish Tugas</FormLabel>
                        <FormDescription>
                          Jika nonaktif, tugas tersimpan sebagai draft.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isVisible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Perlihatkan ke CAANG</FormLabel>
                        <FormDescription>
                          Nonaktifkan jika ingin sembunyikan sementara.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={loading || !currentUserId}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {selectedTask ? "Update Tugas" : "Simpan Tugas"}
                </>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;

