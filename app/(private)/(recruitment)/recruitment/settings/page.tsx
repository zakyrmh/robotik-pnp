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
  Wallet,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";

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

import { useDashboard } from "@/components/dashboard/dashboard-context";
import { useUnsavedChanges } from "@/components/unsaved-changes-context";

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

function SettingsPageSkeleton() {
  return (
    <div className="flex flex-col h-full space-y-6 pt-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-5 w-80 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
      </div>
      <Separator />
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

export default function RecruitmentSettingsPage() {
  const { roles, isLoading: dashboardLoading, user } = useDashboard();
  const { setHasUnsavedChanges } = useUnsavedChanges();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);

  const form = useForm<RecruitmentSettingsFormData>({
    resolver: zodResolver(
      RecruitmentSettingsFormSchema,
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

  const {
    fields: bankFields,
    append: appendBank,
    remove: removeBank,
  } = useFieldArray({
    control,
    name: "bankAccounts",
  });

  const {
    fields: eWalletFields,
    append: appendEWallet,
    remove: removeEWallet,
  } = useFieldArray({
    control,
    name: "eWallets",
  });

  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
  } = useFieldArray({
    control,
    name: "contactPerson",
  });

  const isRegistrationOpen = watch("isRegistrationOpen");
  const isInternshipOpen = watch("isInternshipOpen");
  const scheduleOpenDate = watch("schedule.openDate");
  const scheduleCloseDate = watch("schedule.closeDate");
  const internshipOpenDate = watch("internshipSchedule.openDate");
  const internshipCloseDate = watch("internshipSchedule.closeDate");

  const hasAccess = roles?.isSuperAdmin || roles?.isRecruiter;

  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty, setHasUnsavedChanges]);

  useEffect(() => {
    return () => {
      setHasUnsavedChanges(false);
    };
  }, [setHasUnsavedChanges]);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const settings = await getRecruitmentSettings();

      if (settings) {
        setHasExistingData(true);
        reset({
          activePeriod: settings.activePeriod,
          activeYear: settings.activeYear || "",
          registrationFee: settings.registrationFee,
          schedule: {
            openDate: settings.schedule.openDate,
            closeDate: settings.schedule.closeDate,
          },
          internshipSchedule: {
            openDate: settings.internshipSchedule?.openDate || new Date(),
            closeDate:
              settings.internshipSchedule?.closeDate ||
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          contactPerson:
            settings.contactPerson.length > 0
              ? settings.contactPerson
              : [{ name: "", whatsapp: "" }],
          externalLinks: {
            groupChatUrl: settings.externalLinks?.groupChatUrl || "",
            guidebookUrl: settings.externalLinks?.guidebookUrl || "",
            faqUrl: settings.externalLinks?.faqUrl || "",
            instagramRobotikUrl:
              settings.externalLinks?.instagramRobotikUrl || "",
            instagramMrcUrl: settings.externalLinks?.instagramMrcUrl || "",
            youtubeRobotikUrl: settings.externalLinks?.youtubeRobotikUrl || "",
          },
          bankAccounts:
            settings.bankAccounts?.length > 0
              ? settings.bankAccounts
              : [{ bankName: "", accountNumber: "", accountHolder: "" }],
          eWallets:
            settings.eWallets?.length > 0
              ? settings.eWallets
              : [{ provider: "", number: "", accountHolder: "" }],
          isRegistrationOpen: settings.isRegistrationOpen,
          isInternshipOpen: settings.isInternshipOpen || false,
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
      reset(data);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setIsSaving(false);
    }
  };

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

  if (dashboardLoading || isLoading) {
    return <SettingsPageSkeleton />;
  }

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return (
    <div className="flex flex-col h-full space-y-6 pt-6 pb-10">
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

      {hasExistingData && (
        <div
          className={cn(
            "flex items-center gap-3 p-4 rounded-lg border",
            isRegistrationOpen
              ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900"
              : "bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800",
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

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
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
              <div className="space-y-2">
                <Label htmlFor="activePeriod">
                  Periode Aktif <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="activePeriod"
                    placeholder="Contoh: OR 21"
                    {...register("activePeriod")}
                    className="flex-1"
                  />
                  <Input
                    id="activeYear"
                    placeholder="Contoh: 2024-2025"
                    {...register("activeYear")}
                    className="w-1/3"
                  />
                </div>
                {errors.activePeriod && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.activePeriod.message}
                  </p>
                )}
              </div>

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
                        !scheduleOpenDate && "text-muted-foreground",
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
                        !scheduleCloseDate && "text-muted-foreground",
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

          {/* Pengaturan Magang */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-purple-600" />
                Pengaturan Magang
              </CardTitle>
              <CardDescription>
                Atur jadwal dan status pendaftaran magang
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="space-y-0.5">
                  <Label htmlFor="isInternshipOpen" className="cursor-pointer">
                    Buka Magang
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Switch untuk membuka/menutup pendaftaran magang
                  </p>
                </div>
                <Switch
                  id="isInternshipOpen"
                  checked={isInternshipOpen}
                  onCheckedChange={(checked) =>
                    setValue("isInternshipOpen", checked, {
                      shouldDirty: true,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Tanggal Buka Magang</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !internshipOpenDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {internshipOpenDate ? (
                        format(internshipOpenDate, "PPP", { locale: localeId })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={internshipOpenDate}
                      onSelect={(date) =>
                        date &&
                        setValue("internshipSchedule.openDate", date, {
                          shouldDirty: true,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Tanggal Tutup Magang</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !internshipCloseDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {internshipCloseDate ? (
                        format(internshipCloseDate, "PPP", { locale: localeId })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={internshipCloseDate}
                      onSelect={(date) =>
                        date &&
                        setValue("internshipSchedule.closeDate", date, {
                          shouldDirty: true,
                        })
                      }
                      disabled={(date) =>
                        internshipOpenDate ? date < internshipOpenDate : false
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                Biaya & Pembayaran
              </CardTitle>
              <CardDescription>
                Atur biaya pendaftaran, rekening bank, dan e-wallet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-base">
                    <Banknote className="w-4 h-4 text-slate-500" />
                    Rekening Bank
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendBank({
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

                <div className="space-y-3">
                  {bankFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Rekening #{index + 1}
                        </span>
                        {bankFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBank(index)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-3">
                        <Input
                          placeholder="Nama Bank (e.g., BRI, Mandiri)"
                          {...register(`bankAccounts.${index}.bankName`)}
                        />
                        {errors.bankAccounts?.[index]?.bankName && (
                          <p className="text-xs text-red-500">
                            {errors.bankAccounts[index]?.bankName?.message}
                          </p>
                        )}

                        <Input
                          placeholder="Nomor Rekening"
                          {...register(`bankAccounts.${index}.accountNumber`)}
                        />
                        {errors.bankAccounts?.[index]?.accountNumber && (
                          <p className="text-xs text-red-500">
                            {errors.bankAccounts[index]?.accountNumber?.message}
                          </p>
                        )}

                        <Input
                          placeholder="Atas Nama"
                          {...register(`bankAccounts.${index}.accountHolder`)}
                        />
                        {errors.bankAccounts?.[index]?.accountHolder && (
                          <p className="text-xs text-red-500">
                            {errors.bankAccounts[index]?.accountHolder?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-base">
                    <Wallet className="w-4 h-4 text-slate-500" />
                    E-Wallet / Dompet Digital
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendEWallet({
                        provider: "",
                        number: "",
                        accountHolder: "",
                      })
                    }
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Tambah
                  </Button>
                </div>

                <div className="space-y-3">
                  {eWalletFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          E-Wallet #{index + 1}
                        </span>
                        {eWalletFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEWallet(index)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-3">
                        <Input
                          placeholder="Provider (e.g., OVO, DANA)"
                          {...register(`eWallets.${index}.provider`)}
                        />
                        {errors.eWallets?.[index]?.provider && (
                          <p className="text-xs text-red-500">
                            {errors.eWallets[index]?.provider?.message}
                          </p>
                        )}

                        <Input
                          placeholder="Nomor HP / ID"
                          {...register(`eWallets.${index}.number`)}
                        />
                        {errors.eWallets?.[index]?.number && (
                          <p className="text-xs text-red-500">
                            {errors.eWallets[index]?.number?.message}
                          </p>
                        )}

                        <Input
                          placeholder="Atas Nama"
                          {...register(`eWallets.${index}.accountHolder`)}
                        />
                        {errors.eWallets?.[index]?.accountHolder && (
                          <p className="text-xs text-red-500">
                            {errors.eWallets[index]?.accountHolder?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

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
              </div>

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
              </div>

              <div className="space-y-2">
                <Label htmlFor="externalLinks.faqUrl">Link FAQ</Label>
                <Input
                  id="externalLinks.faqUrl"
                  type="url"
                  placeholder="https://..."
                  {...register("externalLinks.faqUrl")}
                />
              </div>

              <div className="pt-2">
                <Separator />
              </div>
              <p className="text-xs mt-2 font-medium">
                Link Media Sosial (untuk validasi upload)
              </p>

              <div className="space-y-2">
                <Label htmlFor="externalLinks.instagramRobotikUrl">
                  Instagram Robotik
                </Label>
                <Input
                  id="externalLinks.instagramRobotikUrl"
                  type="url"
                  placeholder="https://instagram.com/robotikpnp"
                  {...register("externalLinks.instagramRobotikUrl")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="externalLinks.instagramMrcUrl">
                  Instagram MRC
                </Label>
                <Input
                  id="externalLinks.instagramMrcUrl"
                  type="url"
                  placeholder="https://instagram.com/mrcpnp"
                  {...register("externalLinks.instagramMrcUrl")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="externalLinks.youtubeRobotikUrl">
                  YouTube Robotik
                </Label>
                <Input
                  id="externalLinks.youtubeRobotikUrl"
                  type="url"
                  placeholder="https://youtube.com/@robotikpnp"
                  {...register("externalLinks.youtubeRobotikUrl")}
                />
              </div>
            </CardContent>
          </Card>

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
