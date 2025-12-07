"use client";

import { useEffect, useState, useMemo } from "react";
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
  selectedTask,
}: TaskDialogProps) => {
  const [loading, setLoading] = useState(false);

  const defaultValues: TaskFormValues = useMemo(
    () => ({
      activityId: "",
      orPeriod: "",
      title: "",
      description: "",
      instructions: "", // Penting: Default string kosong
      type: TaskType.INDIVIDUAL,
      groupParentId: "", // Penting: Default string kosong
      deadline: "",
      submissionTypes: [SubmissionType.FILE],
      allowedFileTypes: "",
      isScorePublished: false,
      isPublished: true,
      isVisible: true,
    }),
    []
  );

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues,
  });

  // --- PERBAIKAN LOGIC RESET (Mencegah Uncontrolled Error & Empty Fields) ---
  useEffect(() => {
    if (open) {
      if (selectedTask) {
        // Mode EDIT: Mapping data dengan sanitasi ketat (|| "")
        form.reset({
          activityId: selectedTask.activityId || "",
          orPeriod: selectedTask.orPeriod || "",
          title: selectedTask.title || "",
          description: selectedTask.description || "",
          instructions: selectedTask.instructions || "", // Fix undefined
          type: selectedTask.type,
          deadline: selectedTask.deadline
            ? format(selectedTask.deadline.toDate(), "yyyy-MM-dd'T'HH:mm")
            : "",
          submissionTypes: selectedTask.submissionTypes || [SubmissionType.FILE],
          allowedFileTypes: Array.isArray(selectedTask.allowedFileTypes)
            ? selectedTask.allowedFileTypes.join(", ")
            : "",
          isScorePublished: selectedTask.isScorePublished ?? false,
          isPublished: selectedTask.isPublished ?? true,
          isVisible: selectedTask.isVisible ?? true,
        });
      } else {
        // Mode CREATE: Reset ke default yang bersih
        form.reset(defaultValues);
      }
    }
  }, [open, selectedTask, form, defaultValues]);

  const isObservationTask = form
    .watch("submissionTypes")
    ?.includes(SubmissionType.NO_INPUT);

  const handleSubmit = async (values: TaskFormValues) => {
    if (!currentUserId) {
      toast.error("User belum terautentikasi");
      return;
    }

    setLoading(true);

    try {
      let allowedFileTypes = undefined;

      if (
        !values.submissionTypes.includes(SubmissionType.NO_INPUT) &&
        values.allowedFileTypes
      ) {
        allowedFileTypes = values.allowedFileTypes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }

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
      // setTimeout hack sering digunakan untuk transisi dialog yang lebih smooth
      setTimeout(() => onOpenChange(false), 0); 
    } catch (error) {
      console.error(error);
      toast.error(
        `Gagal menyimpan tugas: ${
          error instanceof Error ? error.message : "Terjadi kesalahan"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

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
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
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
                      <Input
                        placeholder="Latihan Sensor Ultrasonik"
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
                      Sertakan detail teknis, format file, atau referensi
                      tambahan.
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
                          {Object.values(TaskType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type === TaskType.GROUP
                                ? "Kelompok"
                                : "Individual"}
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
                      <Input
                        placeholder="Isi jika tugas untuk group tertentu"
                        {...field}
                      />
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
              <h3 className="text-lg font-semibold">
                Pengaturan Submission & Penilaian
              </h3>

              <FormField
                control={form.control}
                name="submissionTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metode Penilaian</FormLabel>
                    <div className="grid gap-2 md:grid-cols-2">
                      {/* Render Checkbox Manual agar lebih kontrol */}

                      {/* Opsi 1: File/Link/Text (Submission Based) */}
                      {[
                        SubmissionType.FILE,
                        SubmissionType.LINK,
                        SubmissionType.TEXT,
                      ].map((type) => (
                        <label
                          key={type}
                          className={`flex items-center gap-2 rounded-md border p-3 text-sm font-medium capitalize ${
                            field.value?.includes(SubmissionType.NO_INPUT)
                              ? "opacity-50 cursor-not-allowed bg-muted"
                              : ""
                          }`}
                        >
                          <Checkbox
                            checked={field.value?.includes(type)}
                            disabled={field.value?.includes(
                              SubmissionType.NO_INPUT
                            )}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...field.value, type]);
                              } else {
                                field.onChange(
                                  field.value.filter((v) => v !== type)
                                );
                              }
                            }}
                          />
                          Upload {type}
                        </label>
                      ))}

                      {/* Opsi 2: No Input (Observation Based) */}
                      <label className="flex items-center gap-2 rounded-md border p-3 text-sm font-medium capitalize bg-yellow-50/50 border-yellow-200">
                        <Checkbox
                          checked={field.value?.includes(
                            SubmissionType.NO_INPUT
                          )}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // Jika No Input dipilih, hapus tipe lain (Exclusive)
                              field.onChange([SubmissionType.NO_INPUT]);
                              // Optional: Set isVisible false by default?
                              // form.setValue("isVisible", false);
                            } else {
                              field.onChange([SubmissionType.FILE]); // Reset ke default
                            }
                          }}
                        />
                        <span className="flex flex-col">
                          <span>Observasi / Input Admin</span>
                          <span className="text-[10px] font-normal text-muted-foreground">
                            Caang tidak perlu upload apapun.
                          </span>
                        </span>
                      </label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tampilkan AllowedFileTypes HANYA jika BUKAN No Input */}
              {!isObservationTask && (
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
                        Pisahkan dengan koma. Kosongkan untuk mengizinkan semua
                        tipe.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="space-y-3">
                {/* Switch isScorePublished dll tetap sama */}
                {/* ... Paste sisa kode switch disini ... */}

                <FormField
                  control={form.control}
                  name="isVisible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Perlihatkan ke CAANG</FormLabel>
                        <FormDescription>
                          {isObservationTask
                            ? "Jika aktif: Caang bisa lihat judul penilaian ini di transkrip mereka."
                            : "Nonaktifkan jika ingin sembunyikan sementara."}
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
            </section>

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={loading || !currentUserId}
            >
              {loading
                ? "Menyimpan..."
                : selectedTask
                ? "Update Tugas"
                : "Simpan Tugas"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;
