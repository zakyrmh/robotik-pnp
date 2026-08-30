"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  CheckmarkCircle01Icon,
  UserGroupIcon,
  Task01Icon,
  Shield01Icon,
  ArrowRight01Icon,
  Location01Icon,
  Clock01Icon,
  CleanIcon,
  SecurityCheckIcon,
  AlertCircleIcon,
  ComputerIcon,
  Layers01Icon,
  Settings02Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DisciplineWidget } from "@/components/features/komdis/discipline-widget";

export interface ActivitySummary {
  id: string;
  title: string;
  start_date: string;
  location: string | null;
  attendanceStatus?: "hadir" | "telat" | "izin" | "sakit" | "alfa" | null;
}

export interface SuperAdminDashboardStats {
  userBreakdown: {
    superAdmin: number;
    adminOr: number;
    adminKomdis: number;
    anggota: number;
    caang: number;
    totalActive: number;
    totalArchived: number;
  };
  operational: {
    totalActivities: number;
    upcomingActivitiesCount: number;
    pendingLeavesCount: number;
    pendingSubmissionsCount: number;
    activeSanctionsCount: number;
    totalPiketLogs: number;
    totalAttendances: number;
  };
  upcomingActivities: ActivitySummary[];
  recentAuditLogs: {
    id: string;
    actionType: string;
    actorName: string | null;
    actorRole: string | null;
    targetUserName: string | null;
    details: string | null;
    ipAddress: string | null;
    createdAt: string;
  }[];
}

export interface DashboardData {
  profile: {
    id: string;
    role: string;
    nim: string | null;
    fullName: string;
  };
  discipline: {
    netPoints: number;
    activeSpLevel: number | null;
  };
  caangStats?: {
    groupName: string | null;
    divisionName: string | null;
    totalTasks: number;
    submittedTasks: number;
    averageGrade: number;
    presentCount: number;
    totalAttendances: number;
  };
  anggotaStats?: {
    piketDays: string[];
    piketLogsCount: number;
    isScheduledToday: boolean;
    hadirCount: number;
    telatCount: number;
    izinCount: number;
    alfaCount: number;
    totalAttendances: number;
    upcomingActivities: ActivitySummary[];
  };
  adminOrStats?: {
    totalCaangs: number;
    totalAnggota: number;
    totalGroups: number;
    pendingSubmissions: number;
    totalTasks: number;
  };
  adminKomdisStats?: {
    pendingLeaves: number;
    todayActivitiesCount: number;
    todayAttendancesCount: number;
    activeSanctionsCount: number;
    piketDays: string[];
    piketLogsCount: number;
    isScheduledToday: boolean;
    upcomingActivities: ActivitySummary[];
  };
  superAdminStats?: SuperAdminDashboardStats;
}

interface DashboardClientProps {
  data: DashboardData;
}

export function DashboardClient({ data }: DashboardClientProps) {
  const { profile, discipline } = data;

  const roleLabels: Record<string, string> = {
    caang: "Calon Anggota",
    anggota: "Anggota Aktif",
    "admin-or": "Admin OR",
    "admin-komdis": "Admin Komdis",
    "super-admin": "Super Admin",
  };

  const getRoleBadge = (role: string) => {
    if (role === "super-admin") {
      return (
        <Badge className="bg-primary/10 text-primary border border-primary/20 font-mono text-xs uppercase px-3 py-1 rounded-full">
          SUPER ADMIN
        </Badge>
      );
    }
    if (role.startsWith("admin")) {
      return (
        <Badge className="bg-accent-soft text-accent-deep border border-accent/20 font-mono text-xs uppercase px-3 py-1 rounded-full">
          {roleLabels[role] || role}
        </Badge>
      );
    }
    if (role === "anggota") {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono text-xs uppercase px-3 py-1 rounded-full">
          ANGGOTA AKTIF
        </Badge>
      );
    }
    return (
      <Badge className="bg-primary-soft text-primary border border-primary/20 font-mono text-xs uppercase px-3 py-1 rounded-full">
        CALON ANGGOTA
      </Badge>
    );
  };

  const getActionBadgeClass = (action: string) => {
    if (action.includes("DELETE") || action.includes("REVOKE")) {
      return "bg-destructive/10 text-destructive border-destructive/20";
    }
    if (action.includes("UPDATE") || action.includes("ADJUST")) {
      return "bg-primary-soft text-primary border-primary/20";
    }
    if (action.includes("CREATE") || action.includes("RESTORE")) {
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
    }
    if (action.includes("SANCTION") || action.includes("WARN")) {
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    }
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto px-2 sm:px-4 lg:px-6">
      {/* Welcome Banner Card - Minimalist Soft Style */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative border border-border bg-card p-4 sm:p-6 rounded-2xl shadow-xs overflow-hidden">
          {/* Top Primary Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-primary-hover to-accent" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block">
                SELAMAT DATANG KEMBALI,
              </span>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground font-display mt-0.5">
                {profile.fullName}
              </h1>
              {profile.nim && (
                <p className="text-xs font-mono text-primary mt-1">
                  NIM: {profile.nim}
                </p>
              )}
            </div>

            <div className="shrink-0">{getRoleBadge(profile.role)}</div>
          </div>
        </div>
      </motion.div>

      {/* ==================================================== */}
      {/* 1. ANGGOTA DASHBOARD VIEW                            */}
      {/* ==================================================== */}
      {profile.role === "anggota" && data.anggotaStats && (
        <div className="space-y-6">
          {/* Quick Access Shortcuts Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/kegiatan" className="group">
              <div className="border border-border bg-card p-4 rounded-xl shadow-xs hover:border-primary transition-all flex items-center justify-between min-h-[44px]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary-soft text-primary">
                    <HugeiconsIcon icon={Calendar03Icon} size={20} />
                  </div>
                  <div>
                    <span className="font-display font-medium text-sm text-foreground block group-hover:text-primary transition-colors">
                      Agenda Kegiatan
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      Jadwal Workshop &amp; Rapat
                    </span>
                  </div>
                </div>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  className="text-muted-foreground group-hover:translate-x-1 transition-transform"
                />
              </div>
            </Link>

            <Link href="/presensi" className="group">
              <div className="border border-border bg-card p-4 rounded-xl shadow-xs hover:border-emerald-500 transition-all flex items-center justify-between min-h-[44px]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} />
                  </div>
                  <div>
                    <span className="font-display font-medium text-sm text-foreground block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Histori Absensi
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      Riwayat Presensi Anda
                    </span>
                  </div>
                </div>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  className="text-muted-foreground group-hover:translate-x-1 transition-transform"
                />
              </div>
            </Link>

            <Link href="/piket" className="group">
              <div className="border border-border bg-card p-4 rounded-xl shadow-xs hover:border-accent transition-all flex items-center justify-between min-h-[44px]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-accent-soft text-accent-deep">
                    <HugeiconsIcon icon={CleanIcon} size={20} />
                  </div>
                  <div>
                    <span className="font-display font-medium text-sm text-foreground block group-hover:text-accent transition-colors">
                      Piket Laboratorium
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      Jadwal &amp; Laporan Kebersihan
                    </span>
                  </div>
                </div>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  className="text-muted-foreground group-hover:translate-x-1 transition-transform"
                />
              </div>
            </Link>
          </div>

          {/* Agenda Kegiatan Keanggotaan */}
          <Card className="bg-card border border-border rounded-2xl shadow-xs">
            <CardHeader className="border-b border-border pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-display font-semibold text-foreground flex items-center gap-2">
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    size={18}
                    className="text-primary"
                  />
                  <span>Agenda Kegiatan Keanggotaan</span>
                </CardTitle>
                <CardDescription className="text-xs font-mono text-muted-foreground">
                  Daftar kegiatan UKM Robotik PNP yang perlu Anda ikuti.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-xs font-mono text-primary min-h-[44px]"
              >
                <Link href="/kegiatan">Semua &rarr;</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {data.anggotaStats.upcomingActivities.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground font-mono text-xs">
                  Belum ada agenda kegiatan mendatang.
                </div>
              ) : (
                data.anggotaStats.upcomingActivities.map((act) => (
                  <div
                    key={act.id}
                    className="border border-border bg-surface/50 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                  >
                    <div className="space-y-1">
                      <span className="font-display font-medium text-sm text-foreground block">
                        {act.title}
                      </span>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                        <span className="flex items-center gap-1">
                          <HugeiconsIcon icon={Clock01Icon} size={13} />
                          {new Date(act.start_date).toLocaleDateString(
                            "id-ID",
                            {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <HugeiconsIcon icon={Location01Icon} size={13} />
                          {act.location || "Lab Robotik"}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      asChild
                      className="bg-primary hover:bg-primary-hover text-primary-foreground font-mono text-xs min-h-[38px] px-3 rounded-lg shrink-0"
                    >
                      <Link href={`/presensi/${act.id}`}>
                        Absen Sekarang
                      </Link>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Statistik Kehadiran Anda */}
          <Card className="bg-card border border-border rounded-2xl shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  size={18}
                  className="text-emerald-600 dark:text-emerald-400"
                />
                <span>Statistik Kehadiran Anda</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="border border-border bg-surface/60 p-3 rounded-xl text-center border-l-4 border-l-emerald-500">
                  <span className="font-mono text-[10px] uppercase text-muted-foreground block">
                    HADIR
                  </span>
                  <span className="font-display text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {data.anggotaStats.hadirCount}
                  </span>
                </div>

                <div className="border border-border bg-surface/60 p-3 rounded-xl text-center border-l-4 border-l-amber-500">
                  <span className="font-mono text-[10px] uppercase text-muted-foreground block">
                    TELAT
                  </span>
                  <span className="font-display text-xl font-bold text-amber-600 dark:text-amber-400">
                    {data.anggotaStats.telatCount}
                  </span>
                </div>

                <div className="border border-border bg-surface/60 p-3 rounded-xl text-center border-l-4 border-l-primary">
                  <span className="font-mono text-[10px] uppercase text-muted-foreground block">
                    IZIN / SAKIT
                  </span>
                  <span className="font-display text-xl font-bold text-primary">
                    {data.anggotaStats.izinCount}
                  </span>
                </div>

                <div className="border border-border bg-surface/60 p-3 rounded-xl text-center border-l-4 border-l-destructive">
                  <span className="font-mono text-[10px] uppercase text-muted-foreground block">
                    ALFA
                  </span>
                  <span className="font-display text-xl font-bold text-destructive">
                    {data.anggotaStats.alfaCount}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Widget Kedisiplinan Organisasi */}
          {discipline && (
            <DisciplineWidget
              netPoints={discipline.netPoints}
              activeSpLevel={discipline.activeSpLevel}
            />
          )}

          {/* Status Penugasan Piket Kebersihan Anda */}
          <Card className="bg-card border border-border rounded-2xl border-l-4 border-l-accent shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
                <HugeiconsIcon
                  icon={CleanIcon}
                  size={18}
                  className="text-accent"
                />
                <span>Status Penugasan Piket Kebersihan Anda</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-surface/60 rounded-xl border border-border font-mono text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">JADWAL HARI:</span>
                  {data.anggotaStats.piketDays.length > 0 ? (
                    <div className="flex gap-1 flex-wrap">
                      {data.anggotaStats.piketDays.map((day) => (
                        <Badge
                          key={day}
                          className="bg-accent-soft text-accent-deep border border-accent/20 text-[10px] rounded-full px-2"
                        >
                          {day}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-muted-foreground text-[10px]"
                    >
                      TIDAK ADA
                    </Badge>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-muted-foreground">LAPORAN MASUK:</span>
                  <span className="font-bold text-foreground text-sm">
                    {data.anggotaStats.piketLogsCount} Laporan
                  </span>
                </div>
              </div>

              {data.anggotaStats.isScheduledToday ? (
                <div className="space-y-2">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-300 font-mono">
                    ⚠️ <strong>PERHATIAN:</strong> Hari ini adalah jadwal piket
                    Anda! Harap kirim laporan sebelum lab tutup.
                  </div>
                  <Button
                    asChild
                    className="w-full bg-accent hover:bg-accent-deep text-accent-foreground font-mono text-xs rounded-xl min-h-[44px] shadow-xs uppercase"
                  >
                    <Link href="/piket">Kirim Laporan Piket</Link>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  asChild
                  className="w-full border-border font-mono text-xs rounded-xl min-h-[44px]"
                >
                  <Link href="/piket">Lihat Modul Piket</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. CAANG DASHBOARD VIEW                              */}
      {/* ==================================================== */}
      {profile.role === "caang" && data.caangStats && (
        <div className="space-y-6">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {/* Card: Group & Division info */}
            <Card className="bg-card border border-border rounded-2xl shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
                  <HugeiconsIcon
                    icon={UserGroupIcon}
                    size={18}
                    className="text-primary"
                  />
                  <span>Informasi Pendaftaran</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-surface/60 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase">
                    Kelompok Anda
                  </p>
                  <p className="text-sm font-bold font-display text-foreground mt-0.5">
                    {data.caangStats.groupName || "Belum Ditetapkan"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-surface/60 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase">
                    Divisi Magang
                  </p>
                  <p className="text-sm font-bold font-display text-foreground mt-0.5">
                    {data.caangStats.divisionName || "Belum Memilih"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card: Tasks Statistics */}
            <Card className="bg-card border border-border rounded-2xl shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
                  <HugeiconsIcon
                    icon={Task01Icon}
                    size={18}
                    className="text-accent"
                  />
                  <span>Penyelesaian Tugas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6 space-y-3">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="38"
                      className="stroke-muted"
                      strokeWidth="7"
                      fill="transparent"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="38"
                      className="stroke-primary"
                      strokeWidth="7"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 38}
                      strokeDashoffset={
                        2 *
                        Math.PI *
                        38 *
                        (1 -
                          (data.caangStats.totalTasks > 0
                            ? data.caangStats.submittedTasks /
                              data.caangStats.totalTasks
                            : 0))
                      }
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-lg font-bold font-mono text-foreground">
                      {data.caangStats.submittedTasks}/
                      {data.caangStats.totalTasks}
                    </span>
                    <span className="text-[8px] text-muted-foreground font-mono uppercase">
                      Tugas
                    </span>
                  </div>
                </div>
                <div className="text-center font-mono text-xs">
                  <p className="text-muted-foreground">Rata-rata Nilai:</p>
                  <p className="text-base font-bold text-primary">
                    {data.caangStats.averageGrade} / 100
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card: Attendance stats */}
            <Card className="bg-card border border-border rounded-2xl shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    size={18}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                  <span>Kehadiran Agenda</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6 space-y-3">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="38"
                      className="stroke-muted"
                      strokeWidth="7"
                      fill="transparent"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="38"
                      className="stroke-emerald-500"
                      strokeWidth="7"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 38}
                      strokeDashoffset={
                        2 *
                        Math.PI *
                        38 *
                        (1 -
                          (data.caangStats.totalAttendances > 0
                            ? data.caangStats.presentCount /
                              data.caangStats.totalAttendances
                            : 0))
                      }
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-lg font-bold font-mono text-foreground">
                      {data.caangStats.totalAttendances > 0
                        ? Math.round(
                            (data.caangStats.presentCount /
                              data.caangStats.totalAttendances) *
                              100,
                          )
                        : 0}
                      %
                    </span>
                    <span className="text-[8px] text-muted-foreground font-mono uppercase">
                      Hadir
                    </span>
                  </div>
                </div>
                <div className="text-center font-mono text-xs text-muted-foreground">
                  <p>
                    Hadir{" "}
                    <span className="font-bold text-foreground">
                      {data.caangStats.presentCount}
                    </span>{" "}
                    dari{" "}
                    <span className="font-bold text-foreground">
                      {data.caangStats.totalAttendances}
                    </span>{" "}
                    agenda.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Widget Kedisiplinan Organisasi */}
          {discipline && (
            <DisciplineWidget
              netPoints={discipline.netPoints}
              activeSpLevel={discipline.activeSpLevel}
            />
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. ADMIN OR DASHBOARD VIEW                           */}
      {/* ==================================================== */}
      {profile.role === "admin-or" && data.adminOrStats && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-card border border-border rounded-2xl shadow-xs p-4 flex justify-between items-center min-h-[44px]">
            <div>
              <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                TOTAL CALON ANGGOTA
              </span>
              <span className="font-display text-3xl font-bold text-foreground mt-1 block">
                {data.adminOrStats.totalCaangs}
              </span>
            </div>
            <div className="p-3 bg-primary-soft text-primary rounded-xl">
              <HugeiconsIcon icon={UserGroupIcon} size={24} />
            </div>
          </Card>

          <Card className="bg-card border border-border rounded-2xl shadow-xs p-4 flex justify-between items-center min-h-[44px]">
            <div>
              <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                TOTAL ANGGOTA AKTIF
              </span>
              <span className="font-display text-3xl font-bold text-foreground mt-1 block">
                {data.adminOrStats.totalAnggota}
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <HugeiconsIcon icon={UserGroupIcon} size={24} />
            </div>
          </Card>

          <Card className="bg-card border border-border rounded-2xl shadow-xs p-4 flex justify-between items-center min-h-[44px]">
            <div>
              <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                SUBMISSION PERLU DIPERIKSA
              </span>
              <span className="font-display text-3xl font-bold text-accent mt-1 block">
                {data.adminOrStats.pendingSubmissions}
              </span>
            </div>
            <div className="p-3 bg-accent-soft text-accent-deep rounded-xl">
              <HugeiconsIcon icon={Task01Icon} size={24} />
            </div>
          </Card>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. ADMIN KOMDIS DASHBOARD VIEW                       */}
      {/* ==================================================== */}
      {profile.role === "admin-komdis" && data.adminKomdisStats && (
        <div className="space-y-6">
          {/* Quick Access Shortcuts Bar for Admin Komdis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/kegiatan" className="group">
              <div className="border border-border bg-card p-4 rounded-xl shadow-xs hover:border-primary transition-all flex items-center justify-between min-h-[44px]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary-soft text-primary">
                    <HugeiconsIcon icon={Calendar03Icon} size={20} />
                  </div>
                  <div>
                    <span className="font-display font-medium text-sm text-foreground block group-hover:text-primary transition-colors">
                      Kegiatan &amp; Presensi
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      Kelola Agenda Anggota
                    </span>
                  </div>
                </div>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  className="text-muted-foreground group-hover:translate-x-1 transition-transform"
                />
              </div>
            </Link>

            <Link href="/perizinan" className="group">
              <div className="border border-border bg-card p-4 rounded-xl shadow-xs hover:border-destructive transition-all flex items-center justify-between min-h-[44px]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive">
                    <HugeiconsIcon icon={Shield01Icon} size={20} />
                  </div>
                  <div>
                    <span className="font-display font-medium text-sm text-foreground block group-hover:text-destructive transition-colors">
                      Perizinan &amp; Izin
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      Verifikasi Dispensasi
                    </span>
                  </div>
                </div>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  className="text-muted-foreground group-hover:translate-x-1 transition-transform"
                />
              </div>
            </Link>

            <Link href="/kedisiplinan" className="group">
              <div className="border border-border bg-card p-4 rounded-xl shadow-xs hover:border-purple-500 transition-all flex items-center justify-between min-h-[44px]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <HugeiconsIcon icon={Task01Icon} size={20} />
                  </div>
                  <div>
                    <span className="font-display font-medium text-sm text-foreground block group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      Kedisiplinan &amp; SP
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      Poin &amp; Sanksi Anggota
                    </span>
                  </div>
                </div>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  className="text-muted-foreground group-hover:translate-x-1 transition-transform"
                />
              </div>
            </Link>

            <Link href="/piket" className="group">
              <div className="border border-border bg-card p-4 rounded-xl shadow-xs hover:border-accent transition-all flex items-center justify-between min-h-[44px]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-accent-soft text-accent-deep">
                    <HugeiconsIcon icon={CleanIcon} size={20} />
                  </div>
                  <div>
                    <span className="font-display font-medium text-sm text-foreground block group-hover:text-accent transition-colors">
                      Piket Saya
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      Laporan Kebersihan
                    </span>
                  </div>
                </div>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  className="text-muted-foreground group-hover:translate-x-1 transition-transform"
                />
              </div>
            </Link>
          </div>

          {/* Telemetry Stat Cards Grid */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card border border-border rounded-2xl shadow-xs p-4 flex flex-row items-center justify-between border-l-4 border-l-destructive min-h-[88px]">
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block truncate">
                  DISPENSASI PENDING
                </span>
                <span className="font-display text-3xl font-bold text-destructive mt-1 block leading-none">
                  {data.adminKomdisStats.pendingLeaves}
                </span>
              </div>
              <div className="p-3 bg-destructive/10 text-destructive rounded-xl shrink-0 flex items-center justify-center">
                <HugeiconsIcon icon={Shield01Icon} size={22} />
              </div>
            </Card>

            <Card className="bg-card border border-border rounded-2xl shadow-xs p-4 flex flex-row items-center justify-between border-l-4 border-l-amber-500 min-h-[88px]">
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block truncate">
                  AGENDA HARI INI
                </span>
                <span className="font-display text-3xl font-bold text-foreground mt-1 block leading-none">
                  {data.adminKomdisStats.todayActivitiesCount}
                </span>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 flex items-center justify-center">
                <HugeiconsIcon icon={Calendar03Icon} size={22} />
              </div>
            </Card>

            <Card className="bg-card border border-border rounded-2xl shadow-xs p-4 flex flex-row items-center justify-between border-l-4 border-l-emerald-500 min-h-[88px]">
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block truncate">
                  ABSENSI MASUK HARI INI
                </span>
                <span className="font-display text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block leading-none">
                  {data.adminKomdisStats.todayAttendancesCount}
                </span>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0 flex items-center justify-center">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={22} />
              </div>
            </Card>

            <Card className="bg-card border border-border rounded-2xl shadow-xs p-4 flex flex-row items-center justify-between border-l-4 border-l-purple-500 min-h-[88px]">
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block truncate">
                  SANKSI SP AKTIF
                </span>
                <span className="font-display text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1 block leading-none">
                  {data.adminKomdisStats.activeSanctionsCount}
                </span>
              </div>
              <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl shrink-0 flex items-center justify-center">
                <HugeiconsIcon icon={Task01Icon} size={22} />
              </div>
            </Card>
          </div>

          {/* Agenda Kegiatan Keanggotaan */}
          <Card className="bg-card border border-border rounded-2xl shadow-xs">
            <CardHeader className="border-b border-border pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-display font-semibold text-foreground flex items-center gap-2">
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    size={18}
                    className="text-primary"
                  />
                  <span>Agenda Kegiatan Keanggotaan</span>
                </CardTitle>
                <CardDescription className="text-xs font-mono text-muted-foreground">
                  Pelatihan, Rapat, dan Workshop Anggota Aktif UKM Robotik.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-xs font-mono text-primary min-h-[44px]"
              >
                <Link href="/kegiatan">Semua &rarr;</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {data.adminKomdisStats.upcomingActivities.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground font-mono text-xs">
                  Belum ada agenda kegiatan mendatang.
                </div>
              ) : (
                data.adminKomdisStats.upcomingActivities.map((act) => (
                  <div
                    key={act.id}
                    className="border border-border bg-surface/50 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                  >
                    <div className="space-y-1">
                      <span className="font-display font-medium text-sm text-foreground block">
                        {act.title}
                      </span>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                        <span className="flex items-center gap-1">
                          <HugeiconsIcon icon={Clock01Icon} size={13} />
                          {new Date(act.start_date).toLocaleDateString(
                            "id-ID",
                            {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <HugeiconsIcon icon={Location01Icon} size={13} />
                          {act.location || "Lab Robotik"}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      asChild
                      className="bg-primary hover:bg-primary-hover text-primary-foreground font-mono text-xs min-h-[38px] px-3 rounded-lg shrink-0"
                    >
                      <Link href={`/presensi/${act.id}`}>
                        Detail Presensi
                      </Link>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Widget Kedisiplinan Organisasi */}
          {discipline && (
            <DisciplineWidget
              netPoints={discipline.netPoints}
              activeSpLevel={discipline.activeSpLevel}
            />
          )}

          {/* Status Penugasan Piket Kebersihan Anda */}
          <Card className="bg-card border border-border rounded-2xl border-l-4 border-l-accent shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
                <HugeiconsIcon
                  icon={CleanIcon}
                  size={18}
                  className="text-accent"
                />
                <span>Status Penugasan Piket Kebersihan Anda</span>
              </CardTitle>
              <CardDescription className="text-xs font-mono text-muted-foreground">
                Jadwal piket Sekre &amp; Workshop dilakukan berkala. Submit
                laporan foto piket saat giliran Anda (diverifikasi oleh Admin
                Kestari).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-surface/60 rounded-xl border border-border font-mono text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    JADWAL SHIFT HARI:
                  </span>
                  {data.adminKomdisStats.piketDays.length > 0 ? (
                    <div className="flex gap-1 flex-wrap">
                      {data.adminKomdisStats.piketDays.map((day) => (
                        <Badge
                          key={day}
                          className="bg-accent-soft text-accent-deep border border-accent/20 text-[10px] rounded-full px-2"
                        >
                          {day}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-muted-foreground text-[10px]"
                    >
                      TIDAK ADA JADWAL HARI INI
                    </Badge>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-muted-foreground">
                    TOTAL LAPORAN DIKIRIM:
                  </span>
                  <span className="font-bold text-foreground text-sm">
                    {data.adminKomdisStats.piketLogsCount} Laporan
                  </span>
                </div>
              </div>

              {data.adminKomdisStats.isScheduledToday ? (
                <div className="space-y-2">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-300 font-mono">
                    ⚠️ <strong>PERHATIAN:</strong> Hari ini giliran piket Anda!
                    Harap unggah foto bukti kebersihan sebelum ruangan ditutup.
                  </div>
                  <Button
                    asChild
                    className="w-full bg-accent hover:bg-accent-deep text-accent-foreground font-mono text-xs rounded-xl min-h-[44px] shadow-xs uppercase"
                  >
                    <Link href="/piket">Submit Laporan Piket</Link>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  asChild
                  className="w-full border-border font-mono text-xs rounded-xl min-h-[44px]"
                >
                  <Link href="/piket">Lihat Modul Piket</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. SUPER ADMIN COMPREHENSIVE TELEMETRY DASHBOARD     */}
      {/* ==================================================== */}
      {profile.role === "super-admin" && data.superAdminStats && (
        <div className="space-y-6">
          {/* Security & System Compliance Status Banner */}
          <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <HugeiconsIcon icon={SecurityCheckIcon} size={24} />
              </div>
              <div>
                <h2 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
                  <span>
                    Integritas Sistem &amp; Kepatuhan UU PDP No. 27/2022
                  </span>
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] rounded-full px-2">
                    ACTIVE
                  </Badge>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  PostgreSQL anti-tampering trigger enforced, automated PII
                  masking, dan rate limiting berjalan 100%.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-xs font-medium border-border min-h-[40px] px-3.5 rounded-xl self-start md:self-auto"
            >
              <Link href="/audit-log" className="flex items-center gap-1.5">
                <span>Inspeksi Audit Trail</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </Link>
            </Button>
          </div>

          {/* Key Metric Operational Cards Grid */}
          <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. Pengguna Aktif */}
            <Link href="/manajemen-akun" className="group">
              <Card className="bg-card border border-border rounded-2xl shadow-xs p-4 flex flex-row items-center justify-between border-l-4 border-l-primary group-hover:border-primary transition-all min-h-[92px]">
                <div className="flex flex-col justify-center min-w-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block truncate">
                    PENGGUNA AKTIF
                  </span>
                  <span className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1 block leading-none">
                    {data.superAdminStats.userBreakdown.totalActive}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-1 font-mono">
                    {data.superAdminStats.userBreakdown.totalArchived} Terarsip
                  </span>
                </div>
                <div className="p-3 bg-primary-soft text-primary rounded-xl shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <HugeiconsIcon icon={UserGroupIcon} size={22} />
                </div>
              </Card>
            </Link>

            {/* 2. Dispensasi Pending */}
            <Link href="/perizinan" className="group">
              <Card className="bg-card border border-border rounded-2xl shadow-xs p-4 flex flex-row items-center justify-between border-l-4 border-l-amber-500 group-hover:border-amber-500 transition-all min-h-[92px]">
                <div className="flex flex-col justify-center min-w-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block truncate">
                    DISPENSASI PENDING
                  </span>
                  <span className="font-display text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1 block leading-none">
                    {data.superAdminStats.operational.pendingLeavesCount}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-1 font-mono">
                    Perlu Verifikasi Komdis
                  </span>
                </div>
                <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <HugeiconsIcon icon={Shield01Icon} size={22} />
                </div>
              </Card>
            </Link>

            {/* 3. Tugas Caang Menunggu Penilaian */}
            <Link href="/manajemen-caang" className="group">
              <Card className="bg-card border border-border rounded-2xl shadow-xs p-4 flex flex-row items-center justify-between border-l-4 border-l-accent group-hover:border-accent transition-all min-h-[92px]">
                <div className="flex flex-col justify-center min-w-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block truncate">
                    TUGAS CAANG PENDING
                  </span>
                  <span className="font-display text-2xl sm:text-3xl font-bold text-accent mt-1 block leading-none">
                    {data.superAdminStats.operational.pendingSubmissionsCount}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-1 font-mono">
                    Perlu Penilaian OR
                  </span>
                </div>
                <div className="p-3 bg-accent-soft text-accent-deep rounded-xl shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <HugeiconsIcon icon={Task01Icon} size={22} />
                </div>
              </Card>
            </Link>

            {/* 4. Sanksi SP Aktif */}
            <Link href="/kedisiplinan" className="group">
              <Card className="bg-card border border-border rounded-2xl shadow-xs p-4 flex flex-row items-center justify-between border-l-4 border-l-destructive group-hover:border-destructive transition-all min-h-[92px]">
                <div className="flex flex-col justify-center min-w-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block truncate">
                    SANKSI SP AKTIF
                  </span>
                  <span className="font-display text-2xl sm:text-3xl font-bold text-destructive mt-1 block leading-none">
                    {data.superAdminStats.operational.activeSanctionsCount}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-1 font-mono">
                    Peringatan Disiplin
                  </span>
                </div>
                <div className="p-3 bg-destructive/10 text-destructive rounded-xl shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <HugeiconsIcon icon={AlertCircleIcon} size={22} />
                </div>
              </Card>
            </Link>
          </div>

          {/* Role Breakdown Mini Bar */}
          <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-display font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <HugeiconsIcon
                  icon={UserGroupIcon}
                  size={15}
                  className="text-primary"
                />
                <span>Distribusi Pengguna Berdasarkan Role</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-xs font-mono text-primary h-7 px-2 hover:bg-primary-soft"
              >
                <Link href="/manajemen-akun">Kelola Pengguna &rarr;</Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-3 rounded-xl bg-surface/80 border border-border text-center">
                <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                  Super Admin
                </span>
                <span className="font-display text-xl font-bold text-primary block mt-0.5">
                  {data.superAdminStats.userBreakdown.superAdmin}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface/80 border border-border text-center">
                <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                  Admin OR
                </span>
                <span className="font-display text-xl font-bold text-accent-deep block mt-0.5">
                  {data.superAdminStats.userBreakdown.adminOr}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface/80 border border-border text-center">
                <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                  Admin Komdis
                </span>
                <span className="font-display text-xl font-bold text-purple-600 dark:text-purple-400 block mt-0.5">
                  {data.superAdminStats.userBreakdown.adminKomdis}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface/80 border border-border text-center">
                <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                  Anggota Aktif
                </span>
                <span className="font-display text-xl font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  {data.superAdminStats.userBreakdown.anggota}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface/80 border border-border text-center">
                <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                  Calon Anggota
                </span>
                <span className="font-display text-xl font-bold text-primary block mt-0.5">
                  {data.superAdminStats.userBreakdown.caang}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Access Operational Hub */}
          <div className="space-y-3">
            <h3 className="text-xs font-display font-semibold text-foreground uppercase tracking-wider">
              Pusat Kendali &amp; Pintasan Cepat
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Link href="/manajemen-akun" className="group">
                <div className="border border-border bg-card p-3 rounded-xl shadow-xs hover:border-primary transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[90px]">
                  <div className="p-2 rounded-lg bg-primary-soft text-primary group-hover:scale-105 transition-transform">
                    <HugeiconsIcon icon={UserIcon} size={18} />
                  </div>
                  <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                    Akun &amp; Role
                  </span>
                </div>
              </Link>

              <Link href="/manajemen-struktur" className="group">
                <div className="border border-border bg-card p-3 rounded-xl shadow-xs hover:border-primary transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[90px]">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <HugeiconsIcon icon={Layers01Icon} size={18} />
                  </div>
                  <span className="text-xs font-medium text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Struktur Organisasi
                  </span>
                </div>
              </Link>

              <Link href="/audit-log" className="group">
                <div className="border border-border bg-card p-3 rounded-xl shadow-xs hover:border-primary transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[90px]">
                  <div className="p-2 rounded-lg bg-primary-soft text-primary group-hover:scale-105 transition-transform">
                    <HugeiconsIcon icon={SecurityCheckIcon} size={18} />
                  </div>
                  <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                    Audit Log
                  </span>
                </div>
              </Link>

              <Link href="/kegiatan" className="group">
                <div className="border border-border bg-card p-3 rounded-xl shadow-xs hover:border-primary transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[90px]">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                    <HugeiconsIcon icon={Calendar03Icon} size={18} />
                  </div>
                  <span className="text-xs font-medium text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Kegiatan &amp; QR
                  </span>
                </div>
              </Link>

              <Link href="/kedisiplinan" className="group">
                <div className="border border-border bg-card p-3 rounded-xl shadow-xs hover:border-primary transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[90px]">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                    <HugeiconsIcon icon={Task01Icon} size={18} />
                  </div>
                  <span className="text-xs font-medium text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Disiplin &amp; SP
                  </span>
                </div>
              </Link>

              <Link href="/piket" className="group">
                <div className="border border-border bg-card p-3 rounded-xl shadow-xs hover:border-primary transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[90px]">
                  <div className="p-2 rounded-lg bg-accent-soft text-accent-deep group-hover:scale-105 transition-transform">
                    <HugeiconsIcon icon={CleanIcon} size={18} />
                  </div>
                  <span className="text-xs font-medium text-foreground group-hover:text-accent transition-colors">
                    Jadwal Piket
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* Dual Split Container: Recent Audit Logs & Upcoming Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Audit Logs (2 Cols) */}
            <div className="lg:col-span-2 space-y-3">
              <Card className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
                <CardHeader className="border-b border-border pb-3 flex flex-row items-center justify-between p-4 sm:p-5">
                  <div>
                    <CardTitle className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
                      <HugeiconsIcon
                        icon={SecurityCheckIcon}
                        size={17}
                        className="text-primary"
                      />
                      <span>Log Mutasi Sistem Terkini</span>
                    </CardTitle>
                    <CardDescription className="text-xs font-mono text-muted-foreground">
                      5 aktivitas mutasi administratif terbaru.
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-xs font-mono text-primary min-h-[38px] px-2.5"
                  >
                    <Link href="/audit-log">Lihat Semua &rarr;</Link>
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {data.superAdminStats.recentAuditLogs.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground font-mono text-xs">
                      Belum ada catatan mutasi audit log.
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {data.superAdminStats.recentAuditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3.5 sm:p-4 hover:bg-surface/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold border uppercase tracking-wider ${getActionBadgeClass(
                                  log.actionType,
                                )}`}
                              >
                                {log.actionType.replace(/_/g, " ")}
                              </span>
                              <span className="font-semibold text-foreground truncate max-w-[150px]">
                                {log.actorName || "Admin / Sistem"}
                              </span>
                              {log.targetUserName && (
                                <span className="text-[10px] text-muted-foreground">
                                  &rarr; {log.targetUserName}
                                </span>
                              )}
                            </div>
                            <p className="text-muted-foreground text-[11px] line-clamp-1">
                              {log.details || "-"}
                            </p>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1 text-[10px] font-mono text-muted-foreground shrink-0">
                            <span>
                              {new Date(log.createdAt).toLocaleString("id-ID", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {log.ipAddress && (
                              <span className="inline-flex items-center gap-1 bg-surface px-1.5 py-0.5 rounded border border-border text-[9px]">
                                <HugeiconsIcon icon={ComputerIcon} size={10} />
                                <span>{log.ipAddress}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Activities (1 Col) */}
            <div className="space-y-3">
              <Card className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
                <CardHeader className="border-b border-border pb-3 flex flex-row items-center justify-between p-4 sm:p-5">
                  <div>
                    <CardTitle className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
                      <HugeiconsIcon
                        icon={Calendar03Icon}
                        size={17}
                        className="text-primary"
                      />
                      <span>Agenda Terdekat</span>
                    </CardTitle>
                    <CardDescription className="text-xs font-mono text-muted-foreground">
                      Kegiatan aktif organisasi.
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-xs font-mono text-primary min-h-[38px] px-2"
                  >
                    <Link href="/kegiatan">Semua &rarr;</Link>
                  </Button>
                </CardHeader>
                <CardContent className="p-3.5 sm:p-4 space-y-2.5">
                  {data.superAdminStats.upcomingActivities.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground font-mono text-xs">
                      Belum ada agenda kegiatan mendatang.
                    </div>
                  ) : (
                    data.superAdminStats.upcomingActivities.map((act) => (
                      <div
                        key={act.id}
                        className="p-3 rounded-xl bg-surface/60 border border-border space-y-1 hover:border-primary/40 transition-colors"
                      >
                        <span className="font-display font-medium text-xs text-foreground block truncate">
                          {act.title}
                        </span>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                          <span className="flex items-center gap-1">
                            <HugeiconsIcon icon={Clock01Icon} size={11} />
                            {new Date(act.start_date).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                          <span className="truncate max-w-[100px]">
                            {act.location || "Lab Robotik"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Quick System Summary Card */}
              <Card className="bg-card border border-border rounded-2xl shadow-xs p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center gap-2 text-foreground font-semibold font-display text-xs">
                  <HugeiconsIcon
                    icon={Settings02Icon}
                    size={15}
                    className="text-primary"
                  />
                  <span>Akumulasi Presensi &amp; Piket</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-surface/80 border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase block">
                      Presensi Masuk
                    </span>
                    <span className="font-display text-base font-bold text-foreground">
                      {data.superAdminStats.operational.totalAttendances}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface/80 border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase block">
                      Laporan Piket
                    </span>
                    <span className="font-display text-base font-bold text-foreground">
                      {data.superAdminStats.operational.totalPiketLogs}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
