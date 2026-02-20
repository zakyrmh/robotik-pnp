"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  InternshipLogbookEntrySchema,
  type InternshipLogbookEntry,
} from "@/schemas/internship";
import { z } from "zod";
import {
  uploadInternshipDocumentation,
  deleteStorageFiles,
} from "@/lib/firebase/services/storage-service";
import { useAuth } from "@/hooks/useAuth";
import {
  type RollingInternshipRegistration,
  type DepartmentInternshipRegistration,
} from "@/schemas/internship";

// Extend schema for form usage (files handling)
const formSchema = InternshipLogbookEntrySchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  statusReason: true,
  deletedAt: true, // Not user-editable
}).extend({
  // Override files handling in form
  documentationFiles: z.any().optional(), // For file input handling
  date: z.date(),
  duration: z.number().min(1, "Durasi (menit) wajib diisi"),
  documentationUrls: z.array(z.string()).optional(), // Handled manually
});

type FormValues = z.infer<typeof formSchema>;

interface InternshipLogbookModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    data: Omit<InternshipLogbookEntry, "id"> & { id?: string },
  ) => Promise<void>;
  defaultValues?: Partial<InternshipLogbookEntry>;
  isEditing?: boolean;
  registrations?: {
    rolling: RollingInternshipRegistration | null;
    department: DepartmentInternshipRegistration | null;
  } | null;
}

const INTERNSHIP_TYPES = [
  { value: "rolling", label: "Magang Divisi (Rolling)" },
  { value: "department", label: "Magang Departemen" },
];

const ROLLING_DIVISIONS = [
  { value: "krai", label: "KRAI" },
  { value: "krsbi_b", label: "KRSBI Beroda" },
  { value: "krsbi_h", label: "KRSBI Humanoid" },
  { value: "krsti", label: "KRSTI" },
  { value: "krsri", label: "KRSRI" },
];

const DEPT_DIVISIONS = [
  { value: "kestari", label: "Kestari" },
  { value: "maintenance", label: "Maintenance" },
  { value: "production", label: "Produksi" },
  { value: "humas", label: "Humas" },
  { value: "infokom_field", label: "Infokom" },
  { value: "kpsdm", label: "KPSDM" },
  { value: "ristek", label: "Ristek" },
];

const ACTIVITY_TYPES = [
  "Riset/Belajar",
  "Pengerjaan Proyek",
  "Diskusi/Rapat",
  "Maintenance/Perbaikan",
  "Lainnya",
];

export function InternshipLogbookModal({
  isOpen,
  onOpenChange,
  onSubmit,
  defaultValues,
  isEditing = false,
  registrations,
}: InternshipLogbookModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [deletedUrls, setDeletedUrls] = useState<string[]>([]); // Track URLs to delete on submit
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Update preview URLs when defaultValues change (e.g. opening edit modal)
  useEffect(() => {
    if (isOpen && defaultValues?.documentationUrls) {
      setPreviewUrls(defaultValues.documentationUrls);
    } else if (!isOpen) {
      // Reset when closed
      setPreviewUrls([]);
      setUploadedFiles([]);
    }
  }, [isOpen, defaultValues]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      duration: 0,
      targetDivision: "",
      activityType: "",
      activity: "",
      outcome: "",
      documentationUrls: [],
      internshipType: "rolling",
      ...defaultValues,
    },
  });

  // Effect to reset form when defaultValues changes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        date: defaultValues?.date || new Date(),
        duration: defaultValues?.duration || 0,
        targetDivision: defaultValues?.targetDivision || "",
        activityType: defaultValues?.activityType || "",
        activity: defaultValues?.activity || "",
        outcome: defaultValues?.outcome || "",
        documentationUrls: defaultValues?.documentationUrls || [],
        internshipType: defaultValues?.internshipType || "rolling",
      });
    }
  }, [defaultValues, isOpen, form]);

  // Effect for Auto-population for Department Internship
  const currentType = form.watch("internshipType");
  useEffect(() => {
    if (
      currentType === "department" &&
      registrations?.department?.fieldChoice &&
      !isEditing
    ) {
      form.setValue("targetDivision", registrations.department.fieldChoice);
    }
  }, [currentType, registrations, form, isEditing]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (previewUrls.length + newFiles.length > 5) {
        toast.error("Maksimal 5 foto dokumentasi");
        return;
      }

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      // Create preview URLs
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    const newPreviewUrls = [...previewUrls];
    newPreviewUrls.splice(index, 1);
    setPreviewUrls(newPreviewUrls);

    // Update form state to reflect removed URL
    const currentUrls = form.getValues("documentationUrls") || [];
    const existingUrlsCount = currentUrls.length;

    if (index < existingUrlsCount) {
      // Removing an existing URL from defaultValues - mark for deletion
      const urlToDelete = currentUrls[index];
      setDeletedUrls((prev) => [...prev, urlToDelete]);
      const newUrls = [...currentUrls];
      newUrls.splice(index, 1);
      form.setValue("documentationUrls", newUrls);
    } else {
      // Removing a newly uploaded file (not yet saved) - just remove from state
      const uploadedFileIndex = index - existingUrlsCount;
      setUploadedFiles((prev) =>
        prev.filter((_, i) => i !== uploadedFileIndex),
      );
    }
  };

  const handleSubmit = async (
    values: FormValues,
    status: "draft" | "submitted",
  ) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      // 1. Delete removed files from storage
      if (deletedUrls.length > 0) {
        await deleteStorageFiles(deletedUrls);
      }

      // 2. Upload new files only (don't re-upload existing URLs)
      const newUrls: string[] = [];
      const currentUrls = form.getValues("documentationUrls") || []; // These are existing ones we kept

      for (const file of uploadedFiles) {
        const downloadUrl = await uploadInternshipDocumentation(file, user.uid);
        newUrls.push(downloadUrl);
      }

      // 3. Merge existing URLs + newly uploaded URLs
      const finalUrls = [...currentUrls, ...newUrls];

      if (finalUrls.length === 0) {
        toast.error("Wajib sertakan minimal 1 foto dokumentasi");
        setIsSubmitting(false);
        return;
      }

      // 4. Prepare Payload
      const payload = {
        ...values,
        duration: Number(values.duration),
        documentationUrls: finalUrls,
        status: status,
        userId: user.uid,
        id: defaultValues?.id, // ID from props
        createdAt:
          defaultValues?.createdAt instanceof Date
            ? defaultValues.createdAt
            : new Date(),
        updatedAt: new Date(),
      };

      await onSubmit(payload);
      onOpenChange(false);
      form.reset();
      setUploadedFiles([]);
      setPreviewUrls([]);
      setDeletedUrls([]);
    } catch (error) {
      console.error("Error submitting logbook:", error);
      toast.error("Gagal menyimpan logbook");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Logbook Magang" : "Tambah Log Harian"}
          </DialogTitle>
          <DialogDescription>
            Isi detail kegiatan magang Anda hari ini.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4">
            {/* Internship Type Selection */}
            <FormField
              control={form.control}
              name="internshipType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Magang</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val);
                      // Reset target division when type changes
                      form.setValue("targetDivision", "");
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Jenis Magang" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INTERNSHIP_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: localeId })
                            ) : (
                              <span>Pilih tanggal</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duration */}
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durasi (Menit)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Contoh: 120"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Division */}
              <FormField
                control={form.control}
                name="targetDivision"
                render={({ field }) => {
                  const currentType = form.watch("internshipType");
                  const options =
                    currentType === "department"
                      ? DEPT_DIVISIONS
                      : ROLLING_DIVISIONS;

                  return (
                    <FormItem>
                      <FormLabel>
                        {currentType === "department" ? "Bidang" : "Divisi"}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        key={`${currentType}-${field.value}`} // Force re-render on type change
                      >
                        <FormControl>
                          <SelectTrigger
                            disabled={
                              currentType === "department" &&
                              !!registrations?.department
                            }
                          >
                            <SelectValue
                              placeholder={
                                currentType === "department"
                                  ? "Pilih Bidang"
                                  : "Pilih Divisi"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {currentType === "department" &&
                        registrations?.department && (
                          <p className="text-[10px] text-blue-600 mt-1">
                            * Otomatis dipilih berdasarkan data pendaftaran
                            magang Anda.
                          </p>
                        )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Activity Type */}
              <FormField
                control={form.control}
                name="activityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Kegiatan</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Jenis" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACTIVITY_TYPES.map((type) => (
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
            </div>

            {/* Activity */}
            <FormField
              control={form.control}
              name="activity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Uraian Kegiatan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jelaskan detail apa yang Anda kerjakan..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Outcome */}
            <FormField
              control={form.control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hasil / Capaian</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Apa hasil dari kegiatan ini? (Misal: Paham konsep X, Selesai merakit Y)"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Documentation */}
            <div className="space-y-4">
              <FormLabel>Dokumentasi (Max 5 Foto)</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {previewUrls.map((url, index) => (
                  <div
                    key={index}
                    className="relative group aspect-square rounded-md overflow-hidden border"
                  >
                    <Image
                      src={url}
                      alt={`Preview ${index}`}
                      className="object-cover"
                      fill
                      sizes="(max-width: 768px) 50vw, 20vw"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {previewUrls.length < 5 && (
                  <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-md cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground text-center px-2">
                      Upload Foto
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={form.handleSubmit((values) =>
                  handleSubmit(values, "draft"),
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Simpan Draft
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={form.handleSubmit((values) =>
                  handleSubmit(values, "submitted"),
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Kirim
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
