"use client";

import { useState } from "react";
import Link from "next/link";
import { UserDisciplineSummary } from "@/lib/types/komdis";
import { Card } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  UserGroupIcon,
  Alert01Icon,
  Audit01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

export interface SanctionStatusItem {
  id: string;
  profile_id: string;
  sp_level: number;
  status: string;
}

interface DisciplineRecapTableProps {
  summaries: UserDisciplineSummary[];
  activeSanctions: SanctionStatusItem[];
}

export function DisciplineRecapTable({
  summaries,
  activeSanctions,
}: DisciplineRecapTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [spFilter, setSpFilter] = useState<
    "all" | "aman" | "sp1" | "sp2" | "sp3"
  >("all");

  // Map active sanctions by profile_id
  const sanctionMap = new Map<string, number>();
  activeSanctions.forEach((s) => {
    if (s.status === "active") {
      const currentHighest = sanctionMap.get(s.profile_id) || 0;
      if (s.sp_level > currentHighest) {
        sanctionMap.set(s.profile_id, s.sp_level);
      }
    }
  });

  const filteredSummaries = summaries.filter((item) => {
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
    if (spFilter === "sp3") matchesFilter = activeSp === 3 || netPoints >= 100;

    return matchesSearch && matchesFilter;
  });

  // Calculate metrics
  const totalMembers = summaries.length;
  let sp1Count = 0;
  let sp2Count = 0;
  let sp3Count = 0;

  summaries.forEach((s) => {
    const net = s.net_points || 0;
    const sp = sanctionMap.get(s.profile_id || "") || 0;
    if (sp === 3 || net >= 100) sp3Count++;
    else if (sp === 2 || net >= 50) sp2Count++;
    else if (sp === 1 || net >= 30) sp1Count++;
  });

  return (
    <div className="space-y-6">
      {/* Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-4 flex items-center gap-3 border-l-4 border-l-dongker-surface dark:border-l-blue-500">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-dongker-surface dark:text-blue-400 rounded-lg shrink-0">
            <HugeiconsIcon icon={UserGroupIcon} size={20} />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase text-slate-400 dark:text-slate-500 tracking-wider">
              TOTAL ANGGOTA
            </div>
            <div className="font-display text-2xl font-bold text-dongker-ink dark:text-slate-100">
              {totalMembers}
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-4 flex items-center gap-3 border-l-4 border-l-amber-500">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
            <HugeiconsIcon icon={Alert01Icon} size={20} />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase text-amber-600 dark:text-amber-400 tracking-wider">
              ANGGOTA SP 1 (≥30 PTS)
            </div>
            <div className="font-display text-2xl font-bold text-amber-600 dark:text-amber-400">
              {sp1Count}
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-4 flex items-center gap-3 border-l-4 border-l-orange-500">
          <div className="p-2.5 bg-orange-50 dark:bg-orange-950/60 text-orange-deep dark:text-orange-300 rounded-lg shrink-0">
            <HugeiconsIcon icon={Alert01Icon} size={20} />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase text-orange-deep dark:text-orange-300 tracking-wider">
              ANGGOTA SP 2 (≥50 PTS)
            </div>
            <div className="font-display text-2xl font-bold text-orange-deep dark:text-orange-300">
              {sp2Count}
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-4 flex items-center gap-3 border-l-4 border-l-red-500">
          <div className="p-2.5 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-lg shrink-0">
            <HugeiconsIcon icon={Audit01Icon} size={20} />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase text-red-600 dark:text-red-400 tracking-wider">
              ANGGOTA SP 3 (≥100 PTS)
            </div>
            <div className="font-display text-2xl font-bold text-red-600 dark:text-red-400">
              {sp3Count}
            </div>
          </div>
        </Card>
      </div>

      {/* Control & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        {/* Search Bar */}
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="CARI ANGGOTA BERDASARKAN NAMA / NIM..."
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 pl-10 pr-4 py-2.5 text-xs font-mono text-dongker-ink dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-pnp-orange focus:ring-1 focus:ring-pnp-orange rounded-lg"
          />
        </div>

        {/* SP Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700/80 rounded-lg overflow-x-auto">
          {(["all", "aman", "sp1", "sp2", "sp3"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSpFilter(tab)}
              className={`px-3 py-1.5 font-mono text-micro uppercase tracking-wider transition-all whitespace-nowrap ${
                spFilter === tab
                  ? "bg-dongker-surface dark:bg-blue-600 text-white font-bold rounded-md shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-dongker-ink dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-md"
              }`}
            >
              {tab === "all"
                ? "SEMUA"
                : tab === "aman"
                  ? "AMAN (<30)"
                  : tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 font-mono text-micro font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-3.5 px-4">NIM</th>
              <th className="py-3.5 px-4">NAMA ANGGOTA</th>
              <th className="py-3.5 px-4 text-center">POIN PRESENSI</th>
              <th className="py-3.5 px-4 text-center">PEMUTIHAN GORO</th>
              <th className="py-3.5 px-4 text-center">NET POIN</th>
              <th className="py-3.5 px-4 text-center">STATUS SP</th>
              <th className="py-3.5 px-4 text-right">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {filteredSummaries.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-8 text-slate-400 dark:text-slate-500 font-mono text-xs"
                >
                  TIDAK ADA DATA ANGGOTA TERSEDIA
                </td>
              </tr>
            ) : (
              filteredSummaries.map((item) => {
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
                    "bg-orange-50 dark:bg-orange-950/60 text-orange-deep dark:text-orange-300 border-orange-200 dark:border-orange-800";
                  spText = "SP 2";
                } else if (activeSp === 1 || net >= 30) {
                  spBadgeClass =
                    "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800";
                  spText = "SP 1";
                }

                return (
                  <tr
                    key={item.profile_id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {item.nim || "-"}
                    </td>
                    <td className="py-3.5 px-4 font-display font-medium text-dongker-ink dark:text-slate-100">
                      {item.full_name || "Anggota"}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-amber-600 dark:text-amber-400 font-bold">
                      +{item.total_attendance_points || 0}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {item.total_log_points || 0}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-sm font-bold text-dongker-ink dark:text-slate-100">
                      {net} PTS
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider rounded-full border ${spBadgeClass}`}
                      >
                        {spText}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/kedisiplinan/${item.profile_id}`}
                        className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-dongker-surface dark:hover:bg-blue-600 text-dongker-ink dark:text-slate-200 hover:text-white dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-micro font-semibold uppercase tracking-wider transition-all"
                      >
                        <HugeiconsIcon icon={UserIcon} size={14} />
                        Detail &amp; Sanksi
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
