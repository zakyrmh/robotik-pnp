"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { internshipService } from "@/lib/firebase/services/internship-service";
import { RollingInternshipForm } from "./_components/RollingInternshipForm";
import { DepartmentInternshipForm } from "./_components/DepartmentInternshipForm";
import { InternshipLogbook } from "./_components/InternshipLogbook";
import { RollingScheduleView } from "./_components/RollingScheduleView";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import {
  type RollingInternshipRegistration,
  type DepartmentInternshipRegistration,
  type RollingInternshipSchedule,
} from "@/schemas/internship";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { getRecruitmentSettings } from "@/lib/firebase/services/settings-service";
import { RecruitmentSettings } from "@/schemas/recruitment-settings";
import { Clock, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default function InternshipPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = React.useState(true);

  // State
  const [hasRolling, setHasRolling] = React.useState(false);
  const [hasDepartment, setHasDepartment] = React.useState(false);
  const [schedule, setSchedule] =
    React.useState<RollingInternshipSchedule | null>(null);
  const [isScheduleVisible, setIsScheduleVisible] = React.useState(false);
  const [settings, setSettings] = React.useState<RecruitmentSettings | null>(
    null,
  );

  // Fetch Data
  React.useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const [status, fetchedSettings, fetchedSchedule, scheduleConfig] =
          await Promise.all([
            internshipService.checkRegistrationStatus(user.uid),
            getRecruitmentSettings(),
            internshipService.getRollingSchedule(user.uid),
            internshipService.getRollingScheduleConfig(),
          ]);

        setHasRolling(status.hasRolling);
        setHasDepartment(status.hasDepartment);
        setSettings(fetchedSettings);
        setSchedule(fetchedSchedule);
        setIsScheduleVisible(scheduleConfig?.isScheduleVisible ?? false);
      } catch (error) {
        console.error("Error fetching internship data:", error);
        toast.error("Gagal memuat data magang.");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      if (user) {
        fetchData();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  // Handle Submissions
  const handleRollingSubmit = async (
    data: Omit<
      RollingInternshipRegistration,
      "id" | "userId" | "createdAt" | "updatedAt" | "submittedAt" | "status"
    >,
  ) => {
    if (!user) return;
    try {
      await internshipService.submitRollingInternship(user.uid, data);
      toast.success("Pendaftaran Magang Divisi Rolling berhasil!");
      setHasRolling(true);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const handleDepartmentSubmit = async (
    data: Omit<
      DepartmentInternshipRegistration,
      "id" | "userId" | "createdAt" | "updatedAt" | "submittedAt" | "status"
    >,
  ) => {
    if (!user) return;
    try {
      await internshipService.submitDepartmentInternship(user.uid, data);
      toast.success("Pendaftaran Magang Departemen berhasil!");
      setHasDepartment(true);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Loading State
  if (authLoading || loading) {
    return (
      <div className="container py-8 space-y-8">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  // LOGIC: Check Registration Status
  // If user has completed ANY registration step, show Logbook/Dashboard
  // Or if they are in the middle of the process (Rolling done, Dept not done)
  // we should check if they can proceed.
  // However, user requirement: "Jika pendaftaran tutup dan user sudah daftar magang -> tampilkan halaman logbook"
  // Interpret: "Sudah daftar" = hasRolling (at least).
  const isRegistered = hasRolling;

  if (isRegistered) {
    // If they have Rolling but not Department, effectively they are in the "Logbook" view
    // where they usually see their progress.
    // If Department form is part of the flow, we should usually show it.
    // But if closed, we fall back to Logbook/Status view.

    // Check if Department registration is still possible (open)
    // If open -> Show Department Form (if !hasDepartment)
    // If closed -> Show Logbook (Status only)

    // For now, let's keep simple: Show Logbook if both done, or show Department form if pending.
    // BUT we must check if registration is closed for Department form.

    // Let's rely on the requested logic: "If registration closed AND user already registered -> Logbook".
    // Is "user registered" = hasRolling? Yes.

    // Logic for "Registration Closed":
    // 1. settings.isInternshipOpen is false
    // 2. OR now > specific Close Date

    const now = new Date();
    const isOpen = settings?.isInternshipOpen ?? false;
    const openDate = settings?.internshipSchedule?.openDate
      ? settings.internshipSchedule.openDate
      : null;
    const closeDate = settings?.internshipSchedule?.closeDate
      ? settings.internshipSchedule.closeDate
      : null;

    const isClosed =
      !isOpen || (closeDate && now > closeDate) || (openDate && now < openDate);

    // Specific case: Rolling done, Dept pending, but Closed -> Logbook
    // Specific case: Rolling done, Dept pending, Open -> Dept Form
    if (hasRolling && !hasDepartment && !isClosed) {
      return (
        <div className="container py-8 flex flex-col items-center">
          <div className="mb-8 text-center space-y-2">
            <h1 className="text-3xl font-bold">Pendaftaran Magang</h1>
            <p className="text-muted-foreground">
              Langkah 2 dari 2: Magang Departemen
            </p>
          </div>
          <DepartmentInternshipForm onSubmit={handleDepartmentSubmit} />
        </div>
      );
    }

    // Default for registered users (Complete or Closed-Pending): Logbook + Schedule
    return (
      <div className="container py-8 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Magang
          </h1>
          <p className="text-muted-foreground mt-1">
            Pantau jadwal dan progres magang kamu.
          </p>
        </div>

        <Tabs defaultValue={schedule ? "schedule" : "logbook"}>
          <TabsList>
            <TabsTrigger value="schedule">Jadwal Magang</TabsTrigger>
            <TabsTrigger value="logbook">Logbook</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="mt-4">
            {schedule && isScheduleVisible ? (
              <RollingScheduleView schedule={schedule} />
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-1">
                    Jadwal Belum Tersedia
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {!isScheduleVisible && schedule
                      ? "Jadwal Anda sedang dalam tahap finalisasi oleh admin. Harap tunggu informasi lebih lanjut."
                      : "Jadwal magang rolling belum di-generate oleh admin. Silakan hubungi admin untuk informasi lebih lanjut."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="logbook" className="mt-4">
            <InternshipLogbook />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // LOGIC: User NOT Registered (No Rolling)
  // Check Dates and Toggle
  const now = new Date();
  const isOpen = settings?.isInternshipOpen ?? false;
  // Fallback dates if not set (should be set if Schema is followed)
  const openDate = settings?.internshipSchedule?.openDate;
  const closeDate = settings?.internshipSchedule?.closeDate;

  // Case 1: Not Open Yet (Future Date)
  if (openDate && now < openDate) {
    return (
      <div className="container py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Clock className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Pendaftaran Belum Dibuka</h1>
            <p className="text-muted-foreground">
              Mohon bersabar, pendaftaran magang akan segera dibuka. Catat
              tanggalnya!
            </p>
          </div>
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Dibuka</p>
                  <p className="font-semibold">
                    {format(openDate, "dd MMMM yyyy", { locale: id })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(openDate, "HH:mm")} WIB
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Ditutup</p>
                  <p className="font-semibold">
                    {closeDate
                      ? format(closeDate, "dd MMMM yyyy", { locale: id })
                      : "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {closeDate ? format(closeDate, "HH:mm") + " WIB" : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Button asChild variant="outline">
            <Link href="/dashboard">Kembali ke Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Case 2: Closed (Past Date OR Manually Closed)
  // Note: If isOpen is FALSE, we treat as Closed regardless of date (Master Switch)
  // OR if Date has passed.
  if (!isOpen || (closeDate && now > closeDate)) {
    return (
      <div className="container py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
            <Lock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Pendaftaran Ditutup</h1>
            <p className="text-muted-foreground leading-relaxed">
              Mohon maaf, pendaftaran magang saat ini telah ditutup. Apabila
              Anda memiliki kendala atau pertanyaan lebih lanjut, silakan
              hubungi admin atau narahubung terkait.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full">
            {settings?.contactPerson?.[0] && (
              <Button
                asChild
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Link
                  href={`https://wa.me/${settings.contactPerson[0].whatsapp}`}
                  target="_blank"
                >
                  Hubungi Admin ({settings.contactPerson[0].name})
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">Kembali ke Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Open and Not Registered -> Show Rolling Form
  return (
    <div className="container py-8 flex flex-col items-center">
      <div className="mb-8 text-center space-y-2">
        <h1 className="text-3xl font-bold">Pendaftaran Magang</h1>
        <p className="text-muted-foreground">
          Langkah 1 dari 2: Magang Divisi Rolling
        </p>
      </div>
      <RollingInternshipForm onSubmit={handleRollingSubmit} />
    </div>
  );
}
