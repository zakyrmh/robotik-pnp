"use client";

import { useState, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface HistoryItem {
  id: string;
  check_in_at: string;
  status: "hadir" | "telat" | "izin" | "sakit" | "alfa" | "magang";
  notes: string | null;
  proof_url: string | null;
  activity_id: string | null;
  activity_title: string;
  activity_start_date: string;
  activity_location: string;
}

interface PersonalAttendanceTabProps {
  initialHistory: HistoryItem[];
}

export function PersonalAttendanceTab({
  initialHistory,
}: PersonalAttendanceTabProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Summary statistics calculation
  const stats = useMemo(() => {
    let hadir = 0;
    let telat = 0;
    let izinSakit = 0;
    let magang = 0;
    let alfa = 0;

    initialHistory.forEach((item) => {
      if (item.status === "hadir") hadir++;
      else if (item.status === "telat") telat++;
      else if (item.status === "izin" || item.status === "sakit") izinSakit++;
      else if (item.status === "magang") magang++;
      else if (item.status === "alfa") alfa++;
    });

    return {
      total: initialHistory.length,
      hadir,
      telat,
      izinSakit,
      magang,
      alfa,
    };
  }, [initialHistory]);

  // Filtered history items
  const filteredHistory = useMemo(() => {
    return initialHistory.filter((item) => {
      const searchLower = search.toLowerCase();
      const matchSearch =
        item.activity_title.toLowerCase().includes(searchLower) ||
        item.activity_location.toLowerCase().includes(searchLower) ||
        (item.notes && item.notes.toLowerCase().includes(searchLower));

      let matchStatus = true;
      if (statusFilter !== "all") {
        if (statusFilter === "izin_sakit") {
          matchStatus = item.status === "izin" || item.status === "sakit";
        } else {
          matchStatus = item.status === statusFilter;
        }
      }

      return matchSearch && matchStatus;
    });
  }, [initialHistory, search, statusFilter]);

  const formatIndoDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatIndoTime = (dateStr: string) => {
    if (!dateStr) return "-";
    return (
      new Date(dateStr).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    );
  };

  const getStatusBadge = (status: HistoryItem["status"]) => {
    switch (status) {
      case "hadir":
        return (
          <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 font-mono text-[11px] font-semibold rounded-full px-3 py-0.5 uppercase">
            HADIR
          </Badge>
        );
      case "telat":
        return (
          <Badge className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 font-mono text-[11px] font-semibold rounded-full px-3 py-0.5 uppercase">
            TELAT
          </Badge>
        );
      case "izin":
        return (
          <Badge className="bg-blue-50 dark:bg-blue-950/60 text-[#1e3a8a] dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 font-mono text-[11px] font-semibold rounded-full px-3 py-0.5 uppercase">
            IZIN
          </Badge>
        );
      case "sakit":
        return (
          <Badge className="bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900/60 font-mono text-[11px] font-semibold rounded-full px-3 py-0.5 uppercase">
            SAKIT
          </Badge>
        );
      case "magang":
        return (
          <Badge className="bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60 font-mono text-[11px] font-semibold rounded-full px-3 py-0.5 uppercase">
            MAGANG
          </Badge>
        );
      case "alfa":
        return (
          <Badge className="bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 font-mono text-[11px] font-semibold rounded-full px-3 py-0.5 uppercase">
            ALFA
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-semibold rounded-full px-3 py-0.5 uppercase">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 rounded-xl text-center border-l-4 border-l-[#1e3a8a] dark:border-l-blue-500 shadow-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
            HADIR
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.hadir}
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 rounded-xl text-center border-l-4 border-l-amber-500 shadow-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
            TELAT
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
            {stats.telat}
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 rounded-xl text-center border-l-4 border-l-blue-500 shadow-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
            IZIN / SAKIT
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-[#1e3a8a] dark:text-blue-400">
            {stats.izinSakit}
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 rounded-xl text-center border-l-4 border-l-purple-500 shadow-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
            MAGANG
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.magang}
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 rounded-xl text-center border-l-4 border-l-red-500 shadow-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
            ALFA
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.alfa}
          </span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl shadow-xs">
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <Input
            placeholder="Cari Nama Kegiatan / Lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full bg-slate-50 dark:bg-slate-800/60 pl-10 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs text-[#0a192f] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-[#f97316]/20 focus-visible:border-[#f97316]"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 w-full bg-slate-50 dark:bg-slate-800/60 px-3 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs text-[#0a192f] dark:text-slate-100 focus:outline-hidden focus:border-[#f97316]"
          >
            <option value="all">Semua Status</option>
            <option value="hadir">Hadir</option>
            <option value="telat">Telat</option>
            <option value="izin_sakit">Izin / Sakit</option>
            <option value="magang">Magang / PKL</option>
            <option value="alfa">Alfa</option>
          </select>
        </div>
      </div>

      {/* Main List */}
      {filteredHistory.length === 0 ? (
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 text-center rounded-xl shadow-xs">
          <HugeiconsIcon
            icon={Calendar03Icon}
            size={42}
            className="mx-auto text-slate-400 dark:text-slate-600 mb-3"
          />
          <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Belum ada riwayat presensi tercatat.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="block md:hidden space-y-3">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-xl space-y-2.5 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                      NAMA KEGIATAN
                    </span>
                    <span className="text-sm font-display font-medium text-[#0a192f] dark:text-slate-100 block">
                      {item.activity_title}
                    </span>
                  </div>
                  <div className="shrink-0">{getStatusBadge(item.status)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                      WAKTU CHECK-IN
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {formatIndoDate(item.check_in_at)}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {formatIndoTime(item.check_in_at)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                      LOKASI
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 text-xs">
                      {item.activity_location}
                    </span>
                  </div>
                </div>

                {item.notes && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                      KETERANGAN / CATATAN
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-body mt-0.5">
                      {item.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Nama Kegiatan
                  </th>
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Waktu Check-In
                  </th>
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Lokasi
                  </th>
                  <th className="p-4 w-28 font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Status
                  </th>
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Keterangan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredHistory.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-4 align-middle font-display font-medium text-[#0a192f] dark:text-slate-100 text-sm">
                      {item.activity_title}
                    </td>

                    <td className="p-4 align-middle">
                      <div className="text-[#0a192f] dark:text-slate-200 text-xs font-medium">
                        {formatIndoDate(item.check_in_at)}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatIndoTime(item.check_in_at)}
                      </div>
                    </td>

                    <td className="p-4 align-middle text-xs text-slate-700 dark:text-slate-300">
                      {item.activity_location}
                    </td>

                    <td className="p-4 align-middle">
                      {getStatusBadge(item.status)}
                    </td>

                    <td className="p-4 align-middle text-xs text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                      {item.notes || "-"}
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
