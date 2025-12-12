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
import { Loader2, Upload, X } from "lucide-react";
import { Material } from "@/types/materials";
import { Activity } from "@/types/activities";
import { createMaterial, updateMaterial, uploadMaterialFile, deleteMaterialFile } from "@/lib/firebase/materials";
import { toast } from "sonner";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
];

const materialSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter"),
  description: z.string().optional(),
  orPeriod: z.string().min(1, "OR Period wajib diisi"),
  activityId: z.string().optional(),
  isPublic: z.boolean(),
  requiredActivityId: z.string().optional(),
  file: z
    .any()
    .refine(() => {
      // If editing and no new file, skip validation
      return true;
    })
    .optional(),
});

type MaterialFormData = z.infer<typeof materialSchema>;

interface MaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: Material;
  onSuccess: () => void;
  currentUserId: string | null;
  activities: Activity[];
}

export default function MaterialDialog({
  open,
  onOpenChange,
  material,
  onSuccess,
  currentUserId,
  activities,
}: MaterialDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");
  const isEdit = !!material;

  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      title: "",
      description: "",
      orPeriod: "OR 21",
      activityId: "none",
      isPublic: true,
      requiredActivityId: "none",
    },
  });

  useEffect(() => {
    if (material && open) {
      form.reset({
        title: material.title,
        description: material.description || "",
        orPeriod: material.orPeriod,
        activityId: material.activityId || "none",
        isPublic: material.isPublic,
        requiredActivityId: material.requiredActivityId || "none",
      });
      setSelectedFile(null);
      setFileError("");
    } else if (!open) {
      form.reset();
      setSelectedFile(null);
      setFileError("");
      setUploadProgress(0);
    }
  }, [material, open, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError("Ukuran file maksimal 50MB");
      setSelectedFile(null);
      return;
    }

    // Validate file type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setFileError(
        "Tipe file tidak didukung. Hanya PDF, PPT, Word, dan gambar yang diizinkan."
      );
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const onSubmit = async (data: MaterialFormData) => {
    if (!currentUserId) {
      toast.error("User tidak terautentikasi");
      return;
    }

    // Validate file for new material
    if (!isEdit && !selectedFile) {
      setFileError("File wajib diupload");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      let fileUrl = material?.fileUrl || "";
      let fileName = material?.fileName || "";
      let fileSize = material?.fileSize || 0;
      let fileType = material?.fileType || "";

      // Upload new file if selected
      if (selectedFile) {
        setUploadProgress(10);

        // Delete old file if editing
        if (isEdit && material?.fileUrl) {
          try {
            await deleteMaterialFile(material.fileUrl);
          } catch (e) {
            console.error("Error deleting old file:", e);
            // Continue even if delete fails
          }
        }

        setUploadProgress(30);

        // Upload new file
        const uploadResult = await uploadMaterialFile(selectedFile, (progress) => {
          setUploadProgress(30 + progress * 0.6); // 30-90%
        });

        fileUrl = uploadResult.url;
        fileName = selectedFile.name;
        fileSize = selectedFile.size;
        fileType = selectedFile.type;
      }

      setUploadProgress(90);

      // Build material data
      const materialData: Omit<Material, "id" | "createdAt" | "updatedAt" | "downloadCount" | "openCount"> = {
        title: data.title,
        description: data.description || "",
        orPeriod: data.orPeriod,
        fileUrl,
        fileName,
        fileSize,
        fileType,
        isPublic: data.isPublic,
        uploadedBy: currentUserId,
        ...(data.activityId &&
          data.activityId !== "none" && { activityId: data.activityId }),
        ...(data.requiredActivityId &&
          data.requiredActivityId !== "none" && {
          requiredActivityId: data.requiredActivityId,
        }),
      };

      if (isEdit && material) {
        await updateMaterial(material.id, materialData);
        toast.success("Materi berhasil diupdate");
      } else {
        await createMaterial(materialData);
        toast.success("Materi berhasil diupload");
      }

      setUploadProgress(100);
      onSuccess();
      onOpenChange(false);
      form.reset();
      setSelectedFile(null);
    } catch (error) {
      console.error("Error saving material:", error);
      toast.error(
        `Gagal menyimpan materi: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const isPublic = form.watch("isPublic");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Materi" : "Upload Materi Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Ubah informasi materi pembelajaran"
              : "Upload materi pembelajaran baru untuk calon anggota"}
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
                      Judul Materi<span className="text-red-500"> *</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Pengenalan Sensor Ultrasonik"
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
                        placeholder="Deskripsi materi..."
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
                  name="orPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        OR Period<span className="text-red-500"> *</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="OR 21" {...field} />
                      </FormControl>
                      <FormDescription>Contoh: OR 21, OR 22</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">File Materi</h3>

              <div className="space-y-2">
                <FormLabel>
                  Upload File
                  {!isEdit && <span className="text-red-500"> *</span>}
                </FormLabel>
                <div className="flex items-center gap-4">
                  <label className="flex-1">
                    <div className="flex items-center justify-center w-full h-32 px-4 transition bg-transparent border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none dark:bg-input/30">
                      <div className="flex flex-col items-center space-y-2">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {selectedFile
                            ? selectedFile.name
                            : isEdit && material
                              ? material.fileName
                              : "Klik untuk upload file"}
                        </span>
                        <span className="text-xs text-gray-500">
                          PDF, PPT, Word, atau Image (Max 50MB)
                        </span>
                      </div>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.webp"
                      onChange={handleFileChange}
                      disabled={loading}
                    />
                  </label>
                  {selectedFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setFileError("");
                      }}
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {fileError && (
                  <p className="text-sm text-red-500">{fileError}</p>
                )}
                {loading && uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600">
                      Uploading... {Math.round(uploadProgress)}%
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Link */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Link ke Aktivitas</h3>

              <FormField
                control={form.control}
                name="activityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aktivitas (Opsional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih aktivitas" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Tidak ada</SelectItem>
                        {activities.map((activity) => (
                          <SelectItem key={activity.id} value={activity.id}>
                            {activity.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Link materi ke aktivitas tertentu (opsional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Access Control */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Kontrol Akses</h3>

              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Akses Public
                      </FormLabel>
                      <FormDescription>
                        Semua user bisa mengakses materi ini
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

              {!isPublic && (
                <FormField
                  control={form.control}
                  name="requiredActivityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aktivitas yang Diperlukan</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih aktivitas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Tidak ada</SelectItem>
                          {activities.map((activity) => (
                            <SelectItem key={activity.id} value={activity.id}>
                              {activity.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        User harus menghadiri aktivitas ini untuk akses materi
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
                {isEdit ? "Update" : "Upload"} Materi
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
