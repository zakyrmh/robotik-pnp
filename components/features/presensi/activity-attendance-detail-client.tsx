"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  Search01Icon,
  QrCodeIcon,
  UserIcon,
  AlertCircleIcon,
  Clock01Icon,
  Location01Icon,
  UserGroupIcon,
  Edit01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  recordManualAttendance,
  batchMarkAlfa,
  type ActivityAttendanceDetailResult,
  type ActivityAttendanceMemberDetail,
} from "@/lib/actions/komdis";

interface ActivityAttendanceDetailClientProps {
  initialData: ActivityAttendanceDetailResult;
}

export function ActivityAttendanceDetailClient({
  initialData,
}: ActivityAttendanceDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [data] = useState<ActivityAttendanceDetailResult>(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Manual Attendance Modal State
  const [editingMember, setEditingMember] =
    useState<ActivityAttendanceMemberDetail | null>(null);
  const [manualStatus, setManualStatus] = useState<
    "hadir" | "telat" | "izin" | "sakit" | "alfa"
  >("hadir");
  const [manualNotes, setManualNotes] = useState("");
  const [manualPoints, setManualPoints] = useState(0);

  // Batch Alfa Modal State
  const [showBatchAlfaDialog, setShowBatchAlfaDialog] = useState(false);

  const { activity, summary, members } = data;

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch =
        m.fullName.toLowerCase().includes(q) ||
        m.nim.toLowerCase().includes(q) ||
        m.studyProgramName.toLowerCase().includes(q) ||
        m.majorName.toLowerCase().includes(q);

      let matchStatus = true;
      if (statusFilter !== "all") {
        if (statusFilter === "izin_sakit") {
          matchStatus = m.status === "izin" || m.status === "sakit";
        } else {
          matchStatus = m.status === statusFilter;
        }
      }

      let matchRole = true;
      if (roleFilter !== "all") {
        matchRole = m.role === roleFilter;
      }

      return matchSearch && matchStatus && matchRole;
    });
  }, [members, search, statusFilter, roleFilter]);

  const formatIndoDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTimeRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const startTime = start.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTime = end.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${startTime} - ${endTime} WIB`;
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super-admin":
        return (
          <Badge className="bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60 font-mono text-[9px] font-bold rounded-full px-2 py-0.5">
            SUPER ADMIN
          </Badge>
        );
      case "admin-komdis":
        return (
          <Badge className="bg-blue-50 dark:bg-blue-950/60 text-[#1e3a8a] dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 font-mono text-[9px] font-bold rounded-full px-2 py-0.5">
            KOMDIS
          </Badge>
        );
      case "admin-or":
        return (
          <Badge className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 font-mono text-[9px] font-bold rounded-full px-2 py-0.5">
            ADMIN OR
          </Badge>
        );
      case "admin-kestari":
        return (
          <Badge className="bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900/60 font-mono text-[9px] font-bold rounded-full px-2 py-0.5">
            KESTARI
          </Badge>
        );
      case "admin-divisi":
        return (
          <Badge className="bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-900/60 font-mono text-[9px] font-bold rounded-full px-2 py-0.5">
            ADMIN DIVISI
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-mono text-[9px] font-semibold rounded-full px-2 py-0.5">
            ANGGOTA
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: ActivityAttendanceMemberDetail["status"]) => {
    switch (status) {
      case "hadir":
        return (
          <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 font-mono text-[10px] font-bold rounded-full px-2.5 py-0.5">
            HADIR
          </Badge>
        );
      case "telat":
        return (
          <Badge className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 font-mono text-[10px] font-bold rounded-full px-2.5 py-0.5">
            TELAT
          </Badge>
        );
      case "izin":
        return (
          <Badge className="bg-blue-50 dark:bg-blue-950/60 text-[#1e3a8a] dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 font-mono text-[10px] font-bold rounded-full px-2.5 py-0.5">
            IZIN
          </Badge>
        );
      case "sakit":
        return (
          <Badge className="bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900/60 font-mono text-[10px] font-bold rounded-full px-2.5 py-0.5">
            SAKIT
          </Badge>
        );
      case "alfa":
        return (
          <Badge className="bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 font-mono text-[10px] font-bold rounded-full px-2.5 py-0.5">
            ALFA
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-mono text-[10px] font-semibold rounded-full px-2.5 py-0.5">
            BELUM PRESENSI
          </Badge>
        );
    }
  };

  const handleManualSave = async () => {
    if (!editingMember) return;
    const toastId = toast.loading("Menyimpan data presensi...");
    try {
      await recordManualAttendance({
        activityId: activity.id,
        profileId: editingMember.profileId,
        status: manualStatus,
        pointsAwarded: manualPoints,
        notes: manualNotes,
      });
      toast.dismiss(toastId);
      toast.success(`Presensi ${editingMember.fullName} berhasil diperbarui.`);
      setEditingMember(null);
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      toast.dismiss(toastId);
      toast.error(
        err instanceof Error ? err.message : "Gagal memperbarui presensi.",
      );
    }
  };

  const handleBatchAlfa = async () => {
    setShowBatchAlfaDialog(false);
    const toastId = toast.loading("Proses tandai alfa massal...");
    try {
      const res = await batchMarkAlfa(activity.id);
      toast.dismiss(toastId);
      toast.success(`Berhasil menandai ${res.count} anggota sebagai Alfa.`);
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      toast.dismiss(toastId);
      toast.error(
        err instanceof Error ? err.message : "Gagal menandai alfa massal.",
      );
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pb-16">
      {/* ── Header Banner (Precision Blueprint Style) ────────────────────── */}
      <div className="relative overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-xs">
        {/* Top Accent Gradient Line (Precision Blueprint 60-30-10 Rule) */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#1e3a8a] via-[#3b82f6] to-[#f97316]" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/presensi")}
                className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-[#0a192f] dark:text-slate-200 font-mono text-micro uppercase tracking-wider px-3"
              >
                <HugeiconsIcon
                  icon={ArrowLeft02Icon}
                  size={14}
                  className="mr-1"
                />
                Kembali
              </Button>
              <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#1e3a8a]/10 text-[#1e3a8a] dark:bg-blue-900/40 dark:text-blue-300 font-bold">
                REKAP AGENDA KOMDIS
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0a192f] dark:text-slate-100 tracking-tight">
              {activity.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-2 font-mono text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon
                  icon={Clock01Icon}
                  size={14}
                  className="text-[#1e3a8a] dark:text-blue-400"
                />
                <span>
                  {formatIndoDate(activity.startDate)} (
                  {formatTimeRange(activity.startDate, activity.endDate)})
                </span>
              </div>
              {activity.location && (
                <div className="flex items-center gap-1.5">
                  <HugeiconsIcon
                    icon={Location01Icon}
                    size={14}
                    className="text-[#f97316]"
                  />
                  <span>{activity.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <Button
              onClick={() => router.push(`/kegiatan/${activity.id}/absensi`)}
              className="flex-1 md:flex-initial rounded-xl bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#1e40af] text-white font-mono text-xs uppercase tracking-wider h-10 px-4 shadow-sm"
            >
              <HugeiconsIcon icon={QrCodeIcon} size={16} className="mr-2" />
              Scanner QR
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowBatchAlfaDialog(true)}
              className="flex-1 md:flex-initial rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-mono text-xs uppercase tracking-wider h-10 px-4"
            >
              <HugeiconsIcon
                icon={AlertCircleIcon}
                size={16}
                className="mr-2"
              />
              Alfa Massal
            </Button>
          </div>
        </div>
      </div>

      {/* ── Telemetry Summary Bar ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 rounded-xl text-center border-l-4 border-l-[#1e3a8a] shadow-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
            TOTAL ANGGOTA
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-[#0a192f] dark:text-slate-100">
            {summary.totalExpected}
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 rounded-xl text-center border-l-4 border-l-emerald-500 shadow-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
            HADIR
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {summary.counts.hadir}
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 rounded-xl text-center border-l-4 border-l-amber-500 shadow-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
            TELAT
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
            {summary.counts.telat}
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 rounded-xl text-center border-l-4 border-l-blue-500 shadow-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
            IZIN / SAKIT
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-[#1e3a8a] dark:text-blue-400">
            {summary.counts.izin + summary.counts.sakit}
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 rounded-xl text-center border-l-4 border-l-red-500 shadow-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
            ALFA / BELUM
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
            {summary.counts.alfa + summary.counts.unrecorded}
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 rounded-xl text-center border-l-4 border-l-[#f97316] shadow-xs col-span-2 sm:col-span-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
            PRESENSI (%)
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-[#f97316]">
            {summary.attendanceRate}%
          </span>
        </div>
      </div>

      {/* ── Filter Controls ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl shadow-xs">
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <Input
            placeholder="Cari Nama Anggota / NIM / Prodi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full bg-slate-50 dark:bg-slate-800/60 pl-10 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs text-[#0a192f] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-[#f97316]/20 focus-visible:border-[#f97316]"
          />
        </div>

        <div className="w-full sm:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 w-full bg-slate-50 dark:bg-slate-800/60 px-3 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs text-[#0a192f] dark:text-slate-100 focus:outline-hidden focus:border-[#f97316]"
          >
            <option value="all">Semua Status</option>
            <option value="hadir">Hadir</option>
            <option value="telat">Telat</option>
            <option value="izin_sakit">Izin / Sakit</option>
            <option value="alfa">Alfa</option>
            <option value="unrecorded">Belum Presensi</option>
          </select>
        </div>

        <div className="w-full sm:w-44">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 w-full bg-slate-50 dark:bg-slate-800/60 px-3 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs text-[#0a192f] dark:text-slate-100 focus:outline-hidden focus:border-[#f97316]"
          >
            <option value="all">Semua Role</option>
            <option value="anggota">Anggota</option>
            <option value="admin-divisi">Admin Divisi</option>
            <option value="admin-komdis">Admin Komdis</option>
            <option value="admin-or">Admin OR</option>
            <option value="admin-kestari">Admin Kestari</option>
            <option value="super-admin">Super Admin</option>
          </select>
        </div>
      </div>

      {/* ── Main Data Table ─────────────────────────────────────────────── */}
      {filteredMembers.length === 0 ? (
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 text-center rounded-xl shadow-xs">
          <HugeiconsIcon
            icon={UserGroupIcon}
            size={42}
            className="mx-auto text-slate-400 dark:text-slate-600 mb-3"
          />
          <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Tidak ada anggota ditemukan.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="block lg:hidden space-y-3">
            {filteredMembers.map((m) => (
              <div
                key={m.profileId}
                className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-xl space-y-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 rounded-full border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                    {m.photoUrl ? (
                      <Image
                        src={m.photoUrl}
                        alt={m.fullName}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <HugeiconsIcon
                        icon={UserIcon}
                        size={18}
                        className="text-slate-400"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-medium text-sm text-[#0a192f] dark:text-slate-100 truncate">
                        {m.fullName}
                      </h4>
                      {getRoleBadge(m.role)}
                    </div>
                    <span className="font-mono text-micro text-slate-500 dark:text-slate-400 block">
                      NIM: {m.nim} · {m.studyProgramName}
                    </span>
                  </div>
                  {getStatusBadge(m.status)}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      CHECK-IN
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {m.checkInAt
                        ? new Date(m.checkInAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          }) + " WIB"
                        : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      SANKSI POIN
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {m.pointsAwarded > 0
                        ? `+${m.pointsAwarded} PTS`
                        : "0 PTS"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingMember(m);
                      setManualStatus(
                        m.status === "unrecorded"
                          ? "hadir"
                          : (m.status as
                              | "hadir"
                              | "telat"
                              | "izin"
                              | "sakit"
                              | "alfa"),
                      );
                      setManualNotes(m.notes || "");
                      setManualPoints(m.pointsAwarded);
                    }}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 text-[#0a192f] dark:text-slate-200 font-mono text-micro uppercase"
                  >
                    <HugeiconsIcon
                      icon={Edit01Icon}
                      size={14}
                      className="mr-1"
                    />
                    Presensi Manual
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
            <table className="w-full min-w-237.5 border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="p-4 w-12 text-center font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    #
                  </th>
                  <th className="p-4 font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Anggota
                  </th>
                  <th className="p-4 font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Prodi / Jurusan
                  </th>
                  <th className="p-4 font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Waktu Check-In
                  </th>
                  <th className="p-4 text-center font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Status Presensi
                  </th>
                  <th className="p-4 text-center font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Sanksi Poin
                  </th>
                  <th className="p-4 text-center font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredMembers.map((m, idx) => (
                  <tr
                    key={m.profileId}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-4 align-middle text-center font-mono text-xs text-slate-400">
                      {idx + 1}
                    </td>

                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="relative h-9 w-9 rounded-full border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                          {m.photoUrl ? (
                            <Image
                              src={m.photoUrl}
                              alt={m.fullName}
                              fill
                              sizes="36px"
                              className="object-cover"
                            />
                          ) : (
                            <HugeiconsIcon
                              icon={UserIcon}
                              size={16}
                              className="text-slate-400"
                            />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display font-medium text-[#0a192f] dark:text-slate-100 text-sm">
                              {m.fullName}
                            </span>
                            {getRoleBadge(m.role)}
                          </div>
                          <div className="font-mono text-micro text-slate-500 dark:text-slate-400">
                            NIM: {m.nim}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 align-middle">
                      <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        {m.studyProgramName}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {m.majorName}
                      </div>
                    </td>

                    <td className="p-4 align-middle font-mono text-xs">
                      {m.checkInAt ? (
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {new Date(m.checkInAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}{" "}
                          WIB
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">
                          —
                        </span>
                      )}
                    </td>

                    <td className="p-4 align-middle text-center">
                      {getStatusBadge(m.status)}
                    </td>

                    <td className="p-4 align-middle text-center">
                      {m.pointsAwarded > 0 ? (
                        <Badge className="bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 font-mono text-[10px] font-bold rounded-full px-2.5 py-0.5">
                          +{m.pointsAwarded} PTS
                        </Badge>
                      ) : (
                        <span className="font-mono text-xs text-slate-400">
                          0
                        </span>
                      )}
                    </td>

                    <td className="p-4 align-middle text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingMember(m);
                          setManualStatus(
                            m.status === "unrecorded"
                              ? "hadir"
                              : (m.status as
                                  | "hadir"
                                  | "telat"
                                  | "izin"
                                  | "sakit"
                                  | "alfa"),
                          );
                          setManualNotes(m.notes || "");
                          setManualPoints(m.pointsAwarded);
                        }}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 text-[#0a192f] dark:text-slate-200 h-8 px-2.5 font-mono text-micro uppercase tracking-wider"
                      >
                        <HugeiconsIcon
                          icon={Edit01Icon}
                          size={14}
                          className="mr-1"
                        />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Drawer Presensi Manual / Edit Status ─────────────────────────── */}
      <Drawer
        open={!!editingMember}
        onOpenChange={(open) => {
          if (!open) setEditingMember(null);
        }}
      >
        <DrawerContent className="flex flex-col overflow-hidden border-t border-border bg-card font-sans shadow-soft data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-[calc(100dvh-1rem)] sm:mx-auto sm:max-w-md sm:rounded-lg sm:border">
          <DrawerHeader className="flex shrink-0 flex-row items-start justify-between gap-3 border-b border-border px-5 py-4 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left sm:px-6 sm:pt-5 sm:pb-4">
            <div className="flex flex-col items-start text-left gap-1.5 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
              <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-micro font-semibold uppercase tracking-wide text-accent-foreground">
                <HugeiconsIcon icon={Edit01Icon} />
                <span>Presensi Manual</span>
              </div>
              <DrawerTitle className="font-display text-base font-bold text-foreground text-left">
                Presensi Manual — {editingMember?.fullName}
              </DrawerTitle>
              <DrawerDescription className="text-xs text-muted-foreground text-left font-mono">
                NIM: {editingMember?.nim} · {editingMember?.studyProgramName}
              </DrawerDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setEditingMember(null)}
              className="shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Tutup"
            >
              <HugeiconsIcon icon={Cancel01Icon} />
            </Button>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 text-xs font-mono">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="manual-status-select"
                  className="text-xs font-semibold text-foreground uppercase tracking-wider block"
                >
                  Status Presensi <span className="text-destructive">*</span>
                </label>
                <select
                  id="manual-status-select"
                  value={manualStatus}
                  onChange={(e) => {
                    const newStatus = e.target.value as
                      | "hadir"
                      | "telat"
                      | "izin"
                      | "sakit"
                      | "alfa";
                    setManualStatus(newStatus);
                    if (newStatus === "hadir") {
                      setManualPoints(0);
                      setManualNotes("");
                    } else if (newStatus === "telat") {
                      setManualPoints(0);
                      setManualNotes(
                        "Terlambat < 1 jam (Sanksi fisik di tempat)",
                      );
                    } else if (newStatus === "izin" || newStatus === "sakit") {
                      setManualPoints(5);
                    } else if (newStatus === "alfa") {
                      setManualPoints(15);
                    }
                  }}
                  className="h-10 w-full bg-background px-3 rounded-lg border border-border text-foreground focus:outline-hidden focus:border-primary"
                >
                  <option value="hadir">Hadir (Tepat Waktu)</option>
                  <option value="telat">Telat</option>
                  <option value="izin">Izin (5 Poin)</option>
                  <option value="sakit">Sakit (5 Poin)</option>
                  <option value="alfa">Alfa (15 Poin)</option>
                </select>
              </div>

              {/* Preset Opsi Sanksi Keterlambatan (SOP Komdis) */}
              {manualStatus === "telat" && (
                <div className="flex flex-col gap-2 p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                      ⚡ PRESET SANKSI KETERLAMBATAN (SOP KOMDIS)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setManualPoints(0);
                        setManualNotes(
                          "Terlambat < 1 jam (Sanksi fisik di tempat)",
                        );
                      }}
                      className={`text-left px-3 py-2 rounded-lg border font-mono text-[11px] transition-all cursor-pointer flex items-center justify-between ${
                        manualPoints === 0
                          ? "bg-amber-100 dark:bg-amber-900/60 border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-100 font-bold shadow-2xs"
                          : "bg-white dark:bg-slate-900 border-amber-200/70 dark:border-amber-900/40 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/60"
                      }`}
                    >
                      <span>
                        🏃 <strong>Sanksi Fisik Saja</strong> (Telat &lt; 1 Jam)
                      </span>
                      <span className="text-amber-700 dark:text-amber-300 font-bold shrink-0 ml-2">
                        0 PTS
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setManualPoints(3);
                        setManualNotes(
                          "Terlambat > 1 jam (Izin diterima - sanksi fisik + 3 poin)",
                        );
                      }}
                      className={`text-left px-3 py-2 rounded-lg border font-mono text-[11px] transition-all cursor-pointer flex items-center justify-between ${
                        manualPoints === 3
                          ? "bg-amber-100 dark:bg-amber-900/60 border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-100 font-bold shadow-2xs"
                          : "bg-white dark:bg-slate-900 border-amber-200/70 dark:border-amber-900/40 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/60"
                      }`}
                    >
                      <span>
                        📋 <strong>Fisik + Poin (Izin Diterima)</strong> (Telat
                        &gt; 1 Jam)
                      </span>
                      <span className="text-amber-700 dark:text-amber-300 font-bold shrink-0 ml-2">
                        +3 PTS
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setManualPoints(5);
                        setManualNotes(
                          "Terlambat > 1 jam (Izin ditolak/tanpa izin - sanksi fisik + 5 poin)",
                        );
                      }}
                      className={`text-left px-3 py-2 rounded-lg border font-mono text-[11px] transition-all cursor-pointer flex items-center justify-between ${
                        manualPoints === 5
                          ? "bg-amber-100 dark:bg-amber-900/60 border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-100 font-bold shadow-2xs"
                          : "bg-white dark:bg-slate-900 border-amber-200/70 dark:border-amber-900/40 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/60"
                      }`}
                    >
                      <span>
                        ⚠️ <strong>Fisik + Poin (Izin Ditolak)</strong> (Telat
                        &gt; 1 Jam)
                      </span>
                      <span className="text-red-600 dark:text-red-400 font-bold shrink-0 ml-2">
                        +5 PTS
                      </span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="manual-points-input"
                  className="text-xs font-semibold text-foreground uppercase tracking-wider block"
                >
                  Poin Sanksi / Pelanggaran
                </label>
                <Input
                  id="manual-points-input"
                  type="number"
                  min={0}
                  value={manualPoints}
                  onChange={(e) => setManualPoints(Number(e.target.value))}
                  className="h-10 bg-background font-mono text-xs border-border font-bold text-amber-600 dark:text-amber-400"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="manual-notes-input"
                  className="text-xs font-semibold text-foreground uppercase tracking-wider block"
                >
                  Catatan / Keterangan Sanksi
                </label>
                <Input
                  id="manual-notes-input"
                  placeholder="Misal: Terlambat 1 jam 15 menit (izin diterima)..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="h-10 bg-background font-mono text-xs border-border placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>

          <DrawerFooter className="shrink-0 gap-2 border-t border-border bg-surface px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingMember(null)}
              className="h-9 rounded-md border-primary px-4 text-xs font-medium text-primary hover:bg-primary-soft font-mono uppercase"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleManualSave}
              className="h-9 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary-hover font-mono uppercase"
            >
              Simpan Presensi
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* ── Dialog Konfirmasi Alfa Massal ─────────────────────────────────── */}
      <Dialog open={showBatchAlfaDialog} onOpenChange={setShowBatchAlfaDialog}>
        <DialogContent className="max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 overflow-hidden shadow-blueprint">
          <div className="h-1 bg-red-600" />

          <DialogHeader className="px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="font-display text-base font-bold text-[#0a192f] dark:text-slate-100 flex items-center gap-2">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                size={18}
                className="text-red-600"
              />
              Tandai Alfa Massal
            </DialogTitle>
            <DialogDescription className="font-mono text-micro text-red-600 font-semibold uppercase">
              ⚠ Konfirmasi Penutupan Sesi Presensi
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 space-y-2">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menandai seluruh anggota yang{" "}
              <span className="font-bold text-red-600">
                belum melakukan presensi
              </span>{" "}
              sebagai <span className="font-bold">Alfa</span>?
            </p>
            <p className="text-micro font-mono text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              Tindakan ini akan secara otomatis memberikan status Alfa dan poin
              pelanggaran pada anggota yang belum hadir.
            </p>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowBatchAlfaDialog(false)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs uppercase h-9 px-4"
            >
              Batal
            </Button>
            <Button
              onClick={handleBatchAlfa}
              className="rounded-lg bg-red-600 hover:bg-red-700 text-white font-mono text-xs uppercase h-9 px-4"
            >
              Tandai Alfa Massal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
