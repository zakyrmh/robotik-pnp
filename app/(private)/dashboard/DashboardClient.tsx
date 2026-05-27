"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Custom SVG Icons
const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-indigo-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);

const UserGroupIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94-3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>
);

const TasksIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-pink-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-amber-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-emerald-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export interface DashboardData {
  profile: {
    id: string;
    role: string;
    nim: string | null;
    fullName: string;
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
    presentCount: number;
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
  const { profile } = data;

  const roleLabels: Record<string, string> = {
    "caang": "Calon Anggota",
    "anggota": "Anggota UKM",
    "admin-or": "Admin OR",
    "admin-komdis": "Admin Komdis",
    "super-admin": "Super Admin",
  };

  const getRoleBadgeColor = (role: string) => {
    if (role === "super-admin") return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
    if (role.startsWith("admin")) return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    if (role === "anggota") return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome Message Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />
          <CardHeader className="relative pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <CardDescription className="text-slate-400 text-xs font-semibold tracking-wider uppercase">
                  Selamat Datang Kembali,
                </CardDescription>
                <CardTitle className="text-2xl font-bold tracking-tight text-white mt-1">
                  {profile.fullName}
                </CardTitle>
                {profile.nim && (
                  <p className="text-xs text-indigo-300 font-mono mt-0.5">{profile.nim}</p>
                )}
              </div>
              <Badge className={getRoleBadgeColor(profile.role)}>
                {roleLabels[profile.role] || profile.role}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* CONDITIONAL DASHBOARD SECTIONS */}

      {/* 1. CAANG DASHBOARD VIEW */}
      {profile.role === "caang" && data.caangStats && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card: Group & Division info */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:col-span-1 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-300">Informasi Pendaftaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                <p className="text-[10px] text-slate-400 font-medium">Kelompok Anda</p>
                <p className="text-sm font-bold text-white mt-1">
                  {data.caangStats.groupName || "Belum Ditetapkan"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                <p className="text-[10px] text-slate-400 font-medium">Divisi Magang</p>
                <p className="text-sm font-bold text-white mt-1">
                  {data.caangStats.divisionName || "Belum Memilih"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card: Tasks Statistics */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:col-span-1 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <TasksIcon />
                Penyelesaian Tugas
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
              {/* Custom SVG Circular Progress Ring */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="45"
                    className="stroke-white/5"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="45"
                    className="stroke-indigo-500"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 45}
                    strokeDashoffset={
                      2 * Math.PI * 45 * (1 - (data.caangStats.totalTasks > 0 ? data.caangStats.submittedTasks / data.caangStats.totalTasks : 0))
                    }
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-bold font-mono text-white">
                    {data.caangStats.submittedTasks}
                    <span className="text-xs text-slate-400">/{data.caangStats.totalTasks}</span>
                  </span>
                  <span className="text-[8px] text-slate-400 font-medium uppercase tracking-wider">Tugas</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Nilai Rata-rata Tugas Anda</p>
                <p className="text-lg font-bold font-mono text-indigo-400 mt-1">{data.caangStats.averageGrade} / 100</p>
              </div>
            </CardContent>
          </Card>

          {/* Card: Attendance stats */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:col-span-1 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <CalendarIcon />
                Kehadiran Agenda
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="45"
                    className="stroke-white/5"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="45"
                    className="stroke-purple-500"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 45}
                    strokeDashoffset={
                      2 * Math.PI * 45 * (1 - (data.caangStats.totalAttendances > 0 ? data.caangStats.presentCount / data.caangStats.totalAttendances : 0))
                    }
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-bold font-mono text-white">
                    {data.caangStats.totalAttendances > 0
                      ? Math.round((data.caangStats.presentCount / data.caangStats.totalAttendances) * 100)
                      : 0}
                    <span className="text-xs text-slate-400">%</span>
                  </span>
                  <span className="text-[8px] text-slate-400 font-medium uppercase tracking-wider">Hadir</span>
                </div>
              </div>
              <div className="text-center text-xs text-muted-foreground">
                <p>Hadir sebanyak <span className="font-bold text-white font-mono">{data.caangStats.presentCount}</span> kali</p>
                <p className="mt-0.5">dari total <span className="font-bold text-white font-mono">{data.caangStats.totalAttendances}</span> agenda pendaftaran.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. ANGGOTA DASHBOARD VIEW */}
      {profile.role === "anggota" && data.anggotaStats && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card: Piket Duty Schedule */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <CalendarIcon />
                Jadwal Piket Lab Anda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.anggotaStats.piketDays.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  Anda belum didaftarkan pada grup jadwal piket kebersihan lab.
                </p>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {data.anggotaStats.piketDays.map((day) => (
                    <Badge key={day} className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 py-1.5 px-3 rounded-lg text-xs">
                      Hari {day}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground leading-relaxed mt-2">
                * Pastikan Anda mengumpulkan laporan kebersihan pada hari yang ditentukan.
              </p>
            </CardContent>
          </Card>

          {/* Card: Piket logs Count */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <CheckCircleIcon />
                Laporan Piket Terverifikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-baseline gap-2 pt-2">
              <span className="text-4xl font-extrabold text-white font-mono">
                {data.anggotaStats.piketLogsCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">Laporan terkirim</span>
            </CardContent>
          </Card>

          {/* Card: Attendance count */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <ShieldIcon />
                Agenda Kehadiran UKM
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-baseline gap-2 pt-2">
              <span className="text-4xl font-extrabold text-white font-mono">
                {data.anggotaStats.presentCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">Agenda dihadiri</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. ADMIN OR DASHBOARD VIEW */}
      {profile.role === "admin-or" && data.adminOrStats && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card: Caang count */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg hover:border-white/20 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Total Calon Anggota
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <span className="text-4xl font-extrabold text-white font-mono">{data.adminOrStats.totalCaangs}</span>
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <UserGroupIcon />
              </div>
            </CardContent>
          </Card>

          {/* Card: Anggota count */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg hover:border-white/20 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Total Anggota Aktif
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <span className="text-4xl font-extrabold text-white font-mono">{data.adminOrStats.totalAnggota}</span>
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
                <UserGroupIcon />
              </div>
            </CardContent>
          </Card>

          {/* Card: Pending Submissions */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg hover:border-white/20 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Submission Perlu Diperiksa
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <span className={`text-4xl font-extrabold font-mono ${data.adminOrStats.pendingSubmissions > 0 ? "text-amber-400" : "text-white"}`}>
                {data.adminOrStats.pendingSubmissions}
              </span>
              <div className="p-3 bg-pink-500/10 text-pink-400 rounded-xl">
                <TasksIcon />
              </div>
            </CardContent>
          </Card>

          {/* Additional secondary metrics */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:col-span-3 p-6 shadow-xl">
            <div className="grid grid-cols-2 gap-4 divide-x divide-white/5 text-center">
              <div>
                <p className="text-xs text-slate-400">Total Kelompok Terbentuk</p>
                <p className="text-2xl font-extrabold text-indigo-400 font-mono mt-1">{data.adminOrStats.totalGroups}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Tugas LMS Aktif</p>
                <p className="text-2xl font-extrabold text-purple-400 font-mono mt-1">{data.adminOrStats.totalTasks}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 4. ADMIN KOMDIS DASHBOARD VIEW */}
      {profile.role === "admin-komdis" && data.adminKomdisStats && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card: Pending leaves */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg hover:border-white/20 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Pengajuan Dispensasi Pending
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <span className={`text-4xl font-extrabold font-mono ${data.adminKomdisStats.pendingLeaves > 0 ? "text-rose-400 animate-pulse" : "text-white"}`}>
                {data.adminKomdisStats.pendingLeaves}
              </span>
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
                <ShieldIcon />
              </div>
            </CardContent>
          </Card>

          {/* Card: Today's Activities */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg hover:border-white/20 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Agenda Kegiatan Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <span className="text-4xl font-extrabold text-white font-mono">{data.adminKomdisStats.todayActivitiesCount}</span>
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                <CalendarIcon />
              </div>
            </CardContent>
          </Card>

          {/* Card: Today's attendances */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg hover:border-white/20 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Jumlah Absensi Masuk Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <span className="text-4xl font-extrabold text-white font-mono">{data.adminKomdisStats.todayAttendancesCount}</span>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <CheckCircleIcon />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. SUPER ADMIN DASHBOARD VIEW */}
      {profile.role === "super-admin" && data.superAdminStats && (
        <div className="space-y-6">
          {/* Main User Statistics Grid */}
          <div className="grid gap-4 sm:grid-cols-5">
            <Card className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Super Admin</p>
              <p className="text-xl font-bold font-mono text-rose-400 mt-1">{data.superAdminStats.superAdmin}</p>
            </Card>
            <Card className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Admin OR</p>
              <p className="text-xl font-bold font-mono text-amber-400 mt-1">{data.superAdminStats.adminOr}</p>
            </Card>
            <Card className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Admin Komdis</p>
              <p className="text-xl font-bold font-mono text-purple-400 mt-1">{data.superAdminStats.adminKomdis}</p>
            </Card>
            <Card className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Anggota UKM</p>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{data.superAdminStats.anggota}</p>
            </Card>
            <Card className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Calon Anggota</p>
              <p className="text-xl font-bold font-mono text-indigo-400 mt-1">{data.superAdminStats.caang}</p>
            </Card>
          </div>

          {/* Database activities overview */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400">Total Log Piket Lab Terverifikasi</p>
                <p className="text-3xl font-extrabold text-white font-mono mt-1">{data.superAdminStats.totalPiketLogs}</p>
              </div>
              <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl">
                <CheckCircleIcon />
              </div>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400">Total Absensi Terdata</p>
                <p className="text-3xl font-extrabold text-white font-mono mt-1">{data.superAdminStats.totalAttendances}</p>
              </div>
              <div className="p-4 bg-purple-500/10 text-purple-400 rounded-2xl">
                <ShieldIcon />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
