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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { Task } from "@/schemas/tasks";
import { createTask, updateTask } from "@/lib/firebase/services/task-service";
import { useAuth } from "@/hooks/useAuth";

// Form Schema based on TaskSchema but adapted for form inputs
// We exclude system fields like id, createdAt, etc. AND deadline (to override type)
const formSchema = z.object({
  title: z.string().min(3, "Judul tugas minimal 3 karakter"),
  description: z.string().optional(),
  orPeriod: z.string().optional(),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date",
  }),
  submissionType: z.enum(["file", "link", "text", "none"]),
  taskType: z.enum(["individual", "group"]),
  maxPoints: z.number().min(0),
  isVisible: z.boolean(),
  status: z.enum(["draft", "published", "archived"]),
});

type FormValues = z.infer<typeof formSchema>;

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null; // If present, entering Edit Mode
  onSuccess: () => void;
}

export function TaskFormModal({
  open,
  onOpenChange,
  task,
  onSuccess,
}: TaskFormModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      orPeriod: "", // Optional
      deadline: new Date().toISOString().slice(0, 16), // Default now
      submissionType: "file",
      taskType: "individual",
      maxPoints: 100,
      isVisible: true,
      status: "draft",
    },
  });

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      // Format date for datetime-local: YYYY-MM-DDTHH:mm
      let deadlineStr = "";
      if (task.deadline) {
        const d = new Date(task.deadline);
        // Adjust to local time string ISO format (rough)
        // Or better:
        const pad = (n: number) => n.toString().padStart(2, "0");
        deadlineStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
          d.getDate()
        )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }

      form.reset({
        title: task.title,
        description: task.description || "",
        orPeriod: task.orPeriod || "",
        deadline: deadlineStr,
        submissionType: task.submissionType,
        taskType: task.taskType,
        maxPoints: task.maxPoints,
        isVisible: task.isVisible,
        status: task.status,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        orPeriod: "",
        deadline: new Date().toISOString().slice(0, 16),
        submissionType: "file",
        taskType: "individual",
        maxPoints: 100,
        isVisible: true,
        status: "draft",
      });
    }
  }, [task, form, open]);

  const onSubmit = async (values: FormValues) => {
    if (!user?.uid) {
      toast.error("User not authenticated");
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert string date back to Date object
      const payload = {
        ...values,
        description: values.description || "",
        deadline: new Date(values.deadline),
      };

      if (task) {
        // Edit Mode
        await updateTask(task.id, payload);
        toast.success("Tugas berhasil diperbarui");
      } else {
        // Create Mode
        await createTask({
          ...payload,
          createdBy: user.uid,
        });
        toast.success("Tugas baru berhasil dibuat");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting task:", error);
      toast.error("Gagal menyimpan tugas");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Tugas" : "Buat Tugas Baru"}</DialogTitle>
          <DialogDescription>
            Isi informasi detail mengenai tugas atau aktivitas rekrutmen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Judul Tugas</Label>
            <Input
              id="title"
              placeholder="Contoh: Membuat Line Follower Analog"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              placeholder="Jelaskan detail tugas..."
              className="resize-none h-24"
              {...form.register("description")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="datetime-local"
                {...form.register("deadline")}
              />
              {form.formState.errors.deadline && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.deadline.message}
                </p>
              )}
            </div>

            {/* OR Period */}
            <div className="space-y-2">
              <Label htmlFor="orPeriod">Periode OR (Opsional)</Label>
              <Input
                id="orPeriod"
                placeholder="Contoh: OR 21"
                {...form.register("orPeriod")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Submission Type */}
            <div className="space-y-2">
              <Label>Tipe Pengumpulan</Label>
              <Controller
                control={form.control}
                name="submissionType"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="file">Upload File</SelectItem>
                      <SelectItem value="link">Link Langsung</SelectItem>
                      <SelectItem value="text">Input Text</SelectItem>
                      <SelectItem value="none">
                        Tanpa Pengumpulan (Manual)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Task Type */}
            <div className="space-y-2">
              <Label>Tipe Tugas</Label>
              <Controller
                control={form.control}
                name="taskType"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individu</SelectItem>
                      <SelectItem value="group">Kelompok</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Max Points */}
            <div className="space-y-2">
              <Label htmlFor="maxPoints">Poin Maksimal</Label>
              <Input
                id="maxPoints"
                type="number"
                min={0}
                {...form.register("maxPoints", { valueAsNumber: true })}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">
                        Terbit (Published)
                      </SelectItem>
                      <SelectItem value="archived">Diarsipkan</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Visibility Switch */}
          <div className="flex items-center space-x-2 pt-2">
            <Controller
              control={form.control}
              name="isVisible"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id="isVisible"
                />
              )}
            />
            <Label htmlFor="isVisible">Tampilkan ke Peserta (Visible)</Label>
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
              {task ? "Simpan Perubahan" : "Buat Tugas"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
