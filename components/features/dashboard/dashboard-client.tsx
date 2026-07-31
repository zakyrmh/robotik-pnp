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
  };
  superAdminStats?: {
    superAdmin: number;
    adminOr: number;
    adminKomdis: number;
    anggota: number;
    caang: number;
    totalPiketLogs: number;
    totalAttendances: number;
  };
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
        <Badge className="bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 font-mono text-xs uppercase px-3 py-1 rounded-full">
          SUPER ADMIN
        </Badge>
      );
    }
    if (role.startsWith("admin")) {
      return (
        <Badge className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 font-mono text-xs uppercase px-3 py-1 rounded-full">
          {roleLabels[role] || role}
        </Badge>
      );
    }
    if (role === "anggota") {
      return (
        <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 font-mono text-xs uppercase px-3 py-1 rounded-full">
          ANGGOTA AKTIFF
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-50 dark:bg-blue-950/60 text-dongker-surface dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 font-mono text-xs uppercase px-3 py-1 rounded-full">
        CALON ANGGOTA
      </Badge>
    );
  };

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto px-2 sm:px-4 lg:px-6">
      {/* Welcome Banner Card - Precision Blueprint & Tricolor Line */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-xs overflow-hidden">
          {/* Top Tricolor Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-dongker-surface via-[#3b82f6] to-pnp-orange" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
                SELAMAT DATANG KEMBALI,
              </span>
              <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-dongker-ink dark:text-slate-100 font-display mt-0.5">
                {profile.fullName}
              </h1>
              {profile.nim && (
                <p className="text-xs font-mono text-dongker-surface dark:text-blue-400 mt-1">
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
              <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xs hover:border-dongker-surface dark:hover:border-blue-500 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-dongker-surface dark:text-blue-400">
                    <HugeiconsIcon icon={Calendar03Icon} size={20} />
                  </div>
                  <div>
                    <span className="font-display font-medium text-sm text-dongker-ink dark:text-slate-100 block group-hover:text-dongker-surface dark:group-hover:text-blue-400 transition-colors">
                      Agenda Kegiatan
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                      Jadwal Workshop &amp; Rapat
                    </span>
                  </div>
                </div>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  className="text-slate-400 group-hover:translate-x-1 transition-transform"
                />
              </div>
            </Link>

            <Link href="/absensi" className="group">
              <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xs hover:border-emerald-500 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} />
                  </div>
                  <div>
                    <span className="font-display font-medium text-sm text-dongker-ink dark:text-slate-100 block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Histori Absensi
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                      Riwayat Presensi Anda
                    </span>
                  </div>
                </div>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  className="text-slate-400 group-hover:translate-x-1 transition-transform"
                />
              </div>
            </Link>

            <Link href="/piket" className="group">
              <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xs hover:border-pnp-orange transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-orange-wash dark:bg-orange-950/60 text-orange-deep dark:text-orange-300">
                    <HugeiconsIcon icon={CleanIcon} size={20} />
                  </div>
                  <div>
                    <span className="font-display font-medium text-sm text-dongker-ink dark:text-slate-100 block group-hover:text-pnp-orange transition-colors">
                      Piket Laboratorium
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                      Jadwal &amp; Laporan Kebersihan
                    </span>
                  </div>
                </div>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  className="text-slate-400 group-hover:translate-x-1 transition-transform"
                />
              </div>
            </Link>
          </div>

          {/* Core Content Grid (Mobile First: 1 col, md: 3 cols) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Upcoming / Today's Kegiatan & Attendance Telemetry */}
            <div className="md:col-span-2 space-y-6">
              {/* Card 1: Agenda Kegiatan Mendatang */}
              <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-display font-medium text-dongker-ink dark:text-slate-100 flex items-center gap-2">
                      <HugeiconsIcon
                        icon={Calendar03Icon}
                        size={18}
                        className="text-dongker-surface dark:text-blue-400"
                      />
                      Agenda Kegiatan Mendatang
                    </CardTitle>
                    <CardDescription className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      Daftar kegiatan UKM Robotik PNP yang perlu Anda ikuti.
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-xs font-mono text-dongker-surface dark:text-blue-400"
                  >
                    <Link href="/kegiatan">Semua &rarr;</Link>
                  </Button>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {data.anggotaStats.upcomingActivities.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 dark:text-slate-500 font-mono text-xs">
                      Belum ada agenda kegiatan mendatang.
                    </div>
                  ) : (
                    data.anggotaStats.upcomingActivities.map((act) => (
                      <div
                        key={act.id}
                        className="border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                      >
                        <div className="space-y-1">
                          <span className="font-display font-medium text-sm text-dongker-ink dark:text-slate-100 block">
                            {act.title}
                          </span>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
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
                          className="bg-dongker-surface hover:bg-dongker-hover dark:bg-blue-600 text-white font-mono text-xs h-8 px-3 rounded-lg shrink-0"
                        >
                          <Link href={`/kegiatan/${act.id}/absensi`}>
                            Absen Sekarang
                          </Link>
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Card 2: Attendance Telemetry Summary */}
              <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display font-medium text-dongker-ink dark:text-slate-100 flex items-center gap-2">
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      size={18}
                      className="text-emerald-600 dark:text-emerald-400"
                    />
                    Statistik Kehadiran Anda
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg text-center border-l-4 border-l-emerald-500">
                      <span className="font-mono text-[10px] uppercase text-slate-400 dark:text-slate-500 block">
                        HADIR
                      </span>
                      <span className="font-display text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {data.anggotaStats.hadirCount}
                      </span>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg text-center border-l-4 border-l-amber-500">
                      <span className="font-mono text-[10px] uppercase text-slate-400 dark:text-slate-500 block">
                        TELAT
                      </span>
                      <span className="font-display text-xl font-bold text-amber-600 dark:text-amber-400">
                        {data.anggotaStats.telatCount}
                      </span>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg text-center border-l-4 border-l-blue-500">
                      <span className="font-mono text-[10px] uppercase text-slate-400 dark:text-slate-500 block">
                        IZIN / SAKIT
                      </span>
                      <span className="font-display text-xl font-bold text-dongker-surface dark:text-blue-400">
                        {data.anggotaStats.izinCount}
                      </span>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg text-center border-l-4 border-l-red-500">
                      <span className="font-mono text-[10px] uppercase text-slate-400 dark:text-slate-500 block">
                        ALFA
                      </span>
                      <span className="font-display text-xl font-bold text-red-600 dark:text-red-400">
                        {data.anggotaStats.alfaCount}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right 1 Col: Piket Duty Status Card */}
            <div className="space-y-6">
              <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl border-l-4 border-l-pnp-orange shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-display font-medium text-dongker-ink dark:text-slate-100 flex items-center gap-2">
                    <HugeiconsIcon
                      icon={CleanIcon}
                      size={18}
                      className="text-pnp-orange"
                    />
                    Status Piket Lab Anda
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">
                        JADWAL HARI:
                      </span>
                      {data.anggotaStats.piketDays.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {data.anggotaStats.piketDays.map((day) => (
                            <Badge
                              key={day}
                              className="bg-orange-50 dark:bg-orange-950/60 text-orange-deep dark:text-orange-300 border border-orange-200 dark:border-orange-900/60 text-[10px] rounded-full px-2"
                            >
                              {day}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-slate-400 text-[10px]"
                        >
                          TIDAK ADA
                        </Badge>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400">
                        LAPORAN MASUK:
                      </span>
                      <span className="font-bold text-dongker-ink dark:text-slate-100 text-sm">
                        {data.anggotaStats.piketLogsCount} Laporan
                      </span>
                    </div>
                  </div>

                  {data.anggotaStats.isScheduledToday ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg text-xs text-amber-700 dark:text-amber-300 font-mono">
                        ⚠️ <strong>PERHATIAN:</strong> Hari ini adalah jadwal
                        piket Anda! Harap kirim laporan sebelum lab tutup.
                      </div>
                      <Button
                        asChild
                        className="w-full bg-pnp-orange hover:bg-orange-deep text-white font-mono text-xs rounded-lg py-2.5 shadow-xs uppercase"
                      >
                        <Link href="/piket">Kirim Laporan Piket</Link>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      asChild
                      className="w-full border-slate-200 dark:border-slate-700 font-mono text-xs rounded-lg"
                    >
                      <Link href="/piket">Lihat Modul Piket</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
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
      {/* 2. CAANG DASHBOARD VIEW                              */}
      {/* ==================================================== */}
      {profile.role === "caang" && data.caangStats && (
        <div className="space-y-6">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {/* Card: Group & Division info */}
            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display font-medium text-dongker-ink dark:text-slate-100 flex items-center gap-2">
                  <HugeiconsIcon
                    icon={UserGroupIcon}
                    size={18}
                    className="text-dongker-surface dark:text-blue-400"
                  />
                  Informasi Pendaftaran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">
                    Kelompok Anda
                  </p>
                  <p className="text-sm font-bold font-display text-dongker-ink dark:text-slate-100 mt-0.5">
                    {data.caangStats.groupName || "Belum Ditetapkan"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">
                    Divisi Magang
                  </p>
                  <p className="text-sm font-bold font-display text-dongker-ink dark:text-slate-100 mt-0.5">
                    {data.caangStats.divisionName || "Belum Memilih"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card: Tasks Statistics */}
            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display font-medium text-dongker-ink dark:text-slate-100 flex items-center gap-2">
                  <HugeiconsIcon
                    icon={Task01Icon}
                    size={18}
                    className="text-pnp-orange"
                  />
                  Penyelesaian Tugas
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6 space-y-3">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="38"
                      className="stroke-slate-200 dark:stroke-slate-800"
                      strokeWidth="7"
                      fill="transparent"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="38"
                      className="stroke-dongker-surface dark:stroke-blue-500"
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
                    <span className="text-lg font-bold font-mono text-dongker-ink dark:text-slate-100">
                      {data.caangStats.submittedTasks}/
                      {data.caangStats.totalTasks}
                    </span>
                    <span className="text-[8px] text-slate-400 font-mono uppercase">
                      Tugas
                    </span>
                  </div>
                </div>
                <div className="text-center font-mono text-xs">
                  <p className="text-slate-500 dark:text-slate-400">
                    Rata-rata Nilai:
                  </p>
                  <p className="text-base font-bold text-dongker-surface dark:text-blue-400">
                    {data.caangStats.averageGrade} / 100
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card: Attendance stats */}
            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display font-medium text-dongker-ink dark:text-slate-100 flex items-center gap-2">
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    size={18}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                  Kehadiran Agenda
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6 space-y-3">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="38"
                      className="stroke-slate-200 dark:stroke-slate-800"
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
                    <span className="text-lg font-bold font-mono text-dongker-ink dark:text-slate-100">
                      {data.caangStats.totalAttendances > 0
                        ? Math.round(
                            (data.caangStats.presentCount /
                              data.caangStats.totalAttendances) *
                              100,
                          )
                        : 0}
                      %
                    </span>
                    <span className="text-[8px] text-slate-400 font-mono uppercase">
                      Hadir
                    </span>
                  </div>
                </div>
                <div className="text-center font-mono text-xs text-slate-500 dark:text-slate-400">
                  <p>
                    Hadir{" "}
                    <span className="font-bold text-dongker-ink dark:text-slate-100">
                      {data.caangStats.presentCount}
                    </span>{" "}
                    dari{" "}
                    <span className="font-bold text-dongker-ink dark:text-slate-100">
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
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500 block">
                TOTAL CALON ANGGOTA
              </span>
              <span className="font-display text-3xl font-bold text-dongker-ink dark:text-slate-100 mt-1 block">
                {data.adminOrStats.totalCaangs}
              </span>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-dongker-surface dark:text-blue-400 rounded-lg">
              <HugeiconsIcon icon={UserGroupIcon} size={24} />
            </div>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500 block">
                TOTAL ANGGOTA AKTIFF
              </span>
              <span className="font-display text-3xl font-bold text-dongker-ink dark:text-slate-100 mt-1 block">
                {data.adminOrStats.totalAnggota}
              </span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <HugeiconsIcon icon={UserGroupIcon} size={24} />
            </div>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500 block">
                SUBMISSION PERLU DIPERIKSA
              </span>
              <span className="font-display text-3xl font-bold text-pnp-orange mt-1 block">
                {data.adminOrStats.pendingSubmissions}
              </span>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-950/60 text-orange-deep dark:text-orange-300 rounded-lg">
              <HugeiconsIcon icon={Task01Icon} size={24} />
            </div>
          </Card>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. ADMIN KOMDIS DASHBOARD VIEW                       */}
      {/* ==================================================== */}
      {profile.role === "admin-komdis" && data.adminKomdisStats && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500 block">
                DISPENSASI PENDING
              </span>
              <span className="font-display text-3xl font-bold text-red-600 dark:text-red-400 mt-1 block">
                {data.adminKomdisStats.pendingLeaves}
              </span>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-lg">
              <HugeiconsIcon icon={Shield01Icon} size={24} />
            </div>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500 block">
                AGENDA HARI INI
              </span>
              <span className="font-display text-3xl font-bold text-dongker-ink dark:text-slate-100 mt-1 block">
                {data.adminKomdisStats.todayActivitiesCount}
              </span>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg">
              <HugeiconsIcon icon={Calendar03Icon} size={24} />
            </div>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500 block">
                ABSENSI MASUK HARI INI
              </span>
              <span className="font-display text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                {data.adminKomdisStats.todayAttendancesCount}
              </span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={24} />
            </div>
          </Card>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. SUPER ADMIN DASHBOARD VIEW                        */}
      {/* ==================================================== */}
      {profile.role === "super-admin" && data.superAdminStats && (
        <div className="space-y-6">
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
              <span className="font-mono text-[9px] text-slate-400 uppercase">
                SUPER ADMIN
              </span>
              <span className="font-display text-xl font-bold text-red-600 dark:text-red-400 block mt-0.5">
                {data.superAdminStats.superAdmin}
              </span>
            </Card>
            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
              <span className="font-mono text-[9px] text-slate-400 uppercase">
                ADMIN OR
              </span>
              <span className="font-display text-xl font-bold text-amber-600 dark:text-amber-400 block mt-0.5">
                {data.superAdminStats.adminOr}
              </span>
            </Card>
            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
              <span className="font-mono text-[9px] text-slate-400 uppercase">
                ADMIN KOMDIS
              </span>
              <span className="font-display text-xl font-bold text-purple-600 dark:text-purple-400 block mt-0.5">
                {data.superAdminStats.adminKomdis}
              </span>
            </Card>
            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
              <span className="font-mono text-[9px] text-slate-400 uppercase">
                ANGGOTA AKTIFF
              </span>
              <span className="font-display text-xl font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                {data.superAdminStats.anggota}
              </span>
            </Card>
            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
              <span className="font-mono text-[9px] text-slate-400 uppercase">
                CALON ANGGOTA
              </span>
              <span className="font-display text-xl font-bold text-blue-600 dark:text-blue-400 block mt-0.5">
                {data.superAdminStats.caang}
              </span>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
