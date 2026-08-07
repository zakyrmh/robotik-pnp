"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Search01Icon,
  QrCodeIcon,
  EyeIcon,
  Location01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { KomdisActivitySummaryItem } from "@/lib/actions/komdis";

interface KomdisActivityAttendanceTabProps {
  activities: KomdisActivitySummaryItem[];
}

export function KomdisActivityAttendanceTab({
  activities,
}: KomdisActivityAttendanceTabProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "ongoing" | "upcoming" | "completed"
  >("all");

  // Telemetry Calculations
  const stats = useMemo(() => {
    const now = new Date();
    let ongoing = 0;
    let upcoming = 0;
    let completed = 0;
    let totalRateSum = 0;

    activities.forEach((act) => {
      const start = new Date(act.startDate);
      const end = new Date(act.endDate);

      if (now < start) upcoming++;
      else if (now >= start && now <= end) ongoing++;
      else completed++;

      totalRateSum += act.attendanceRate;
    });

    const avgRate =
      activities.length > 0 ? Math.round(totalRateSum / activities.length) : 0;

    return {
      total: activities.length,
      ongoing,
      upcoming,
      completed,
      avgRate,
    };
  }, [activities]);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    const now = new Date();
    return activities.filter((act) => {
      const query = search.toLowerCase();
      const matchSearch =
        act.title.toLowerCase().includes(query) ||
        (act.location && act.location.toLowerCase().includes(query)) ||
        (act.description && act.description.toLowerCase().includes(query));

      let matchStatus = true;
      if (statusFilter !== "all") {
        const start = new Date(act.startDate);
        const end = new Date(act.endDate);
        if (statusFilter === "upcoming") matchStatus = now < start;
        else if (statusFilter === "ongoing")
          matchStatus = now >= start && now <= end;
        else if (statusFilter === "completed") matchStatus = now > end;
      }

      return matchSearch && matchStatus;
    });
  }, [activities, search, statusFilter]);

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

    if (start.toDateString() === end.toDateString()) {
      return `${startTime} - ${endTime} WIB`;
    }
    return `${startTime} s/d ${endTime} WIB`;
  };

  const getStatusBadge = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return (
        <Badge className="bg-blue-50 dark:bg-blue-950/60 text-[#1e3a8a] dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 font-mono text-[11px] font-semibold rounded-full px-3 py-0.5 uppercase">
          MENDATANG
        </Badge>
      );
    } else if (now >= start && now <= end) {
      return (
        <Badge className="bg-orange-100 dark:bg-orange-950/60 text-[#c2410c] dark:text-orange-300 border border-orange-200 dark:border-orange-900/60 font-mono text-[11px] font-semibold rounded-full px-3 py-0.5 uppercase animate-pulse">
          ONGOING
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-semibold rounded-full px-3 py-0.5 uppercase">
          SELESAI
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 rounded-xl text-center border-l-4 border-l-[#1e3a8a] dark:border-l-blue-500 shadow-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
            TOTAL AGENDA
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-[#0a192f] dark:text-slate-100">
            {stats.total}
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 rounded-xl text-center border-l-4 border-l-[#f97316] shadow-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
            BERLANGSUNG
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-[#f97316]">
            {stats.ongoing}
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 rounded-xl text-center border-l-4 border-l-emerald-500 shadow-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
            SELESAI
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.completed}
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 rounded-xl text-center border-l-4 border-l-blue-500 shadow-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
            RATA-RATA PRESENSI
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-[#1e3a8a] dark:text-blue-400">
            {stats.avgRate}%
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
            placeholder="Cari Nama Agenda Komdis / Lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full bg-slate-50 dark:bg-slate-800/60 pl-10 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs text-[#0a192f] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-[#f97316]/20 focus-visible:border-[#f97316]"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as "all" | "ongoing" | "upcoming" | "completed",
              )
            }
            className="h-10 w-full bg-slate-50 dark:bg-slate-800/60 px-3 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs text-[#0a192f] dark:text-slate-100 focus:outline-hidden focus:border-[#f97316]"
          >
            <option value="all">Semua Status</option>
            <option value="ongoing">Sedang Berlangsung</option>
            <option value="upcoming">Mendatang</option>
            <option value="completed">Selesai</option>
          </select>
        </div>
      </div>

      {/* Activities Summary List */}
      {filteredActivities.length === 0 ? (
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 text-center rounded-xl shadow-xs">
          <HugeiconsIcon
            icon={Calendar03Icon}
            size={42}
            className="mx-auto text-slate-400 dark:text-slate-600 mb-3"
          />
          <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Tidak ada kegiatan Komdis ditemukan.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="block md:hidden space-y-3">
            {filteredActivities.map((act) => (
              <div
                key={act.id}
                className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-xl space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                      NAMA AGENDA
                    </span>
                    <span className="text-sm font-display font-medium text-[#0a192f] dark:text-slate-100 block">
                      {act.title}
                    </span>
                  </div>
                  <div className="shrink-0">
                    {getStatusBadge(act.startDate, act.endDate)}
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon
                      icon={Clock01Icon}
                      size={13}
                      className="text-slate-400 shrink-0"
                    />
                    <span>
                      {formatIndoDate(act.startDate)} (
                      {formatTimeRange(act.startDate, act.endDate)})
                    </span>
                  </div>
                  {act.location && (
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon
                        icon={Location01Icon}
                        size={13}
                        className="text-slate-400 shrink-0"
                      />
                      <span>{act.location}</span>
                    </div>
                  )}
                </div>

                {/* Attendance Progress & Telemetry */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-500">RASIO HADIR:</span>
                    <span className="font-bold text-[#1e3a8a] dark:text-blue-400">
                      {act.counts.hadir + act.counts.telat} /{" "}
                      {act.totalExpected} ({act.attendanceRate}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500"
                      style={{
                        width: `${act.totalExpected > 0 ? (act.counts.hadir / act.totalExpected) * 100 : 0}%`,
                      }}
                    />
                    <div
                      className="h-full bg-amber-500"
                      style={{
                        width: `${act.totalExpected > 0 ? (act.counts.telat / act.totalExpected) * 100 : 0}%`,
                      }}
                    />
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${act.totalExpected > 0 ? ((act.counts.izin + act.counts.sakit) / act.totalExpected) * 100 : 0}%`,
                      }}
                    />
                    <div
                      className="h-full bg-red-500"
                      style={{
                        width: `${act.totalExpected > 0 ? (act.counts.alfa / act.totalExpected) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/kegiatan/${act.id}/presensi`)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 text-[#0a192f] dark:text-slate-200 h-9 font-mono text-[11px] uppercase tracking-wider px-3"
                  >
                    <HugeiconsIcon icon={EyeIcon} size={14} className="mr-1" />
                    Detail Agenda
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/kegiatan/${act.id}/absensi`)}
                    className="rounded-lg bg-[#1e3a8a] dark:bg-blue-600 text-white hover:bg-[#1e40af] dark:hover:bg-blue-500 h-9 font-mono text-[11px] uppercase tracking-wider px-3"
                  >
                    <HugeiconsIcon
                      icon={QrCodeIcon}
                      size={14}
                      className="mr-1"
                    />
                    Presensi QR
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Agenda Kegiatan Komdis
                  </th>
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Waktu &amp; Lokasi
                  </th>
                  <th className="p-4 w-56 text-center font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Rasio Kehadiran (%)
                  </th>
                  <th className="p-4 text-center font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Breakdown Status
                  </th>
                  <th className="p-4 w-32 font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 text-center">
                    Status
                  </th>
                  <th className="p-4 w-36 text-center font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredActivities.map((act) => (
                  <tr
                    key={act.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-4 align-middle">
                      <div className="font-display font-medium text-[#0a192f] dark:text-slate-100 text-sm">
                        {act.title}
                      </div>
                      {act.description && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 max-w-[220px]">
                          {act.description}
                        </div>
                      )}
                    </td>

                    <td className="p-4 align-middle">
                      <div className="text-[#0a192f] dark:text-slate-200 text-xs font-medium">
                        {formatIndoDate(act.startDate)}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatTimeRange(act.startDate, act.endDate)}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        📍 {act.location || "TBA"}
                      </div>
                    </td>

                    <td className="p-4 align-middle text-center">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="font-bold text-[#1e3a8a] dark:text-blue-400">
                            {act.attendanceRate}%
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {act.counts.hadir + act.counts.telat} /{" "}
                            {act.totalExpected}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-emerald-500"
                            style={{
                              width: `${act.totalExpected > 0 ? (act.counts.hadir / act.totalExpected) * 100 : 0}%`,
                            }}
                          />
                          <div
                            className="h-full bg-amber-500"
                            style={{
                              width: `${act.totalExpected > 0 ? (act.counts.telat / act.totalExpected) * 100 : 0}%`,
                            }}
                          />
                          <div
                            className="h-full bg-blue-500"
                            style={{
                              width: `${act.totalExpected > 0 ? ((act.counts.izin + act.counts.sakit) / act.totalExpected) * 100 : 0}%`,
                            }}
                          />
                          <div
                            className="h-full bg-red-500"
                            style={{
                              width: `${act.totalExpected > 0 ? (act.counts.alfa / act.totalExpected) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="p-4 align-middle text-center">
                      <div className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span
                          className="text-emerald-600 dark:text-emerald-400 font-bold"
                          title="Hadir"
                        >
                          {act.counts.hadir}H
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">
                          |
                        </span>
                        <span
                          className="text-amber-600 dark:text-amber-400 font-bold"
                          title="Telat"
                        >
                          {act.counts.telat}T
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">
                          |
                        </span>
                        <span
                          className="text-blue-600 dark:text-blue-400 font-bold"
                          title="Izin/Sakit"
                        >
                          {act.counts.izin + act.counts.sakit}I
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">
                          |
                        </span>
                        <span
                          className="text-red-600 dark:text-red-400 font-bold"
                          title="Alfa"
                        >
                          {act.counts.alfa}A
                        </span>
                      </div>
                    </td>

                    <td className="p-4 align-middle text-center">
                      {getStatusBadge(act.startDate, act.endDate)}
                    </td>

                    <td className="p-4 align-middle text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(`/kegiatan/${act.id}/presensi`)
                          }
                          className="rounded-lg border border-slate-200 dark:border-slate-700 text-[#0a192f] dark:text-slate-200 h-8 px-2.5 font-mono text-[11px] uppercase tracking-wider"
                          title="Lihat Detail Agenda"
                        >
                          <HugeiconsIcon icon={EyeIcon} size={14} />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(`/kegiatan/${act.id}/absensi`)
                          }
                          className="rounded-lg bg-[#1e3a8a] dark:bg-blue-600 text-white hover:bg-[#1e40af] dark:hover:bg-blue-500 h-8 px-2.5 font-mono text-[11px] uppercase tracking-wider"
                          title="Scan Presensi QR"
                        >
                          <HugeiconsIcon icon={QrCodeIcon} size={14} />
                        </Button>
                      </div>
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
