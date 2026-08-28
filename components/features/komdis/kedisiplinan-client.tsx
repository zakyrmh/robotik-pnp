"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { UserDisciplineSummary } from "@/lib/types/komdis";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { MemberInternshipModal } from "./member-internship-modal";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  UserGroupIcon,
  Alert01Icon,
  Audit01Icon,
  UserIcon,
  Briefcase01Icon,
  FilterIcon,
} from "@hugeicons/core-free-icons";

export interface SanctionStatusItem {
  id: string;
  profile_id: string;
  sp_level: number;
  status: string;
}

export interface ExtendedUserDisciplineSummary extends UserDisciplineSummary {
  is_on_internship?: boolean;
  internship_start_date?: string | null;
  internship_end_date?: string | null;
}

interface KedisiplinanClientProps {
  summaries: ExtendedUserDisciplineSummary[];
  activeSanctions: SanctionStatusItem[];
}

export function KedisiplinanClient({
  summaries,
  activeSanctions,
}: KedisiplinanClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [spFilter, setSpFilter] = useState<
    "all" | "aman" | "sp1" | "sp2" | "sp3" | "magang"
  >("all");

  const [selectedMember, setSelectedMember] = useState<{
    profileId: string;
    fullName: string;
    nim: string;
    isOnInternship: boolean;
    internshipStartDate: string | null;
    internshipEndDate: string | null;
  } | null>(null);

  // Map active sanctions by profile_id
  const sanctionMap = useMemo(() => {
    const map = new Map<string, number>();
    activeSanctions.forEach((s) => {
      if (s.status === "active") {
        const currentHighest = map.get(s.profile_id) || 0;
        if (s.sp_level > currentHighest) {
          map.set(s.profile_id, s.sp_level);
        }
      }
    });
    return map;
  }, [activeSanctions]);

  // Filter Summaries based on Search & Status Filter
  const filteredSummaries = useMemo(() => {
    return summaries.filter((item) => {
      const nameMatch = (item.full_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const nimMatch = (item.nim || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesSearch = nameMatch || nimMatch;

      const netPoints = item.net_points || 0;
      const activeSp = sanctionMap.get(item.profile_id || "") || 0;

      let matchesFilter = true;
      if (spFilter === "aman") matchesFilter = netPoints < 30 && activeSp === 0;
      if (spFilter === "sp1")
        matchesFilter = activeSp === 1 || (netPoints >= 30 && netPoints < 50);
      if (spFilter === "sp2")
        matchesFilter = activeSp === 2 || (netPoints >= 50 && netPoints < 100);
      if (spFilter === "sp3")
        matchesFilter = activeSp === 3 || netPoints >= 100;
      if (spFilter === "magang") matchesFilter = !!item.is_on_internship;

      return matchesSearch && matchesFilter;
    });
  }, [summaries, searchTerm, spFilter, sanctionMap]);

  // Calculate Metrics
  const metrics = useMemo(() => {
    const totalMembers = summaries.length;
    let sp1Count = 0;
    let sp2Count = 0;
    let sp3Count = 0;
    let magangCount = 0;

    summaries.forEach((s) => {
      const net = s.net_points || 0;
      const sp = sanctionMap.get(s.profile_id || "") || 0;
      if (sp === 3 || net >= 100) sp3Count++;
      else if (sp === 2 || net >= 50) sp2Count++;
      else if (sp === 1 || net >= 30) sp1Count++;

      if (s.is_on_internship) magangCount++;
    });

    return { totalMembers, sp1Count, sp2Count, sp3Count, magangCount };
  }, [summaries, sanctionMap]);

  return (
    <div className="space-y-6 w-full">
      {/* Header Banner Section */}
      <div className="space-y-2">
        <div className="h-1.5 w-full bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718] rounded-full" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
          <div>
            <span className="font-mono text-[11px] font-semibold text-[#1e3a8a] dark:text-blue-400 uppercase tracking-widest block">
              MODUL MANAJEMEN KEDISIPLINAN ORGANISASI
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-[#0a192f] dark:text-slate-100">
              REKAPITULASI POIN KEDISIPLINAN ANGGOTA
            </h1>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
              Monitoring akumulasi poin sanksi, perizinan, dan dispensasi
              magang/PKL untuk anggota aktif dan pengurus.
            </p>
          </div>
        </div>
      </div>

      {/* Member Internship Management Dialog */}
      <MemberInternshipModal
        key={selectedMember?.profileId || "none"}
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
      />

      {/* Telemetry Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Total Anggota */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-3.5 sm:p-4 border-l-4 border-l-[#1e3a8a] dark:border-l-blue-500">
          <CardContent className="p-0 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-[#1e3a8a] dark:text-blue-400 rounded-lg shrink-0">
              <HugeiconsIcon icon={UserGroupIcon} size={20} />
            </div>
            <div>
              <CardDescription className="font-mono text-[10px] uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                TOTAL ANGGOTA
              </CardDescription>
              <CardTitle className="font-display text-xl sm:text-2xl font-bold text-[#0a192f] dark:text-slate-100">
                {metrics.totalMembers}
              </CardTitle>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: SP 1 */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-3.5 sm:p-4 border-l-4 border-l-amber-500">
          <CardContent className="p-0 flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
              <HugeiconsIcon icon={Alert01Icon} size={20} />
            </div>
            <div>
              <CardDescription className="font-mono text-[10px] uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                SP 1 (≥30 PTS)
              </CardDescription>
              <CardTitle className="font-display text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
                {metrics.sp1Count}
              </CardTitle>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: SP 2 */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-3.5 sm:p-4 border-l-4 border-l-orange-500">
          <CardContent className="p-0 flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-300 rounded-lg shrink-0">
              <HugeiconsIcon icon={Alert01Icon} size={20} />
            </div>
            <div>
              <CardDescription className="font-mono text-[10px] uppercase text-orange-600 dark:text-orange-300 tracking-wider">
                SP 2 (≥50 PTS)
              </CardDescription>
              <CardTitle className="font-display text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-300">
                {metrics.sp2Count}
              </CardTitle>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: SP 3 */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-3.5 sm:p-4 border-l-4 border-l-red-500">
          <CardContent className="p-0 flex items-center gap-3">
            <div className="p-2.5 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-lg shrink-0">
              <HugeiconsIcon icon={Audit01Icon} size={20} />
            </div>
            <div>
              <CardDescription className="font-mono text-[10px] uppercase text-red-600 dark:text-red-400 tracking-wider">
                SP 3 (≥100 PTS)
              </CardDescription>
              <CardTitle className="font-display text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                {metrics.sp3Count}
              </CardTitle>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Sedang Magang */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-3.5 sm:p-4 border-l-4 border-l-purple-500 col-span-2 sm:col-span-1">
          <CardContent className="p-0 flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-lg shrink-0">
              <HugeiconsIcon icon={Briefcase01Icon} size={20} />
            </div>
            <div>
              <CardDescription className="font-mono text-[10px] uppercase text-purple-600 dark:text-purple-400 tracking-wider">
                SEDANG MAGANG
              </CardDescription>
              <CardTitle className="font-display text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                {metrics.magangCount}
              </CardTitle>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls & Filter Bar */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-3.5 sm:p-4">
        <CardContent className="p-0 flex flex-col md:flex-row gap-3 md:items-center justify-between">
          {/* Search Bar Input */}
          <div className="relative flex-1">
            <HugeiconsIcon
              icon={Search01Icon}
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="CARI ANGGOTA BERDASARKAN NAMA / NIM..."
              className="pl-10 h-10 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 font-mono text-xs text-[#0a192f] dark:text-slate-100 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#f97316]/20 focus-visible:border-[#f97316] rounded-lg"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700 rounded-lg overflow-x-auto">
            {(
              [
                { id: "all", label: "SEMUA" },
                { id: "aman", label: "AMAN (<30)" },
                { id: "sp1", label: "SP 1" },
                { id: "sp2", label: "SP 2" },
                { id: "sp3", label: "SP 3" },
                { id: "magang", label: "💼 MAGANG" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSpFilter(tab.id)}
                className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-all whitespace-nowrap rounded-md ${
                  spFilter === tab.id
                    ? "bg-[#1e3a8a] dark:bg-blue-600 text-white font-bold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-[#0a192f] dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Member List Views */}
      {filteredSummaries.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-8 sm:p-12 text-center">
          <CardContent className="p-0 space-y-2">
            <HugeiconsIcon
              icon={FilterIcon}
              size={36}
              className="mx-auto text-slate-400 dark:text-slate-600"
            />
            <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Tidak ada data anggota sesuai kriteria pencarian.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Layout: Responsive Card Grid */}
          <div className="block md:hidden space-y-3">
            {filteredSummaries.map((item) => {
              const net = item.net_points || 0;
              const activeSp = sanctionMap.get(item.profile_id || "") || 0;

              let spBadgeClass =
                "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
              let spText = "AMAN";

              if (activeSp === 3 || net >= 100) {
                spBadgeClass =
                  "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 animate-pulse";
                spText = "SP 3 (DO)";
              } else if (activeSp === 2 || net >= 50) {
                spBadgeClass =
                  "bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-300 border-orange-200 dark:border-orange-800";
                spText = "SP 2";
              } else if (activeSp === 1 || net >= 30) {
                spBadgeClass =
                  "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800";
                spText = "SP 1";
              }

              return (
                <Card
                  key={item.profile_id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 border-l-4 border-l-[#1e3a8a] shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                        NIM: {item.nim || "—"}
                      </span>
                      <span className="font-display font-bold text-sm text-[#0a192f] dark:text-slate-100 block">
                        {item.full_name || "Anggota"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.is_on_internship && (
                        <Badge className="bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-mono font-semibold px-2 py-0.5 uppercase">
                          MAGANG
                        </Badge>
                      )}
                      <span
                        className={`inline-block px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider rounded-full border ${spBadgeClass}`}
                      >
                        {spText}
                      </span>
                    </div>
                  </div>

                  {/* Points telemetry */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center font-mono text-xs">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block uppercase">
                        PRESENSI
                      </span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        +{item.total_attendance_points || 0}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block uppercase">
                        POIN AWAL
                      </span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        +{item.total_legacy_points || 0}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block uppercase">
                        PEMUTIHAN
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {item.total_goro_points || 0}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block uppercase">
                        NET POIN
                      </span>
                      <span className="font-bold text-[#0a192f] dark:text-slate-100">
                        {net} PTS
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setSelectedMember({
                          profileId: item.profile_id || "",
                          fullName: item.full_name || "Anggota",
                          nim: item.nim || "",
                          isOnInternship: !!item.is_on_internship,
                          internshipStartDate:
                            item.internship_start_date || null,
                          internshipEndDate: item.internship_end_date || null,
                        })
                      }
                      className="font-mono text-[11px] uppercase tracking-wider h-8 px-2.5 rounded-lg border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/50"
                    >
                      <HugeiconsIcon
                        icon={Briefcase01Icon}
                        size={13}
                        className="mr-1"
                      />
                      Atur Magang
                    </Button>

                    <Button
                      size="sm"
                      asChild
                      className="font-mono text-[11px] uppercase tracking-wider h-8 px-3 rounded-lg bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#1e40af] text-white"
                    >
                      <Link href={`/kedisiplinan/${item.profile_id}`}>
                        <HugeiconsIcon
                          icon={UserIcon}
                          size={14}
                          className="mr-1"
                        />
                        Detail
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Desktop Layout: High-Density Shadcn UI Table */}
          <div className="hidden md:block overflow-x-auto border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                <TableRow>
                  <TableHead className="font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 py-3.5 px-4">
                    NIM
                  </TableHead>
                  <TableHead className="font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 py-3.5 px-4">
                    Nama Anggota Aktif
                  </TableHead>
                  <TableHead className="text-center font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 py-3.5 px-4">
                    Poin Presensi
                  </TableHead>
                  <TableHead className="text-center font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 py-3.5 px-4">
                    Poin Awal / Manual
                  </TableHead>
                  <TableHead className="text-center font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 py-3.5 px-4">
                    Pemutihan Goro
                  </TableHead>
                  <TableHead className="text-center font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 py-3.5 px-4">
                    Net Poin Sanksi
                  </TableHead>
                  <TableHead className="text-center font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 py-3.5 px-4">
                    Status SP
                  </TableHead>
                  <TableHead className="text-right font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 py-3.5 px-4">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredSummaries.map((item) => {
                  const net = item.net_points || 0;
                  const activeSp = sanctionMap.get(item.profile_id || "") || 0;

                  let spBadgeClass =
                    "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
                  let spText = "AMAN";

                  if (activeSp === 3 || net >= 100) {
                    spBadgeClass =
                      "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 animate-pulse";
                    spText = "SP 3 (DO)";
                  } else if (activeSp === 2 || net >= 50) {
                    spBadgeClass =
                      "bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-300 border-orange-200 dark:border-orange-800";
                    spText = "SP 2";
                  } else if (activeSp === 1 || net >= 30) {
                    spBadgeClass =
                      "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800";
                    spText = "SP 1";
                  }

                  return (
                    <TableRow
                      key={item.profile_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <TableCell className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {item.nim || "—"}
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-medium text-[#0a192f] dark:text-slate-100">
                            {item.full_name || "Anggota"}
                          </span>
                          {item.is_on_internship && (
                            <Badge className="bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md uppercase shrink-0">
                              💼 MAGANG / PKL
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center font-mono text-amber-600 dark:text-amber-400 font-bold">
                        +{item.total_attendance_points || 0}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center font-mono text-orange-600 dark:text-orange-400 font-bold">
                        +{item.total_legacy_points || 0}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {item.total_goro_points || 0}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center font-mono text-sm font-bold text-[#0a192f] dark:text-slate-100">
                        {net} PTS
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider rounded-full border ${spBadgeClass}`}
                        >
                          {spText}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setSelectedMember({
                                profileId: item.profile_id || "",
                                fullName: item.full_name || "Anggota",
                                nim: item.nim || "",
                                isOnInternship: !!item.is_on_internship,
                                internshipStartDate:
                                  item.internship_start_date || null,
                                internshipEndDate:
                                  item.internship_end_date || null,
                              })
                            }
                            className="font-mono text-[11px] uppercase tracking-wider h-8 px-2.5 rounded-lg border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/50"
                            title="Atur Status Magang / PKL"
                          >
                            <HugeiconsIcon
                              icon={Briefcase01Icon}
                              size={13}
                              className="mr-1"
                            />
                            Magang
                          </Button>

                          <Button
                            size="sm"
                            asChild
                            className="font-mono text-[11px] uppercase tracking-wider h-8 px-3 rounded-lg bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#1e40af] text-white"
                          >
                            <Link href={`/kedisiplinan/${item.profile_id}`}>
                              <HugeiconsIcon
                                icon={UserIcon}
                                size={14}
                                className="mr-1"
                              />
                              Detail
                            </Link>
                          </Button>
                        </div>
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
  );
}
