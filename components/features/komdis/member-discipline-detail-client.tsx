"use client";

import { useState } from "react";
import Link from "next/link";
import { DisciplinePointLog, Sanction } from "@/lib/types/komdis";
import { GoroReductionDialog } from "./goro-reduction-dialog";
import { LegacyPointDialog } from "./legacy-point-dialog";
import { IssueSanctionDialog } from "./issue-sanction-dialog";
import { MemberInternshipModal } from "./member-internship-modal";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  UserIcon,
  Alert01Icon,
  RecycleIcon,
  Audit01Icon,
  Briefcase01Icon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons";

export interface AttendanceHistoryItem {
  id: string;
  status: string;
  approval_status: string | null;
  points_awarded: number;
  check_in_at: string | null;
  created_at: string | null;
  activity?: {
    title: string;
    start_date: string;
  } | null;
}

export interface MemberProfileDetailData {
  id: string;
  full_name: string | null;
  nim: string | null;
  role: string;
  is_on_internship?: boolean;
  internship_start_date?: string | null;
  internship_end_date?: string | null;
}

interface MemberDisciplineDetailClientProps {
  member: MemberProfileDetailData;
  netPoints: number;
  totalAttendancePoints: number;
  totalLegacyPoints?: number;
  totalGoroPoints?: number;
  totalLogPoints: number;
  activeSanctionLevel: number | null;
  attendances: AttendanceHistoryItem[];
  pointLogs: DisciplinePointLog[];
  sanctions: Sanction[];
}

export function MemberDisciplineDetailClient({
  member,
  netPoints,
  totalAttendancePoints,
  totalLegacyPoints = 0,
  totalGoroPoints = 0,
  activeSanctionLevel,
  attendances,
  pointLogs,
  sanctions,
}: MemberDisciplineDetailClientProps) {
  const [activeTab, setActiveTab] = useState<
    "attendances" | "goro" | "sanctions"
  >("attendances");

  const [isGoroOpen, setIsGoroOpen] = useState(false);
  const [isLegacyOpen, setIsLegacyOpen] = useState(false);
  const [isSpOpen, setIsSpOpen] = useState(false);
  const [isInternshipModalOpen, setIsInternshipModalOpen] = useState(false);

  let spBadgeClass =
    "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
  let spStatusText = "AMAN / TANPA SANKSI";

  if (activeSanctionLevel === 3 || netPoints >= 100) {
    spBadgeClass =
      "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 animate-pulse";
    spStatusText = "SURAT PERINGATAN 3 (DO)";
  } else if (activeSanctionLevel === 2 || netPoints >= 50) {
    spBadgeClass =
      "bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-300 border-orange-200 dark:border-orange-800";
    spStatusText = "SURAT PERINGATAN 2 (AKTIF)";
  } else if (activeSanctionLevel === 1 || netPoints >= 30) {
    spBadgeClass =
      "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800";
    spStatusText = "SURAT PERINGATAN 1 (AKTIF)";
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Header Banner & Navigation */}
      <div className="space-y-2 sm:space-y-3">
        <div className="h-1.5 w-full bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718] rounded-full" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          <Button
            variant="ghost"
            asChild
            className="w-fit -ml-2 font-mono text-xs text-slate-600 dark:text-slate-400 hover:text-[#0a192f] dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg px-2.5 h-8"
          >
            <Link href="/kedisiplinan">
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={16}
                className="mr-1.5 shrink-0"
              />
              KEMBALI KE DIREKTORI KEDISIPLINAN
            </Link>
          </Button>

          <span className="font-mono text-[10px] sm:text-micro font-semibold text-[#1e3a8a] dark:text-blue-400 uppercase tracking-widest">
            DETAIL DISIPLIN & SANKSI ANGGOTA
          </span>
        </div>
      </div>

      {/* Active SP Warning Alert Banner */}
      {activeSanctionLevel && activeSanctionLevel > 0 ? (
        <div className="bg-red-50 dark:bg-red-950/50 border-l-4 border-l-red-600 border border-red-200 dark:border-red-900/60 p-3.5 sm:p-4 rounded-xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg shrink-0 mt-0.5 sm:mt-0">
              <HugeiconsIcon
                icon={Alert01Icon}
                size={22}
                className="animate-pulse"
              />
            </div>
            <div>
              <div className="font-mono font-bold text-xs uppercase text-red-700 dark:text-red-300">
                STATUS PERINGATAN KEDISIPLINAN AKTIF!
              </div>
              <div className="text-xs text-red-600/90 dark:text-red-400 font-sans mt-0.5 leading-snug">
                {activeSanctionLevel === 1
                  ? "Anggota wajib melaksanakan sanksi Goro minimal 4x/bulan untuk pemutihan -10 Poin."
                  : activeSanctionLevel === 2
                    ? "Penahanan Baju PDH + Evaluasi Tim KRI + Goro minimal 6x/bulan."
                    : "Rekomendasi pemberhentian dari keanggotaan UKM Robotik PNP."}
              </div>
            </div>
          </div>
          <Badge className="bg-red-600 text-white font-mono font-bold text-xs px-3 py-1 uppercase rounded-md shrink-0 self-start sm:self-center">
            SP {activeSanctionLevel} AKTIF
          </Badge>
        </div>
      ) : null}

      {/* Main Profile Header Card */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-4 sm:p-5 border-l-4 border-l-[#1e3a8a] dark:border-l-blue-500 overflow-hidden">
        <CardContent className="p-0 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 sm:gap-6">
          {/* Left Info: Avatar + Details */}
          <div className="flex items-start gap-3 sm:gap-4 w-full min-w-0 flex-1">
            <div className="h-12 w-12 sm:h-16 sm:w-16 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-[#1e3a8a] dark:text-blue-400 flex items-center justify-center rounded-xl shrink-0 font-mono text-lg sm:text-xl font-bold">
              <HugeiconsIcon icon={UserIcon} size={26} />
            </div>

            <div className="space-y-1.5 min-w-0 flex-1 overflow-hidden">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-micro sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                  NIM: {member.nim || "—"} &bull; ROLE:{" "}
                  {member.role.toUpperCase()}
                </span>
              </div>

              <h1 className="text-lg sm:text-2xl font-display font-bold uppercase tracking-tight text-[#0a192f] dark:text-slate-100 wrap-break-word leading-snug">
                {member.full_name || "Anggota UKM"}
              </h1>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span
                  className={`inline-block px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider rounded-full border shrink-0 ${spBadgeClass}`}
                >
                  {spStatusText}
                </span>

                {member.is_on_internship && (
                  <div className="inline-flex flex-wrap items-center gap-1.5">
                    <span className="bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-mono font-semibold px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
                      💼 MAGANG / PKL
                    </span>
                    {(member.internship_start_date ||
                      member.internship_end_date) && (
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-medium px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
                        {member.internship_start_date || "—"} S/D{" "}
                        {member.internship_end_date || "—"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Info: Net Points Counter & Admin Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto border-t xl:border-t-0 pt-4 xl:pt-0 border-slate-100 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-3.5 border border-slate-200 dark:border-slate-700 rounded-xl text-center min-w-40 shrink-0 space-y-1.5">
              <div>
                <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  NETTO SAAT INI
                </div>
                <div className="font-display text-2xl sm:text-3xl font-bold text-[#0a192f] dark:text-slate-100">
                  {netPoints}{" "}
                  <span className="text-xs font-mono text-slate-400">PTS</span>
                </div>
              </div>
              <div className="pt-1.5 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center gap-2 font-mono text-[10px]">
                <span
                  className="text-amber-600 dark:text-amber-400 font-semibold"
                  title="Poin Presensi"
                >
                  +{totalAttendancePoints}
                </span>
                <span className="text-slate-300 dark:text-slate-600">
                  &bull;
                </span>
                <span
                  className="text-orange-600 dark:text-orange-400 font-semibold"
                  title="Poin Awal/Manual"
                >
                  +{totalLegacyPoints}
                </span>
                <span className="text-slate-300 dark:text-slate-600">
                  &bull;
                </span>
                <span
                  className="text-emerald-600 dark:text-emerald-400 font-semibold"
                  title="Pemutihan Goro"
                >
                  {totalGoroPoints}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsLegacyOpen(true)}
                  className="font-mono text-micro uppercase tracking-wider h-9 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white justify-center whitespace-nowrap"
                >
                  <HugeiconsIcon
                    icon={Alert01Icon}
                    size={15}
                    className="mr-1.5 shrink-0"
                  />
                  + Poin Awal Periode 20
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsGoroOpen(true)}
                  className="font-mono text-micro uppercase tracking-wider h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white justify-center whitespace-nowrap"
                >
                  <HugeiconsIcon
                    icon={RecycleIcon}
                    size={15}
                    className="mr-1.5 shrink-0"
                  />
                  + Pemutihan Goro
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsSpOpen(true)}
                  className="font-mono text-micro uppercase tracking-wider h-9 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white justify-center whitespace-nowrap"
                >
                  <HugeiconsIcon
                    icon={Audit01Icon}
                    size={15}
                    className="mr-1.5 shrink-0"
                  />
                  + Terbitkan SP
                </Button>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsInternshipModalOpen(true)}
                className="font-mono text-micro uppercase tracking-wider h-9 w-full rounded-lg border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/50 justify-center whitespace-nowrap"
              >
                <HugeiconsIcon
                  icon={Briefcase01Icon}
                  size={15}
                  className="mr-1.5 shrink-0"
                />
                Atur Status Magang / PKL
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Tabs Navigation */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 font-mono text-xs uppercase tracking-wider overflow-x-auto no-scrollbar scroll-smooth">
            <button
              onClick={() => setActiveTab("attendances")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === "attendances"
                  ? "border-[#1e3a8a] dark:border-blue-500 text-[#1e3a8a] dark:text-blue-400 font-bold bg-white dark:bg-slate-900"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-[#0a192f] dark:hover:text-slate-100"
              }`}
            >
              <HugeiconsIcon
                icon={Calendar01Icon}
                size={16}
                className="shrink-0"
              />
              <span>
                <span className="inline sm:hidden">
                  PRESENSI ({attendances.length})
                </span>
                <span className="hidden sm:inline">
                  PRESENSI & SANKSI PRESENSI ({attendances.length})
                </span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab("goro")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === "goro"
                  ? "border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold bg-white dark:bg-slate-900"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-[#0a192f] dark:hover:text-slate-100"
              }`}
            >
              <HugeiconsIcon
                icon={RecycleIcon}
                size={16}
                className="shrink-0"
              />
              <span>
                <span className="inline sm:hidden">
                  LOG POIN ({pointLogs.length})
                </span>
                <span className="hidden sm:inline">
                  LOG PEMUTIHAN & POIN AWAL ({pointLogs.length})
                </span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab("sanctions")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === "sanctions"
                  ? "border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 font-bold bg-white dark:bg-slate-900"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-[#0a192f] dark:hover:text-slate-100"
              }`}
            >
              <HugeiconsIcon
                icon={Audit01Icon}
                size={16}
                className="shrink-0"
              />
              <span>
                <span className="inline sm:hidden">
                  SURAT PERINGATAN ({sanctions.length})
                </span>
                <span className="hidden sm:inline">
                  RIWAYAT SURAT PERINGATAN ({sanctions.length})
                </span>
              </span>
            </button>
          </div>

          {/* Tab 1: Attendance History */}
          {activeTab === "attendances" && (
            <div>
              {attendances.length === 0 ? (
                <div className="p-8 text-center font-mono text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  BELUM ADA RIWAYAT PRESENSI KEGIATAN
                </div>
              ) : (
                <>
                  {/* Mobile View */}
                  <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800 p-3 space-y-2">
                    {attendances.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-lg space-y-1.5"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-[10px] text-slate-400">
                            {item.created_at
                              ? new Date(item.created_at).toLocaleDateString(
                                  "id-ID",
                                )
                              : "—"}
                          </span>
                          <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                            +{item.points_awarded || 0} PTS
                          </span>
                        </div>
                        <div className="font-display font-medium text-xs text-[#0a192f] dark:text-slate-100 leading-snug">
                          {item.activity?.title || "Kegiatan Formal"}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono uppercase px-2 py-0.5">
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                        <TableRow>
                          <TableHead className="font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 py-3 px-4">
                            TANGGAL
                          </TableHead>
                          <TableHead className="font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 py-3 px-4">
                            KEGIATAN
                          </TableHead>
                          <TableHead className="text-center font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 py-3 px-4">
                            STATUS PRESENSI
                          </TableHead>
                          <TableHead className="text-center font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 py-3 px-4">
                            POIN SANKSI
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                        {attendances.map((item) => (
                          <TableRow
                            key={item.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                          >
                            <TableCell className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                              {item.created_at
                                ? new Date(item.created_at).toLocaleDateString(
                                    "id-ID",
                                  )
                                : "—"}
                            </TableCell>
                            <TableCell className="py-3.5 px-4 font-display font-medium text-[#0a192f] dark:text-slate-100">
                              {item.activity?.title || "Kegiatan Formal"}
                            </TableCell>
                            <TableCell className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider rounded-md border ${
                                  item.status === "hadir"
                                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                    : item.status === "telat"
                                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                                      : "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                                }`}
                              >
                                {item.status}
                              </span>
                            </TableCell>
                            <TableCell className="py-3.5 px-4 text-center font-mono text-amber-600 dark:text-amber-400 font-bold">
                              +{item.points_awarded || 0} PTS
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab 2: Goro Point Reduction & Legacy Point Log */}
          {activeTab === "goro" && (
            <div>
              {pointLogs.length === 0 ? (
                <div className="p-8 text-center font-mono text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  BELUM ADA LOG PEMUTIHAN ATAU POIN AWAL
                </div>
              ) : (
                <>
                  {/* Mobile View */}
                  <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800 p-3 space-y-2">
                    {pointLogs.map((log) => {
                      const isPositive = log.points > 0;
                      return (
                        <div
                          key={log.id}
                          className="p-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-lg space-y-1"
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-mono text-[10px] text-slate-400">
                              {log.created_at
                                ? new Date(log.created_at).toLocaleDateString(
                                    "id-ID",
                                  )
                                : "—"}
                            </span>
                            <span
                              className={`font-mono text-xs font-bold ${
                                isPositive
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {isPositive ? `+${log.points}` : log.points} PTS
                            </span>
                          </div>
                          <div
                            className={`font-mono text-xs font-bold uppercase ${
                              isPositive
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            Kategori: {log.category}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-300">
                            {log.description}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                        <TableRow>
                          <TableHead className="font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 py-3 px-4">
                            TANGGAL
                          </TableHead>
                          <TableHead className="font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 py-3 px-4">
                            KATEGORI
                          </TableHead>
                          <TableHead className="font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 py-3 px-4">
                            DESKRIPSI CATATAN
                          </TableHead>
                          <TableHead className="text-center font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 py-3 px-4">
                            NILAI POIN
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                        {pointLogs.map((log) => {
                          const isPositive = log.points > 0;
                          return (
                            <TableRow
                              key={log.id}
                              className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                            >
                              <TableCell className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                                {log.created_at
                                  ? new Date(log.created_at).toLocaleDateString(
                                      "id-ID",
                                    )
                                  : "—"}
                              </TableCell>
                              <TableCell
                                className={`py-3.5 px-4 font-mono font-semibold uppercase ${
                                  isPositive
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {log.category}
                              </TableCell>
                              <TableCell className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                                {log.description}
                              </TableCell>
                              <TableCell
                                className={`py-3.5 px-4 text-center font-mono font-bold text-sm ${
                                  isPositive
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {isPositive ? `+${log.points}` : log.points} PTS
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab 3: Sanctions Issued History */}
          {activeTab === "sanctions" && (
            <div>
              {sanctions.length === 0 ? (
                <div className="p-8 text-center font-mono text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  BELUM ADA RIWAYAT SURAT PERINGATAN DITERBITKAN
                </div>
              ) : (
                <>
                  {/* Mobile View */}
                  <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800 p-3 space-y-2">
                    {sanctions.map((sp) => (
                      <div
                        key={sp.id}
                        className="p-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-lg space-y-1.5"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-[10px] text-slate-400">
                            {sp.issued_at
                              ? new Date(sp.issued_at).toLocaleDateString(
                                  "id-ID",
                                )
                              : "—"}
                          </span>
                          <Badge className="bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-[10px] font-mono uppercase">
                            {sp.status}
                          </Badge>
                        </div>
                        <div className="font-mono font-bold text-xs text-red-600 dark:text-red-400">
                          SURAT PERINGATAN {sp.sp_level} (
                          {sp.points_at_issuance} PTS)
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          {sp.notes || "—"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                        <TableRow>
                          <TableHead className="font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 py-3 px-4">
                            TANGGAL DITERBITKAN
                          </TableHead>
                          <TableHead className="font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 py-3 px-4">
                            TINGKAT SP
                          </TableHead>
                          <TableHead className="text-center font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 py-3 px-4">
                            POIN SAAT SP DITERBITKAN
                          </TableHead>
                          <TableHead className="font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 py-3 px-4">
                            CATATAN KOMDIS
                          </TableHead>
                          <TableHead className="text-center font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 py-3 px-4">
                            STATUS
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                        {sanctions.map((sp) => (
                          <TableRow
                            key={sp.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                          >
                            <TableCell className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                              {sp.issued_at
                                ? new Date(sp.issued_at).toLocaleDateString(
                                    "id-ID",
                                  )
                                : "—"}
                            </TableCell>
                            <TableCell className="py-3.5 px-4 font-mono font-bold text-red-600 dark:text-red-400">
                              SURAT PERINGATAN {sp.sp_level}
                            </TableCell>
                            <TableCell className="py-3.5 px-4 text-center font-mono font-bold text-[#0a192f] dark:text-slate-100">
                              {sp.points_at_issuance} PTS
                            </TableCell>
                            <TableCell className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                              {sp.notes || "—"}
                            </TableCell>
                            <TableCell className="py-3.5 px-4 text-center">
                              <span className="inline-block px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider rounded-md border bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                                {sp.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Modals */}
      <LegacyPointDialog
        profileId={member.id}
        profileName={member.full_name || "Anggota"}
        isOpen={isLegacyOpen}
        onClose={() => setIsLegacyOpen(false)}
      />

      <GoroReductionDialog
        profileId={member.id}
        profileName={member.full_name || "Anggota"}
        isOpen={isGoroOpen}
        onClose={() => setIsGoroOpen(false)}
      />

      <IssueSanctionDialog
        profileId={member.id}
        profileName={member.full_name || "Anggota"}
        currentNetPoints={netPoints}
        isOpen={isSpOpen}
        onClose={() => setIsSpOpen(false)}
      />

      <MemberInternshipModal
        key={member.id}
        isOpen={isInternshipModalOpen}
        onClose={() => setIsInternshipModalOpen(false)}
        member={{
          profileId: member.id,
          fullName: member.full_name || "Anggota",
          nim: member.nim || "",
          isOnInternship: !!member.is_on_internship,
          internshipStartDate: member.internship_start_date || null,
          internshipEndDate: member.internship_end_date || null,
        }}
      />
    </div>
  );
}
