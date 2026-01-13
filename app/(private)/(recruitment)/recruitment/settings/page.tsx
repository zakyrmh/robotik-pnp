"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  SlidersHorizontal,
  Save,
  Loader2,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Phone,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Link2,
} from "lucide-react";
import { toast } from "sonner";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Context & Hooks
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { useUnsavedChanges } from "@/components/unsaved-changes-context";

// Services & Schemas
import {
  getRecruitmentSettings,
  updateRecruitmentSettings,
} from "@/lib/firebase/services/settings-service";
import {
  RecruitmentSettingsFormSchema,
  RecruitmentSettingsFormData,
  DEFAULT_RECRUITMENT_SETTINGS,
} from "@/schemas/recruitment-settings";

import { cn } from "@/lib/utils";

// =========================================================
// PAGE SKELETON
// =========================================================

function SettingsPageSkeleton() {
  return (
    <div className="flex flex-col h-full space-y-6 pt-6 pb-10">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-5 w-80 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
      </div>

      <Separator />

      {/* Cards Skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"
          >
            <div className="space-y-4">
              <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =========================================================
// ACCESS DENIED COMPONENT
// =========================================================

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30">
        <XCircle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Akses Ditolak
      </h2>
      <p className="text-muted-foreground text-center max-w-md">
        Anda tidak memiliki izin untuk mengakses halaman ini. Halaman ini hanya
        dapat diakses oleh Super Admin atau Recruiter.
      </p>
    </div>
  );
}

// =========================================================
// MAIN PAGE COMPONENT
// =========================================================

export default function RecruitmentSettingsPage() {
  const { roles, isLoading: dashboardLoading, user } = useDashboard();
  const { setHasUnsavedChanges } = useUnsavedChanges();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);

  // Form setup dengan react-hook-form + zod
  const form = useForm<RecruitmentSettingsFormData>({
    resolver: zodResolver(
      RecruitmentSettingsFormSchema
    ) as Resolver<RecruitmentSettingsFormData>,
    defaultValues: DEFAULT_RECRUITMENT_SETTINGS,
    mode: "onChange",
  });

  const {
    register,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = form;

  // useFieldArray untuk payment methods
  const { fields, append, remove } = useFieldArray({
    control,
    name: "paymentMethods",
  });

  // useFieldArray untuk contact person
  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
  } = useFieldArray({
    control,
    name: "contactPerson",
  });

  // Watch values untuk display
  const isRegistrationOpen = watch("isRegistrationOpen");
  const scheduleOpenDate = watch("schedule.openDate");
  const scheduleCloseDate = watch("schedule.closeDate");

  // Access check
  const hasAccess = roles?.isSuperAdmin || roles?.isRecruiter;

  // Sync dirty state dengan unsaved changes context
  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty, setHasUnsavedChanges]);

  // Clear unsaved changes on unmount
  useEffect(() => {
    return () => {
      setHasUnsavedChanges(false);
    };
  }, [setHasUnsavedChanges]);

  // Fetch existing settings
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const settings = await getRecruitmentSettings();

      if (settings) {
        setHasExistingData(true);
        reset({
          activePeriod: settings.activePeriod,
          registrationFee: settings.registrationFee,
          schedule: {
            openDate: settings.schedule.openDate,
            closeDate: settings.schedule.closeDate,
          },
          contactPerson:
            settings.contactPerson.length > 0
              ? settings.contactPerson
              : [{ name: "", whatsapp: "" }],
          externalLinks: {
            groupChatUrl: settings.externalLinks?.groupChatUrl || "",
            guidebookUrl: settings.externalLinks?.guidebookUrl || "",
            faqUrl: settings.externalLinks?.faqUrl || "",
          },
          paymentMethods:
            settings.paymentMethods.length > 0
              ? settings.paymentMethods
              : [{ bankName: "", accountNumber: "", accountHolder: "" }],
          isRegistrationOpen: settings.isRegistrationOpen,
          announcementMessage: settings.announcementMessage || "",
        });
      } else {
        setHasExistingData(false);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Gagal memuat pengaturan");
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    if (!dashboardLoading && hasAccess) {
      fetchSettings();
    } else if (!dashboardLoading && !hasAccess) {
      setIsLoading(false);
    }
  }, [dashboardLoading, hasAccess, fetchSettings]);

  // Handle form submission
  const onSubmit = async (data: RecruitmentSettingsFormData) => {
    if (!user?.uid) {
      toast.error("User tidak ditemukan");
      return;
    }

    try {
      setIsSaving(true);
      await updateRecruitmentSettings(data, user.uid);

      toast.success("Pengaturan berhasil disimpan");
      setHasExistingData(true);

      // Reset form state to mark as clean
      reset(data);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue =
          "Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  // Loading state
  if (dashboardLoading || isLoading) {
    return <SettingsPageSkeleton />;
  }

  // Access denied
  if (!hasAccess) {
    return <AccessDenied />;
  }

  return (
    <div className="flex flex-col h-full space-y-6 pt-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <SlidersHorizontal className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Pengaturan Open Recruitment
            {isDirty && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 rounded-full">
                Belum Disimpan
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola pengaturan global untuk periode Open Recruitment aktif
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSettings}
            disabled={isSaving}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSaving || !isDirty}
            size="sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Simpan Pengaturan
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Status Banner */}
      {hasExistingData && (
        <div
          className={cn(
            "flex items-center gap-3 p-4 rounded-lg border",
            isRegistrationOpen
              ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900"
              : "bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800"
          )}
        >
          {isRegistrationOpen ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="w-5 h-5 text-slate-500" />
          )}
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {isRegistrationOpen
                ? "Pendaftaran Dibuka"
                : "Pendaftaran Ditutup"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isRegistrationOpen
                ? "Calon anggota dapat mendaftar melalui formulir pendaftaran"
                : "Formulir pendaftaran tidak dapat diakses oleh calon anggota"}
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1: Periode & Jadwal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                Periode & Jadwal
              </CardTitle>
              <CardDescription>
                Atur periode dan jadwal pendaftaran
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Active Period */}
              <div className="space-y-2">
                <Label htmlFor="activePeriod">
                  Periode Aktif <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="activePeriod"
                  placeholder="Contoh: OR 21"
                  {...register("activePeriod")}
                />
                {errors.activePeriod && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.activePeriod.message}
                  </p>
                )}
              </div>

              {/* Open Date */}
              <div className="space-y-2">
                <Label>
                  Tanggal Buka <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !scheduleOpenDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduleOpenDate ? (
                        format(scheduleOpenDate, "PPP", { locale: localeId })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduleOpenDate}
                      onSelect={(date) =>
                        date &&
                        setValue("schedule.openDate", date, {
                          shouldDirty: true,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.schedule?.openDate && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.schedule.openDate.message}
                  </p>
                )}
              </div>

              {/* Close Date */}
              <div className="space-y-2">
                <Label>
                  Tanggal Tutup <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !scheduleCloseDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduleCloseDate ? (
                        format(scheduleCloseDate, "PPP", { locale: localeId })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduleCloseDate}
                      onSelect={(date) =>
                        date &&
                        setValue("schedule.closeDate", date, {
                          shouldDirty: true,
                        })
                      }
                      disabled={(date) =>
                        scheduleOpenDate ? date < scheduleOpenDate : false
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.schedule?.closeDate && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.schedule.closeDate.message}
                  </p>
                )}
              </div>

              {/* Master Switch */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="isRegistrationOpen"
                    className="cursor-pointer"
                  >
                    Buka Pendaftaran
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Master switch untuk membuka/menutup pendaftaran
                  </p>
                </div>
                <Switch
                  id="isRegistrationOpen"
                  checked={isRegistrationOpen}
                  onCheckedChange={(checked) =>
                    setValue("isRegistrationOpen", checked, {
                      shouldDirty: true,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Biaya & Pembayaran */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                Biaya & Pembayaran
              </CardTitle>
              <CardDescription>
                Atur biaya pendaftaran dan rekening pembayaran
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Registration Fee */}
              <div className="space-y-2">
                <Label htmlFor="registrationFee">
                  Biaya Pendaftaran (Rp) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="registrationFee"
                  type="number"
                  placeholder="0"
                  {...register("registrationFee", { valueAsNumber: true })}
                />
                {errors.registrationFee && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.registrationFee.message}
                  </p>
                )}
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>
                    Metode Pembayaran <span className="text-red-500">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        bankName: "",
                        accountNumber: "",
                        accountHolder: "",
                      })
                    }
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Tambah
                  </Button>
                </div>

                {errors.paymentMethods?.root && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.paymentMethods.root.message}
                  </p>
                )}

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Rekening #{index + 1}
                        </span>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-3">
                        <Input
                          placeholder="Nama Bank (e.g., BCA, Mandiri)"
                          {...register(`paymentMethods.${index}.bankName`)}
                        />
                        {errors.paymentMethods?.[index]?.bankName && (
                          <p className="text-xs text-red-500">
                            {errors.paymentMethods[index]?.bankName?.message}
                          </p>
                        )}

                        <Input
                          placeholder="Nomor Rekening"
                          {...register(`paymentMethods.${index}.accountNumber`)}
                        />
                        {errors.paymentMethods?.[index]?.accountNumber && (
                          <p className="text-xs text-red-500">
                            {
                              errors.paymentMethods[index]?.accountNumber
                                ?.message
                            }
                          </p>
                        )}

                        <Input
                          placeholder="Nama Pemilik Rekening"
                          {...register(`paymentMethods.${index}.accountHolder`)}
                        />
                        {errors.paymentMethods?.[index]?.accountHolder && (
                          <p className="text-xs text-red-500">
                            {
                              errors.paymentMethods[index]?.accountHolder
                                ?.message
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Kontak */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-purple-600" />
                Kontak Person
              </CardTitle>
              <CardDescription>
                Informasi kontak untuk pertanyaan pendaftar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendContact({ name: "", whatsapp: "" })}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Tambah Kontak
                </Button>
              </div>

              {contactFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Kontak #{index + 1}
                    </span>
                    {contactFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeContact(index)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Contact Name */}
                  <div className="space-y-2">
                    <Label htmlFor={`contactPerson.${index}.name`}>
                      Nama <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`contactPerson.${index}.name`}
                      placeholder="Nama contact person"
                      {...register(`contactPerson.${index}.name`)}
                    />
                    {errors.contactPerson?.[index]?.name && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.contactPerson[index]?.name?.message}
                      </p>
                    )}
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-2">
                    <Label htmlFor={`contactPerson.${index}.whatsapp`}>
                      Nomor WhatsApp <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`contactPerson.${index}.whatsapp`}
                      placeholder="08xxxxxxxxxx"
                      {...register(`contactPerson.${index}.whatsapp`)}
                    />
                    {errors.contactPerson?.[index]?.whatsapp && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.contactPerson[index]?.whatsapp?.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Nomor ini akan ditampilkan kepada pendaftar
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Card 4: Link Penting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-indigo-600" />
                Link Penting
              </CardTitle>
              <CardDescription>
                Link grup, guidebook, dan FAQ untuk pendaftar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Group Chat URL */}
              <div className="space-y-2">
                <Label htmlFor="externalLinks.groupChatUrl">
                  Link Grup WhatsApp
                </Label>
                <Input
                  id="externalLinks.groupChatUrl"
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  {...register("externalLinks.groupChatUrl")}
                />
                {errors.externalLinks?.groupChatUrl && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.externalLinks.groupChatUrl.message}
                  </p>
                )}
              </div>

              {/* Guidebook URL */}
              <div className="space-y-2">
                <Label htmlFor="externalLinks.guidebookUrl">
                  Link Guidebook
                </Label>
                <Input
                  id="externalLinks.guidebookUrl"
                  type="url"
                  placeholder="https://drive.google.com/..."
                  {...register("externalLinks.guidebookUrl")}
                />
                {errors.externalLinks?.guidebookUrl && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.externalLinks.guidebookUrl.message}
                  </p>
                )}
              </div>

              {/* FAQ URL */}
              <div className="space-y-2">
                <Label htmlFor="externalLinks.faqUrl">Link FAQ</Label>
                <Input
                  id="externalLinks.faqUrl"
                  type="url"
                  placeholder="https://..."
                  {...register("externalLinks.faqUrl")}
                />
                {errors.externalLinks?.faqUrl && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.externalLinks.faqUrl.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Link ini akan ditampilkan kepada pendaftar yang sudah
                  terverifikasi
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 5: Pengumuman */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Pesan Pengumuman
              </CardTitle>
              <CardDescription>
                Pesan yang ditampilkan di halaman pendaftaran (opsional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  placeholder="Tulis pesan pengumuman untuk calon pendaftar..."
                  className="min-h-[120px] resize-none"
                  {...register("announcementMessage")}
                />
                <p className="text-xs text-muted-foreground">
                  Pesan ini akan muncul sebagai banner di halaman pendaftaran
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button (Mobile) */}
        <div className="md:hidden">
          <Button
            type="submit"
            className="w-full"
            disabled={isSaving || !isDirty}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Simpan Pengaturan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
