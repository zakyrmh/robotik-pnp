"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  User,
  Lock,
  Bell,
  BadgeCheck,
  ShieldAlert,
  Edit3,
  Mail,
  KeyRound,
  Trash2,
  Download,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Phone,
  GraduationCap,
  MapPin,
  Calendar,
  Layers,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { EditProfileModal } from "./modals/EditProfileModal";
import { ChangeEmailModal } from "./modals/ChangeEmailModal";
import { ChangePasswordModal } from "./modals/ChangePasswordModal";
import { DeleteAccountModal } from "./modals/DeleteAccountModal";
import { MembershipDetailModal } from "./modals/MembershipDetailModal";
import { ExportDataModal } from "./modals/ExportDataModal";

interface SettingsClientProps {
  settingsData: {
    user: {
      id: string;
      email?: string | null;
    };
    profile: {
      id: string;
      email: string;
      full_name: string | null;
      nim: string | null;
      avatar_url: string | null;
      role: string;
      is_onboarded: boolean;
    };
    registration?: {
      nickname?: string | null;
      gender?: "L" | "P" | null;
      pob?: string | null;
      dob?: string | null;
      phone_number?: string | null;
      study_program_id?: string | null;
      entry_year?: number | null;
      current_class?: string | null;
      high_school?: string | null;
      origin_address?: string | null;
      domicile_address?: string | null;
      motivation?: string | null;
      org_experience?: string | null;
      achievements?: string | null;
      status?: string | null;
    } | null;
    studyPrograms: Array<{
      id: string;
      name: string;
      degree: string;
      majors?: { name: string } | null;
    }>;
    roleData: {
      caangGroup?: {
        id: string;
        name: string;
        profiles?: { full_name?: string | null } | null;
      } | null;
      orgHistories?: Array<{
        id: string;
        role_name: string;
        sub_section?: string | null;
        departments?: { name: string } | null;
        membership_periods?: { period_name: string } | null;
      }> | null;
    };
  };
}

export function SettingsClient({ settingsData }: SettingsClientProps) {
  const { profile, registration, studyPrograms, roleData } = settingsData;

  // Modal State Triggers
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [isMembershipDetailOpen, setIsMembershipDetailOpen] = useState(false);
  const [isExportDataOpen, setIsExportDataOpen] = useState(false);

  // Notification Toggles
  const [notifications, setNotifications] = useState({
    activities: true,
    piket: true,
    tasks: true,
    discipline: true,
  });

  const handleToggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      toast.success("Preferensi notifikasi diperbarui.");
      return updated;
    });
  };

  const selectedStudyProgram = studyPrograms.find(
    (sp) => sp.id === registration?.study_program_id,
  );

  const isAdminRole =
    profile.role === "super-admin" ||
    profile.role === "admin-or" ||
    profile.role === "admin-komdis";

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 py-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-linear-to-r from-blue-950 via-blue-900 to-slate-900 text-white border border-blue-800/40 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-800 border-2 border-orange-500/80 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
            {profile.avatar_url ? (
              // eslint-disable-next-ok
              <img
                src={profile.avatar_url}
                alt={profile.full_name || "Avatar"}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-7 h-7 text-slate-300" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {profile.full_name || "Pengguna UKM Robotik"}
              </h1>
              <Badge className="bg-orange-500 text-white text-[10px] uppercase font-semibold px-2 py-0.5">
                {profile.role}
              </Badge>
            </div>
            <p className="text-xs text-blue-200/90 font-mono">
              {profile.nim ? `NIM: ${profile.nim}` : profile.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <Button
            onClick={() => setIsEditProfileOpen(true)}
            size="sm"
            className="h-9 text-xs bg-orange-500 hover:bg-orange-600 text-white font-medium shadow-sm transition-all"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1.5" />
            Edit Profil
          </Button>

          <Button
            onClick={() => setIsMembershipDetailOpen(true)}
            variant="outline"
            size="sm"
            className="h-9 text-xs border-blue-400/40 text-blue-100 hover:bg-blue-800/50 bg-blue-950/40"
          >
            <BadgeCheck className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
            Kartu Digital
          </Button>
        </div>
      </div>

      {/* 5 Tabs Component - Mobile First Horizontal Scroll, Grid on Desktop */}
      <Tabs defaultValue="profil" className="w-full space-y-6">
        <div className="overflow-x-auto pb-1 no-scrollbar border-b border-slate-200 dark:border-slate-800">
          <TabsList className="h-10 bg-slate-100/80 dark:bg-slate-800/80 p-1 inline-flex w-max sm:w-full justify-start sm:justify-center gap-1 rounded-xl">
            <TabsTrigger
              value="profil"
              className="text-xs px-3 sm:px-4 py-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-900 dark:data-[state=active]:text-orange-400 data-[state=active]:shadow-sm font-medium flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Profil Saya</span>
            </TabsTrigger>

            <TabsTrigger
              value="keamanan"
              className="text-xs px-3 sm:px-4 py-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-900 dark:data-[state=active]:text-orange-400 data-[state=active]:shadow-sm font-medium flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Keamanan & Akun</span>
            </TabsTrigger>

            <TabsTrigger
              value="notifikasi"
              className="text-xs px-3 sm:px-4 py-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-900 dark:data-[state=active]:text-orange-400 data-[state=active]:shadow-sm font-medium flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Preferensi</span>
            </TabsTrigger>

            <TabsTrigger
              value="keanggotaan"
              className="text-xs px-3 sm:px-4 py-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-900 dark:data-[state=active]:text-orange-400 data-[state=active]:shadow-sm font-medium flex items-center gap-1.5"
            >
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>Keanggotaan</span>
            </TabsTrigger>

            <TabsTrigger
              value="privasi"
              className="text-xs px-3 sm:px-4 py-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 data-[state=active]:shadow-sm font-medium flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Privasi & Bahaya</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: PROFIL SAYA */}
        <TabsContent
          value="profil"
          className="space-y-4 focus-visible:outline-none"
        >
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Data Diri & Akademik
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Informasi pribadi yang terdaftar dalam basis data organisasi.
                </CardDescription>
              </div>
              <Button
                onClick={() => setIsEditProfileOpen(true)}
                variant="outline"
                size="sm"
                className="h-8 text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                Ubah Profil
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-1">
                  <span className="text-micro font-medium text-slate-400 flex items-center gap-1">
                    <User className="w-3 h-3 text-orange-500" /> Nama Panggilan
                  </span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {registration?.nickname || "-"}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-1">
                  <span className="text-micro font-medium text-slate-400 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-orange-500" /> No. WhatsApp
                  </span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {registration?.phone_number || "-"}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-1">
                  <span className="text-micro font-medium text-slate-400 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-orange-500" />{" "}
                    Program Studi
                  </span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {selectedStudyProgram
                      ? `${selectedStudyProgram.degree} ${selectedStudyProgram.name}`
                      : "-"}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-1">
                  <span className="text-micro font-medium text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-orange-500" /> Tempat &
                    Tgl Lahir
                  </span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {registration?.pob || "-"}, {registration?.dob || "-"}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-1">
                  <span className="text-micro font-medium text-slate-400 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-orange-500" /> Angkatan &
                    Kelas
                  </span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {registration?.entry_year || "-"} /{" "}
                    {registration?.current_class || "-"}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-1">
                  <span className="text-micro font-medium text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-orange-500" /> Asal Sekolah
                  </span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {registration?.high_school || "-"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-1">
                  <span className="text-micro font-medium text-slate-400 block">
                    Alamat Asal
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {registration?.origin_address || "-"}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-1">
                  <span className="text-micro font-medium text-slate-400 block">
                    Domisili di Padang
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {registration?.domicile_address || "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: KEAMANAN & AKUN */}
        <TabsContent
          value="keamanan"
          className="space-y-4 focus-visible:outline-none"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-400">
                  <Mail className="w-4 h-4 text-orange-500" />
                  <CardTitle className="text-sm font-semibold">
                    Alamat Email
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Email yang terhubung ke akun Anda saat ini.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-micro text-slate-400 block">
                    Email Aktif
                  </span>
                  <p className="text-xs font-semibold font-mono text-slate-800 dark:text-slate-200">
                    {profile.email}
                  </p>
                </div>
                <Button
                  onClick={() => setIsChangeEmailOpen(true)}
                  variant="outline"
                  size="sm"
                  className="w-full h-9 text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Ubah Alamat Email
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-400">
                  <KeyRound className="w-4 h-4 text-orange-500" />
                  <CardTitle className="text-sm font-semibold">
                    Kata Sandi (Password)
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Perbarui kata sandi secara berkala demi keamanan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-micro text-slate-400 block">
                    Status Kata Sandi
                  </span>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    ✓ Terenkripsi (NIST SP 800-63B Compliant)
                  </p>
                </div>
                <Button
                  onClick={() => setIsChangePasswordOpen(true)}
                  variant="outline"
                  size="sm"
                  className="w-full h-9 text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Ganti Kata Sandi
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: PREFERENSI NOTIFIKASI */}
        <TabsContent
          value="notifikasi"
          className="space-y-4 focus-visible:outline-none"
        >
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Pengaturan Notifikasi Sistem
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Kelola notifikasi in-app untuk berbagai kegiatan operasional
                UKM.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div>
                  <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Notifikasi Kegiatan & Presensi
                  </Label>
                  <p className="text-micro text-slate-500 dark:text-slate-400">
                    Pengingat jam check-in dan pengumuman jadwal kegiatan baru.
                  </p>
                </div>
                <Switch
                  checked={notifications.activities}
                  onCheckedChange={() => handleToggleNotification("activities")}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div>
                  <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Notifikasi Piket Laboratorium
                  </Label>
                  <p className="text-micro text-slate-500 dark:text-slate-400">
                    Pengingat jadwal tugas piket harian lab robotik.
                  </p>
                </div>
                <Switch
                  checked={notifications.piket}
                  onCheckedChange={() => handleToggleNotification("piket")}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div>
                  <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Notifikasi Tugas & Magang Caang
                  </Label>
                  <p className="text-micro text-slate-500 dark:text-slate-400">
                    Informasi tugas baru atau penilaian revisi dari mentor.
                  </p>
                </div>
                <Switch
                  checked={notifications.tasks}
                  onCheckedChange={() => handleToggleNotification("tasks")}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div>
                  <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Poin & Peringatan Kedisiplinan
                  </Label>
                  <p className="text-micro text-slate-500 dark:text-slate-400">
                    Pemberitahuan pencatatan poin pelanggaran atau apresiasi.
                  </p>
                </div>
                <Switch
                  checked={notifications.discipline}
                  onCheckedChange={() => handleToggleNotification("discipline")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: KEANGGOTAAN & PERAN */}
        <TabsContent
          value="keanggotaan"
          className="space-y-4 focus-visible:outline-none"
        >
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Status Keanggotaan & Peran
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Konteks peran Anda di Sistem Informasi UKM Robotik PNP.
                </CardDescription>
              </div>
              <Button
                onClick={() => setIsMembershipDetailOpen(true)}
                variant="outline"
                size="sm"
                className="h-8 text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                <BadgeCheck className="w-3.5 h-3.5 mr-1 text-orange-500" />
                Lihat Kartu Digital
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Peran Aktif:
                    </span>
                    <Badge className="bg-blue-900 dark:bg-blue-600 text-white text-[10px] uppercase">
                      {profile.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Status Onboarding:{" "}
                    {profile.is_onboarded ? "✓ Selesai" : "Belum Selesai"}
                  </p>
                </div>

                {isAdminRole && (
                  <Link href="/pengaturan-or">
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                      Akses Panel Admin
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>

              {profile.role === "caang" && (
                <div className="p-3 rounded-lg border border-orange-200 dark:border-orange-900/50 bg-orange-50/40 dark:bg-orange-950/20 text-xs text-orange-900 dark:text-orange-300 space-y-1">
                  <p className="font-semibold">
                    Informasi Calon Anggota (Caang):
                  </p>
                  <p className="text-micro text-orange-800/90 dark:text-orange-300/90">
                    Kelompok: {roleData.caangGroup?.name || "Belum ditentukan"}{" "}
                    | Status Registrasi: {registration?.status || "process"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: PRIVASI & ZONA BAHAYA */}
        <TabsContent
          value="privasi"
          className="space-y-4 focus-visible:outline-none"
        >
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-400">
                <Download className="w-4 h-4 text-orange-500" />
                <CardTitle className="text-sm font-semibold">
                  Hak Portabilitas Data (UU PDP)
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Unduh seluruh arsip data pribadi dan aktivitas Anda dalam format
                JSON.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setIsExportDataOpen(true)}
                variant="outline"
                size="sm"
                className="h-9 text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Ekspor Data Pribadi (.json)
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <ShieldAlert className="w-4 h-4" />
                <CardTitle className="text-sm font-semibold">
                  Zona Bahaya (Penghapusan Akun)
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-red-700/80 dark:text-red-300/80">
                Penghapusan akun bersifat Soft Delete demi kepatuhan siber &
                audit trail.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-red-600/90 dark:text-red-300/90">
                Setelah menonaktifkan akun, Anda tidak dapat mengakses portal
                UKM Robotik PNP lagi.
              </p>
              <Button
                onClick={() => setIsDeleteAccountOpen(true)}
                className="h-9 text-xs bg-red-600 hover:bg-red-700 text-white font-medium px-4"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Hapus & Menonaktifkan Akun
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* RENDER MODAL DIALOGS */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        initialData={{
          full_name: profile.full_name,
          nickname: registration?.nickname,
          gender: registration?.gender,
          pob: registration?.pob,
          dob: registration?.dob,
          phone_number: registration?.phone_number,
          study_program_id: registration?.study_program_id,
          entry_year: registration?.entry_year,
          current_class: registration?.current_class,
          high_school: registration?.high_school,
          origin_address: registration?.origin_address,
          domicile_address: registration?.domicile_address,
          motivation: registration?.motivation,
          org_experience: registration?.org_experience,
          achievements: registration?.achievements,
          avatar_url: profile.avatar_url,
        }}
        studyPrograms={studyPrograms}
      />

      <ChangeEmailModal
        isOpen={isChangeEmailOpen}
        onClose={() => setIsChangeEmailOpen(false)}
        currentEmail={profile.email}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      <DeleteAccountModal
        isOpen={isDeleteAccountOpen}
        onClose={() => setIsDeleteAccountOpen(false)}
      />

      <MembershipDetailModal
        isOpen={isMembershipDetailOpen}
        onClose={() => setIsMembershipDetailOpen(false)}
        userProfile={{
          full_name: profile.full_name,
          nim: profile.nim,
          role: profile.role,
          avatar_url: profile.avatar_url,
        }}
        roleData={roleData}
      />

      <ExportDataModal
        isOpen={isExportDataOpen}
        onClose={() => setIsExportDataOpen(false)}
      />
    </div>
  );
}
