"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  Search01Icon,
  UserIcon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { KomdisMemberAttendanceItem } from "@/lib/actions/komdis";

interface KomdisMemberAttendanceTabProps {
  activities: { id: string; title: string; start_date: string }[];
  members: KomdisMemberAttendanceItem[];
}

export function KomdisMemberAttendanceTab({
  activities,
  members,
}: KomdisMemberAttendanceTabProps) {
  const [search, setSearch] = useState("");
  const [pointFilter, setPointFilter] = useState<
    "all" | "has_points" | "clean"
  >("all");

  // Summary Telemetry
  const summary = useMemo(() => {
    let totalHadir = 0;
    let totalTelat = 0;
    let totalIzinSakit = 0;
    let totalAlfa = 0;
    let totalPenaltyPoints = 0;
    let membersWithPenalty = 0;

    members.forEach((m) => {
      totalHadir += m.totals.hadir;
      totalTelat += m.totals.telat;
      totalIzinSakit += m.totals.izin + m.totals.sakit;
      totalAlfa += m.totals.alfa;
      totalPenaltyPoints += m.totalPoints;
      if (m.totalPoints > 0) membersWithPenalty++;
    });

    return {
      totalMembers: members.length,
      totalActivities: activities.length,
      totalHadir,
      totalTelat,
      totalIzinSakit,
      totalAlfa,
      totalPenaltyPoints,
      membersWithPenalty,
    };
  }, [members, activities]);

  // Filtered Members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const query = search.toLowerCase();
      const matchSearch =
        m.fullName.toLowerCase().includes(query) ||
        m.nim.toLowerCase().includes(query) ||
        m.studyProgramName.toLowerCase().includes(query) ||
        m.majorName.toLowerCase().includes(query);

      let matchFilter = true;
      if (pointFilter === "has_points") {
        matchFilter = m.totalPoints > 0;
      } else if (pointFilter === "clean") {
        matchFilter = m.totalPoints === 0;
      }

      return matchSearch && matchFilter;
    });
  }, [members, search, pointFilter]);

  const getAttendancePill = (
    status: "hadir" | "telat" | "izin" | "sakit" | "alfa" | null,
  ) => {
    if (!status) {
      return (
        <span className="text-[10px] font-mono text-slate-300 dark:text-slate-700">
          —
        </span>
      );
    }
    switch (status) {
      case "hadir":
        return (
          <span
            className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"
            title="Hadir"
          />
        );
      case "telat":
        return (
          <span
            className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500"
            title="Telat"
          />
        );
      case "izin":
      case "sakit":
        return (
          <span
            className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500"
            title={status.toUpperCase()}
          />
        );
      case "alfa":
        return (
          <span
            className="inline-block w-2.5 h-2.5 rounded-full bg-red-500"
            title="Alfa"
          />
        );
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 rounded-xl text-center border-l-4 border-l-[#1e3a8a] dark:border-l-blue-500 shadow-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
            TOTAL ANGGOTA
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-[#0a192f] dark:text-slate-100">
            {summary.totalMembers}
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 rounded-xl text-center border-l-4 border-l-emerald-500 shadow-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
            TOTAL HADIR
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {summary.totalHadir}
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 rounded-xl text-center border-l-4 border-l-amber-500 shadow-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
            TOTAL TELAT
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
            {summary.totalTelat}
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 rounded-xl text-center border-l-4 border-l-red-500 shadow-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
            TOTAL ALFA
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
            {summary.totalAlfa}
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 rounded-xl text-center border-l-4 border-l-[#f97316] col-span-2 sm:col-span-1 shadow-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
            POIN SANKSII
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-[#f97316]">
            {summary.totalPenaltyPoints}
          </span>
        </div>
      </div>

      {/* Filter Controls */}
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

        <div className="w-full sm:w-56">
          <select
            value={pointFilter}
            onChange={(e) =>
              setPointFilter(e.target.value as "all" | "has_points" | "clean")
            }
            className="h-10 w-full bg-slate-50 dark:bg-slate-800/60 px-3 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs text-[#0a192f] dark:text-slate-100 focus:outline-hidden focus:border-[#f97316]"
          >
            <option value="all">Semua Kedisiplinan</option>
            <option value="has_points">Memiliki Poin Sanksi (&gt; 0)</option>
            <option value="clean">Bersih (0 Poin)</option>
          </select>
        </div>
      </div>

      {/* Member Table */}
      {filteredMembers.length === 0 ? (
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 text-center rounded-xl shadow-xs">
          <HugeiconsIcon
            icon={UserGroupIcon}
            size={42}
            className="mx-auto text-slate-400 dark:text-slate-600 mb-3"
          />
          <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Tidak ada data anggota ditemukan.
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
                    <h4 className="font-display font-medium text-sm text-[#0a192f] dark:text-slate-100 truncate">
                      {m.fullName}
                    </h4>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 block">
                      NIM: {m.nim} · {m.studyProgramName}
                    </span>
                  </div>
                  {m.totalPoints > 0 ? (
                    <Badge className="bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 font-mono text-[10px] font-bold rounded-full px-2.5 py-0.5">
                      +{m.totalPoints} PTS
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 font-mono text-[10px] font-semibold rounded-full px-2.5 py-0.5">
                      CLEAN
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-5 gap-1 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 text-center font-mono text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 block">
                      HADIR
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {m.totals.hadir}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 block">
                      TELAT
                    </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {m.totals.telat}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 block">
                      IZIN
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {m.totals.izin}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 block">
                      SAKIT
                    </span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                      {m.totals.sakit}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 block">
                      ALFA
                    </span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      {m.totals.alfa}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Matrix Table View */}
          <div className="hidden lg:block overflow-x-auto border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="p-4 w-12 text-center font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    #
                  </th>
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Anggota
                  </th>
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Prodi / Jurusan
                  </th>
                  <th className="p-4 text-center font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Rekap Status
                  </th>
                  <th className="p-4 text-center font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Agenda Status Matrix
                  </th>
                  <th className="p-4 text-center font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Poin Sanksi
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
                          <div className="font-display font-medium text-[#0a192f] dark:text-slate-100 text-sm">
                            {m.fullName}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
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

                    <td className="p-4 align-middle text-center">
                      <div className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {m.totals.hadir}H
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">
                          |
                        </span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          {m.totals.telat}T
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">
                          |
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">
                          {m.totals.izin + m.totals.sakit}I
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">
                          |
                        </span>
                        <span className="text-red-600 dark:text-red-400 font-bold">
                          {m.totals.alfa}A
                        </span>
                      </div>
                    </td>

                    <td className="p-4 align-middle text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-[200px] mx-auto">
                        {activities.map((act) => (
                          <div key={act.id} title={act.title}>
                            {getAttendancePill(m.attendances[act.id] ?? null)}
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="p-4 align-middle text-center">
                      {m.totalPoints > 0 ? (
                        <Badge className="bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 font-mono text-[11px] font-bold rounded-full px-3 py-0.5 inline-flex items-center gap-1">
                          <HugeiconsIcon icon={AlertCircleIcon} size={12} />+
                          {m.totalPoints} PTS
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 font-mono text-[11px] font-semibold rounded-full px-3 py-0.5 inline-flex items-center gap-1">
                          <HugeiconsIcon
                            icon={CheckmarkCircle01Icon}
                            size={12}
                          />
                          0 PTS
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
