"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import {
  CalendarIcon,
  Clock,
  FileText,
  Loader2,
  Save,
  Send,
  Users,
} from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { cn } from "@/lib/utils";
import {
  updateLogbook,
  UpdateLogbookData,
} from "@/lib/firebase/services/logbook-service";
import {
  ResearchLogbook,
  ResearchActivityCategoryEnum,
  getActivityCategoryLabel,
} from "@/schemas/research-logbook";
import {
  getTeamMembers,
  TeamMember,
  getManagementPositionLabel,
  getTechnicalRoleLabel,
} from "@/lib/firebase/services/team-member-service";

// =========================================================
// FORM SCHEMA
// =========================================================

const LogbookFormSchema = z.object({
  title: z
    .string()
    .min(1, "Judul wajib diisi")
    .max(200, "Judul maksimal 200 karakter"),
  activityDate: z.date({ message: "Tanggal kegiatan wajib diisi" }),
  category: ResearchActivityCategoryEnum,
  description: z
    .string()
    .min(1, "Deskripsi wajib diisi")
    .max(2000, "Deskripsi maksimal 2000 karakter"),
  achievements: z.string().max(1000, "Maksimal 1000 karakter").optional(),
  challenges: z.string().max(1000, "Maksimal 1000 karakter").optional(),
  nextPlan: z.string().max(1000, "Maksimal 1000 karakter").optional(),
  durationHours: z
    .number()
    .min(0, "Durasi tidak boleh negatif")
    .max(24, "Durasi maksimal 24 jam")
    .optional(),
  collaboratorIds: z.array(z.string()),
});

type LogbookFormValues = z.infer<typeof LogbookFormSchema>;

// =========================================================
// CATEGORY OPTIONS
// =========================================================

const CATEGORY_OPTIONS = ResearchActivityCategoryEnum.options.map((cat) => ({
  value: cat,
  label: getActivityCategoryLabel(cat),
}));

// =========================================================
// COMPONENT PROPS
// =========================================================

interface LogbookEditModalProps {
  logbook: ResearchLogbook | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  currentUserId?: string;
  currentUserName?: string;
}

// =========================================================
// MAIN COMPONENT
// =========================================================

export function LogbookEditModal({
  logbook,
  open,
  onOpenChange,
  onSuccess,
  currentUserId,
  currentUserName,
}: LogbookEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Fetch team members
  useEffect(() => {
    async function fetchMembers() {
      if (!open || !logbook) return;

      setIsLoadingMembers(true);
      try {
        const members = await getTeamMembers(logbook.team);
        // Filter out author (cannot collaborate with self)
        setTeamMembers(members.filter((m) => m.id !== logbook.authorId));
      } catch (error) {
        console.error("Error fetching team members:", error);
        toast.error("Gagal memuat anggota tim");
      } finally {
        setIsLoadingMembers(false);
      }
    }

    if (open) {
      fetchMembers();
    }
  }, [open, logbook]);

  const form = useForm<LogbookFormValues>({
    resolver: zodResolver(LogbookFormSchema),
    defaultValues: {
      title: "",
      activityDate: new Date(),
      category: "programming",
      description: "",
      achievements: "",
      challenges: "",
      nextPlan: "",
      durationHours: undefined,
      collaboratorIds: [],
    },
  });

  // Update form values when logbook changes
  useEffect(() => {
    if (logbook && open) {
      const activityDate =
        logbook.activityDate instanceof Date
          ? logbook.activityDate
          : new Date();

      form.reset({
        title: logbook.title,
        activityDate,
        category: logbook.category,
        description: logbook.description,
        achievements: logbook.achievements || "",
        challenges: logbook.challenges || "",
        nextPlan: logbook.nextPlan || "",
        durationHours: logbook.durationHours,
        collaboratorIds: logbook.collaboratorIds || [],
      });
    }
  }, [logbook, open, form]);

  // Handle form submission
  const handleSubmit = async (
    values: LogbookFormValues,
    status: "draft" | "submitted",
  ) => {
    if (!logbook || !currentUserId || !currentUserName) return;

    setIsSubmitting(true);

    try {
      const updateData: UpdateLogbookData = {
        activityDate: values.activityDate,
        title: values.title,
        category: values.category,
        description: values.description,
        achievements: values.achievements || undefined,
        challenges: values.challenges || undefined,
        nextPlan: values.nextPlan || undefined,
        durationHours: values.durationHours || undefined,
        status,
        collaboratorIds: values.collaboratorIds,
      };

      await updateLogbook(logbook.id, updateData, {
        id: currentUserId,
        name: currentUserName,
      });

      toast.success(
        status === "draft"
          ? "Logbook berhasil diperbarui"
          : "Logbook berhasil diajukan untuk review",
      );

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating logbook:", error);
      toast.error("Gagal memperbarui logbook. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save as draft
  const handleSaveDraft = () => {
    form.handleSubmit((values) => handleSubmit(values, "draft"))();
  };

  // Submit for review
  const handleSubmitForReview = () => {
    form.handleSubmit((values) => handleSubmit(values, "submitted"))();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b shrink-0 bg-background z-10">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Edit Logbook Riset
          </DialogTitle>
          <DialogDescription>
            Perbarui informasi logbook riset Anda. Pastikan semua informasi
            sudah benar sebelum menyimpan.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <Form {...form}>
            <form className="space-y-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Judul Kegiatan <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Perancangan sistem navigasi robot"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Activity Date & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Activity Date */}
                <FormField
                  control={form.control}
                  name="activityDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        Tanggal Kegiatan{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(field.value, "d MMMM yyyy", {
                                  locale: idLocale,
                                })
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
                              date > new Date() || date < new Date("2020-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Kategori <span className="text-destructive">*</span>
                      </FormLabel>
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
                          {CATEGORY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Collaborators */}
              <FormField
                control={form.control}
                name="collaboratorIds"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Kolaborator (Opsional)
                      </FormLabel>
                      <FormDescription>
                        Pilih anggota tim yang ikut berkontribusi dalam kegiatan
                        ini.
                      </FormDescription>
                    </div>
                    <div className="border rounded-md p-3 max-h-[150px] overflow-y-auto space-y-2">
                      {isLoadingMembers ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-muted-foreground">
                            Memuat anggota...
                          </span>
                        </div>
                      ) : teamMembers.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-2">
                          Tidak ada anggota lain ditemukan.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {teamMembers.map((member) => (
                            <FormField
                              key={member.id}
                              control={form.control}
                              name="collaboratorIds"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={member.id}
                                    className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(
                                          member.id,
                                        )}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([
                                                ...(field.value || []),
                                                member.id,
                                              ])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) =>
                                                    value !== member.id,
                                                ),
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <div className="flex flex-col">
                                      <FormLabel className="font-normal cursor-pointer text-sm">
                                        {member.fullName}
                                      </FormLabel>
                                      <span className="text-xs text-muted-foreground">
                                        {getManagementPositionLabel(
                                          member.managementPosition,
                                        )}{" "}
                                        •{" "}
                                        {getTechnicalRoleLabel(
                                          member.technicalRole,
                                        )}
                                      </span>
                                    </div>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duration */}
              <FormField
                control={form.control}
                name="durationHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Durasi Kegiatan (jam)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Contoh: 3"
                        min={0}
                        max={24}
                        step={0.5}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? parseFloat(value) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Estimasi durasi kegiatan dalam jam (opsional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Deskripsi Kegiatan{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Jelaskan detail kegiatan yang dilakukan..."
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Deskripsikan secara detail apa yang dikerjakan
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Achievements */}
              <FormField
                control={form.control}
                name="achievements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hasil yang Dicapai</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Apa hasil/pencapaian dari kegiatan ini? (opsional)"
                        className="min-h-[80px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Challenges */}
              <FormField
                control={form.control}
                name="challenges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kendala yang Dihadapi</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Kendala atau masalah yang ditemui? (opsional)"
                        className="min-h-[80px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Next Plan */}
              <FormField
                control={form.control}
                name="nextPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rencana Selanjutnya</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Apa yang akan dikerjakan selanjutnya? (opsional)"
                        className="min-h-[80px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <DialogFooter className="p-6 pt-2 border-t bg-background z-10 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="w-full sm:w-auto mr-2"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Simpan Draft
          </Button>
          <Button
            type="button"
            onClick={handleSubmitForReview}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Ajukan Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
