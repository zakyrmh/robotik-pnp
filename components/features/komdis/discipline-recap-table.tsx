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
        <Card className="bg-surface-card-dark border-hairline-dark rounded-none p-4 shadow-none">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/30 rounded-none">
              <HugeiconsIcon icon={UserGroupIcon} size={20} />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase text-gray-400 tracking-wider">
                TOTAL ANGGOTA
              </div>
              <div className="font-mono text-2xl font-bold text-white">
                {totalMembers}
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-surface-card-dark border-hairline-dark rounded-none p-4 shadow-none">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-none">
              <HugeiconsIcon icon={Alert01Icon} size={20} />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase text-amber-400 tracking-wider">
                ANGGOTA SP 1 (≥30 PTS)
              </div>
              <div className="font-mono text-2xl font-bold text-amber-400">
                {sp1Count}
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-surface-card-dark border-hairline-dark rounded-none p-4 shadow-none">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-none">
              <HugeiconsIcon icon={Alert01Icon} size={20} />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase text-orange-400 tracking-wider">
                ANGGOTA SP 2 (≥50 PTS)
              </div>
              <div className="font-mono text-2xl font-bold text-orange-400">
                {sp2Count}
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-surface-card-dark border-hairline-dark rounded-none p-4 shadow-none">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-crimson-red/10 text-crimson-red border border-crimson-red/30 rounded-none">
              <HugeiconsIcon icon={Audit01Icon} size={20} />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase text-crimson-red tracking-wider">
                ANGGOTA SP 3 (≥100 PTS)
              </div>
              <div className="font-mono text-2xl font-bold text-crimson-red">
                {sp3Count}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Control & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-surface-card-dark p-4 border border-hairline-dark">
        {/* Search Bar */}
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="CARI ANGGOTA BERDASARKAN NAMA / NIM..."
            className="w-full bg-canvas-dark border border-hairline-dark pl-10 pr-4 py-2 text-xs font-mono text-white placeholder-gray-500 focus:outline-hidden focus:border-cyber-blue rounded-none"
          />
        </div>

        {/* SP Filter Tabs */}
        <div className="flex items-center gap-1 bg-canvas-dark p-1 border border-hairline-dark overflow-x-auto">
          {(["all", "aman", "sp1", "sp2", "sp3"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSpFilter(tab)}
              className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors rounded-none whitespace-nowrap ${
                spFilter === tab
                  ? "bg-cyber-blue text-white font-bold"
                  : "text-gray-400 hover:text-white"
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
      <div className="border border-hairline-dark bg-surface-card-dark overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-hairline-dark bg-canvas-dark font-mono text-[11px] uppercase tracking-widest text-cyber-blue">
              <th className="py-3 px-4">NIM</th>
              <th className="py-3 px-4">NAMA ANGGOTA</th>
              <th className="py-3 px-4 text-center">POIN PRESENSI</th>
              <th className="py-3 px-4 text-center">PEMUTIHAN GORO</th>
              <th className="py-3 px-4 text-center">
                NET POIN ($P_{"{net}"}$)
              </th>
              <th className="py-3 px-4 text-center">STATUS SP</th>
              <th className="py-3 px-4 text-right">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-dark font-sans text-xs">
            {filteredSummaries.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-8 text-gray-500 font-mono"
                >
                  TIDAK ADA DATA ANGGOTA TERSEDIA
                </td>
              </tr>
            ) : (
              filteredSummaries.map((item) => {
                const net = item.net_points || 0;
                const activeSp = sanctionMap.get(item.profile_id || "") || 0;

                let spBadgeClass =
                  "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
                let spText = "AMAN";

                if (activeSp === 3 || net >= 100) {
                  spBadgeClass =
                    "bg-crimson-red/20 text-crimson-red border-crimson-red/50 animate-pulse";
                  spText = "SP 3 (DO)";
                } else if (activeSp === 2 || net >= 50) {
                  spBadgeClass =
                    "bg-orange-500/10 text-orange-400 border-orange-500/30";
                  spText = "SP 2";
                } else if (activeSp === 1 || net >= 30) {
                  spBadgeClass =
                    "bg-amber-500/10 text-amber-400 border-amber-500/30";
                  spText = "SP 1";
                }

                return (
                  <tr
                    key={item.profile_id}
                    className="hover:bg-canvas-dark/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-gray-400">
                      {item.nim || "-"}
                    </td>
                    <td className="py-3 px-4 font-bold text-white uppercase font-sans">
                      {item.full_name || "Anggota"}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-amber-400 font-bold">
                      +{item.total_attendance_points || 0}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-emerald-400 font-bold">
                      {item.total_log_points || 0}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-sm font-bold text-white">
                      {net} PTS
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider rounded-sm border ${spBadgeClass}`}
                      >
                        {spText}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/kedisiplinan/${item.profile_id}`}
                        className="inline-flex items-center gap-1 bg-cyber-blue/10 hover:bg-cyber-blue text-cyber-blue hover:text-white px-3 py-1 border border-cyber-blue/30 font-mono text-[10px] uppercase tracking-wider transition-colors rounded-none"
                      >
                        <HugeiconsIcon icon={UserIcon} size={12} />[ DETAIL &
                        SANKS ]
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
