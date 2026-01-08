"use client";

import { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Upload,
  X,
  FileText,
  Link as LinkIcon,
  BookOpen,
} from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

import { Material, MaterialType } from "@/schemas/materials";
import {
  createMaterial,
  updateMaterial,
  uploadMaterialFile,
} from "@/lib/firebase/services/material-service";
import { useAuth } from "@/hooks/useAuth";

// Form Schema
const formSchema = z.object({
  title: z.string().min(3, "Judul materi minimal 3 karakter"),
  description: z.string().optional(),
  orPeriod: z.string().min(1, "Periode OR wajib diisi"),
  type: z.enum(["file", "link", "article"]),
  // Conditional fields
  externalUrl: z.string().url("URL tidak valid").optional().or(z.literal("")),
  articleContent: z.string().optional(),
  // Settings
  isVisible: z.boolean(),
  isDownloadable: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface MaterialFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: Material | null;
  onSuccess: () => void;
}

export function MaterialFormModal({
  open,
  onOpenChange,
  material,
  onSuccess,
}: MaterialFormModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingFileInfo, setExistingFileInfo] = useState<{
    fileName: string;
    fileSize: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      orPeriod: "",
      type: "file",
      externalUrl: "",
      articleContent: "",
      isVisible: true,
      isDownloadable: true,
    },
  });

  // Reset form when material changes
  useEffect(() => {
    if (material) {
      form.reset({
        title: material.title,
        description: material.description || "",
        orPeriod: material.orPeriod || "",
        type: material.type,
        externalUrl: material.externalUrl || "",
        articleContent: material.articleContent || "",
        isVisible: material.isVisible,
        isDownloadable: material.isDownloadable,
      });

      // Set existing file info if available
      if (material.type === "file" && material.fileName && material.fileSize) {
        setExistingFileInfo({
          fileName: material.fileName,
          fileSize: material.fileSize,
        });
      } else {
        setExistingFileInfo(null);
      }

      setSelectedFile(null);
    } else {
      form.reset({
        title: "",
        description: "",
        orPeriod: "",
        type: "file",
        externalUrl: "",
        articleContent: "",
        isVisible: true,
        isDownloadable: true,
      });
      setSelectedFile(null);
      setExistingFileInfo(null);
    }
  }, [material, form, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 50MB");
        return;
      }
      setSelectedFile(file);
      setExistingFileInfo(null);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const onSubmit = async (values: FormValues) => {
    if (!user?.uid) {
      toast.error("User not authenticated");
      return;
    }

    // Validate file for new file-type material
    if (values.type === "file" && !material && !selectedFile) {
      toast.error("Pilih file yang akan diupload");
      return;
    }

    // Validate URL for link type
    if (values.type === "link" && !values.externalUrl) {
      toast.error("URL wajib diisi untuk tipe Link");
      return;
    }

    setIsSubmitting(true);
    try {
      let fileData = {};

      // Upload file if selected
      if (values.type === "file" && selectedFile) {
        const uploadResult = await uploadMaterialFile(
          selectedFile,
          values.orPeriod
        );
        fileData = {
          fileUrl: uploadResult.fileUrl,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize,
          fileType: uploadResult.fileType,
        };
      }

      // Prepare payload based on type
      const basePayload = {
        title: values.title,
        description: values.description || "",
        orPeriod: values.orPeriod,
        type: values.type,
        isVisible: values.isVisible,
        isDownloadable: values.isDownloadable,
      };

      let typeSpecificData = {};

      switch (values.type) {
        case "file":
          typeSpecificData = {
            ...fileData,
            externalUrl: undefined,
            articleContent: undefined,
          };
          break;
        case "link":
          typeSpecificData = {
            externalUrl: values.externalUrl,
            fileUrl: undefined,
            fileName: undefined,
            fileSize: undefined,
            fileType: undefined,
            articleContent: undefined,
          };
          break;
        case "article":
          typeSpecificData = {
            articleContent: values.articleContent,
            externalUrl: undefined,
            fileUrl: undefined,
            fileName: undefined,
            fileSize: undefined,
            fileType: undefined,
          };
          break;
      }

      const payload = {
        ...basePayload,
        ...typeSpecificData,
      };

      if (material) {
        // Edit Mode
        await updateMaterial(material.id, payload);
        toast.success("Materi berhasil diperbarui");
      } else {
        // Create Mode
        await createMaterial({
          ...payload,
          activityId: null,
          createdBy: user.uid,
        });
        toast.success("Materi baru berhasil dibuat");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting material:", error);
      toast.error("Gagal menyimpan materi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {material ? "Edit Materi" : "Tambah Materi Baru"}
          </DialogTitle>
          <DialogDescription>
            Isi informasi detail mengenai materi pembelajaran.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Judul Materi</Label>
            <Input
              id="title"
              placeholder="Contoh: Panduan Dasar Elektronika"
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
              placeholder="Jelaskan isi materi..."
              className="resize-none h-20"
              {...form.register("description")}
            />
          </div>

          {/* OR Period */}
          <div className="space-y-2">
            <Label htmlFor="orPeriod">Periode OR</Label>
            <Input
              id="orPeriod"
              placeholder="Contoh: OR 21"
              {...form.register("orPeriod")}
            />
            {form.formState.errors.orPeriod && (
              <p className="text-sm text-red-500">
                {form.formState.errors.orPeriod.message}
              </p>
            )}
          </div>

          {/* Material Type Tabs */}
          <div className="space-y-2">
            <Label>Tipe Materi</Label>
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <Tabs
                  value={field.value}
                  onValueChange={(value: string) =>
                    field.onChange(value as MaterialType)
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger
                      value="file"
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      File
                    </TabsTrigger>
                    <TabsTrigger
                      value="link"
                      className="flex items-center gap-2"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Link
                    </TabsTrigger>
                    <TabsTrigger
                      value="article"
                      className="flex items-center gap-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      Artikel
                    </TabsTrigger>
                  </TabsList>

                  {/* File Upload */}
                  <TabsContent value="file" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Upload File</Label>
                      <div className="relative border-2 border-dashed rounded-lg p-6 text-center bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                        {selectedFile ? (
                          <div className="flex items-center justify-center gap-3 relative z-10">
                            <FileText className="h-8 w-8 text-blue-500" />
                            <div className="text-left">
                              <p className="font-medium text-sm">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatFileSize(selectedFile.size)}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearSelectedFile();
                              }}
                              className="relative z-20"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : existingFileInfo ? (
                          <div className="flex items-center justify-center gap-3">
                            <FileText className="h-8 w-8 text-green-500" />
                            <div className="text-left">
                              <p className="font-medium text-sm">
                                {existingFileInfo.fileName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatFileSize(existingFileInfo.fileSize)} -
                                File tersimpan
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                              }}
                              className="relative z-20"
                            >
                              Ganti File
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                            <p className="text-sm text-slate-500 mb-2">
                              Klik atau drag & drop file di sini
                            </p>
                            <p className="text-xs text-slate-400">
                              PDF, PPTX, DOCX, ZIP (Maks. 50MB)
                            </p>
                          </>
                        )}
                        {/* File input - only covers dropzone area due to parent's relative position */}
                        {!selectedFile && !existingFileInfo && (
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={handleFileChange}
                            accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.zip,.rar"
                          />
                        )}
                      </div>
                      {/* Hidden file input for "Ganti File" button */}
                      {(selectedFile || existingFileInfo) && (
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.zip,.rar"
                        />
                      )}
                    </div>

                    {/* Downloadable Switch - Only for file type */}
                    <div className="flex items-center space-x-2">
                      <Controller
                        control={form.control}
                        name="isDownloadable"
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="isDownloadable"
                          />
                        )}
                      />
                      <Label htmlFor="isDownloadable">
                        Izinkan Download (Jika tidak, hanya bisa dilihat)
                      </Label>
                    </div>
                  </TabsContent>

                  {/* External Link */}
                  <TabsContent value="link" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="externalUrl">URL Link Eksternal</Label>
                      <Input
                        id="externalUrl"
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        {...form.register("externalUrl")}
                      />
                      {form.formState.errors.externalUrl && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.externalUrl.message}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        Contoh: Link YouTube, Google Drive, Website Artikel
                      </p>
                    </div>
                  </TabsContent>

                  {/* Article Content */}
                  <TabsContent value="article" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Konten Artikel</Label>
                      <Controller
                        control={form.control}
                        name="articleContent"
                        render={({ field }) => (
                          <RichTextEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Tulis konten artikel di sini..."
                          />
                        )}
                      />
                      <p className="text-xs text-slate-500">
                        Gunakan toolbar untuk formatting teks (Bold, Italic,
                        Heading, List, Quote).
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            />
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
              {material ? "Simpan Perubahan" : "Tambah Materi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
