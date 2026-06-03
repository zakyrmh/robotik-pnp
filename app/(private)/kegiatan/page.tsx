"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Search01Icon,
  EyeIcon,
} from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface Activity {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  banner_url: string | null;
  target_audience: "caang" | "anggota";
  created_at: string;
}

export default function KegiatanPage() {
  const supabase = createClient();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to check if attendance window is active (2 hours before start until 2 hours after end)
  const isAttendanceWindowActive = (activity: Activity | null) => {
    if (!activity) return false;
    const now = new Date();
    const startWindow = new Date(new Date(activity.start_date).getTime() - 2 * 60 * 60 * 1000);
    const endWindow = new Date(new Date(activity.end_date).getTime() + 2 * 60 * 60 * 1000);
    return now >= startWindow && now <= endWindow;
  };

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "upcoming" | "ongoing" | "completed">("all");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchActivities = async () => {
      setLoadingData(true);
      setError(null);
      try {
        // Tentukan target_audience berdasarkan role user
        // Caang hanya melihat kegiatan caang, lainnya melihat kegiatan anggota
        const audience = user.role === "caang" ? "caang" : "anggota";

        const { data, error: queryError } = await supabase
          .from("activities")
          .select("*")
          .eq("target_audience", audience)
          .order("start_date", { ascending: true });

        if (queryError) throw queryError;
        setActivities(data || []);
      } catch (err) {
        console.error("Gagal mengambil data kegiatan:", err);
        setError("Gagal memuat daftar kegiatan. Silakan coba beberapa saat lagi.");
      } finally {
        setLoadingData(false);
      }
    };

    fetchActivities();
  }, [user, authLoading, supabase]);

  // Dynamic telemetry calculations
  const stats = useMemo<{
    total: number;
    upcoming: number;
    ongoing: number;
    completed: number;
    next: Activity | null;
    uniqueLocations: number;
  }>(() => {
    const now = new Date();
    let upcoming = 0;
    let ongoing = 0;
    let completed = 0;
    let next: Activity | null = null;
    const locations = new Set<string>();

    activities.forEach((item) => {
      const start = new Date(item.start_date);
      const end = new Date(item.end_date);

      if (now < start) {
        upcoming++;
        if (!next || new Date(item.start_date) < new Date(next.start_date)) {
          next = item;
        }
      } else if (now >= start && now <= end) {
        ongoing++;
      } else {
        completed++;
      }

      if (item.location) {
        locations.add(item.location.trim());
      }
    });

    return {
      total: activities.length,
      upcoming,
      ongoing,
      completed,
      next,
      uniqueLocations: locations.size,
    };
  }, [activities]);

  // Filtered activities list
  const filteredActivities = useMemo(() => {
    const now = new Date();
    return activities.filter((item) => {
      // 1. Search Filter
      const searchLower = search.toLowerCase();
      const matchSearch =
        item.title.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        (item.location && item.location.toLowerCase().includes(searchLower));

      // 2. Status Filter
      let matchStatus = true;
      if (selectedStatus !== "all") {
        const start = new Date(item.start_date);
        const end = new Date(item.end_date);
        if (selectedStatus === "upcoming") {
          matchStatus = now < start;
        } else if (selectedStatus === "ongoing") {
          matchStatus = now >= start && now <= end;
        } else if (selectedStatus === "completed") {
          matchStatus = now > end;
        }
      }

      return matchSearch && matchStatus;
    });
  }, [activities, search, selectedStatus]);

  // Helpers for time formatting
  const formatIndoDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatIndoTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB";
  };

  const formatTimeRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    const startTime = start.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const endTime = end.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    
    if (start.toDateString() === end.toDateString()) {
      return `${startTime} - ${endTime} WIB`;
    }
    
    return `${startTime} (Mulai) s/d ${endTime} (Selesai) WIB`;
  };

  // Helper status badge color
  const getStatusBadge = (activity: Activity) => {
    const now = new Date();
    const start = new Date(activity.start_date);
    const end = new Date(activity.end_date);

    if (now < start) {
      return (
        <Badge className="bg-[#1c69d4]/15 text-[#1c69d4] border border-[#1c69d4]/30 font-mono text-[9px] rounded-none px-2 uppercase py-0.5">
          MENDATANG
        </Badge>
      );
    } else if (now >= start && now <= end) {
      return (
        <Badge className="bg-[#0066b1]/15 text-[#0066b1] border border-[#0066b1]/30 font-mono text-[9px] rounded-none px-2 uppercase py-0.5 animate-pulse">
          ONGOING
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-zinc-500/15 text-zinc-400 border border-zinc-500/30 font-mono text-[9px] rounded-none px-2 uppercase py-0.5">
          SELESAI
        </Badge>
      );
    }
  };

  const isLoading = authLoading || loadingData;

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-1 lg:px-4">
      {/* Header Banner */}
      <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 rounded-none shadow-sm overflow-hidden">
        {/* Tricolor Tech Stripe at Top */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-50 font-sans flex items-center gap-2">
              <HugeiconsIcon icon={Calendar03Icon} size={22} className="text-[#1c69d4] dark:text-[#0066b1]" />
              Kegiatan UKM Robotik
            </h1>
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-500 mt-1">
              Agenda Pelatihan, Rapat, dan Workshop Teknologi Robotik PNP
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className="bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-none font-mono text-[10px] uppercase tracking-wider">
              TOTAL KEGIATAN: {activities.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Status Telemetry */}
        <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 rounded-none overflow-hidden flex flex-col justify-between min-h-[160px]">
          {/* Cyber Blue Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#0066b1]" />
          <div>
            <h3 className="font-mono text-[10px] font-medium uppercase tracking-widest text-zinc-500 flex items-center justify-between">
              <span>ACTIVITY TELEMETRY</span>
              <span className="text-[9px] bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded-none font-bold">TOTAL: {stats.total}</span>
            </h3>
            
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="space-y-1">
                <span className="font-mono text-[8px] uppercase tracking-wider text-zinc-400 block">ONGOING</span>
                <span className="font-sans text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {stats.ongoing}
                </span>
              </div>
              <div className="space-y-1 border-x border-zinc-100 dark:border-zinc-900">
                <span className="font-mono text-[8px] uppercase tracking-wider text-zinc-400 block">UPCOMING</span>
                <span className="font-sans text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {stats.upcoming}
                </span>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[8px] uppercase tracking-wider text-zinc-400 block">COMPLETED</span>
                <span className="font-sans text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {stats.completed}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-900 rounded-none overflow-hidden flex">
              {stats.ongoing > 0 && (
                <div 
                  className="h-full bg-[#0066b1]" 
                  style={{ width: `${stats.total > 0 ? (stats.ongoing / stats.total) * 100 : 0}%` }}
                />
              )}
              {stats.upcoming > 0 && (
                <div 
                  className="h-full bg-[#1c69d4]" 
                  style={{ width: `${stats.total > 0 ? (stats.upcoming / stats.total) * 100 : 0}%` }}
                />
              )}
              {stats.completed > 0 && (
                <div 
                  className="h-full bg-zinc-400 dark:bg-zinc-650" 
                  style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                />
              )}
            </div>
            <div className="flex justify-between text-[8px] font-mono text-zinc-400 uppercase">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#0066b1]" /> ONGOING</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#1c69d4]" /> UPCOMING</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-650" /> DONE</span>
            </div>
          </div>
        </div>

        {/* Card 2: Next Event Tracker */}
        <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 rounded-none overflow-hidden flex flex-col justify-between min-h-[160px]">
          {/* Tech Navy Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#1c69d4]" />
          <div>
            <h3 className="font-mono text-[10px] font-medium uppercase tracking-widest text-zinc-500 mb-3">
              NEXT UPCOMING ACTIVITY
            </h3>
            
            {stats.next ? (
              <div className="space-y-1.5">
                <span className="font-sans text-sm font-bold text-zinc-900 dark:text-zinc-100 block line-clamp-1 uppercase">
                  {stats.next.title}
                </span>
                <span className="font-mono text-[10px] text-zinc-500 block">
                  {formatIndoDate(stats.next.start_date)}
                </span>
                <span className="font-mono text-[9px] text-[#1c69d4] dark:text-[#0066b1] block uppercase tracking-wide">
                  LOKASI: {stats.next.location || "TBA"}
                </span>
              </div>
            ) : (
              <p className="text-[10px] font-mono text-zinc-400 uppercase py-2">
                Tidak ada kegiatan mendatang
              </p>
            )}
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900 text-[8px] font-mono text-zinc-400 uppercase tracking-widest">
            UPCOMING EVENT TIMER ACTIVE
          </div>
        </div>

        {/* Card 3: System Access Level & Locations */}
        <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 rounded-none overflow-hidden flex flex-col justify-between min-h-[160px]">
          {/* Crimson Red Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#e22718]" />
          <div>
            <h3 className="font-mono text-[10px] font-medium uppercase tracking-widest text-zinc-500 mb-3">
              SYSTEM & ACCESS TELEMETRY
            </h3>
            
            <div className="space-y-2 text-[10px] font-mono">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-1">
                <span className="text-zinc-500">ROLE LEVEL:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase">{user?.role || "GUEST"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-1">
                <span className="text-zinc-500">TARGET AUDIENCE:</span>
                <span className="font-bold text-[#1c69d4] dark:text-[#0066b1] uppercase">{user?.role === "caang" ? "KHUSUS CAANG" : "ANGGOTA"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">UNIQUE LOCATIONS:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{stats.uniqueLocations}</span>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900 text-[8px] font-mono text-zinc-400 uppercase tracking-widest flex justify-between">
            <span>SECURE SYSTEM</span>
            <span className="text-[#e22718]">ONLINE</span>
          </div>
        </div>
      </div>

      {/* Filter Controls Panel */}
      <div className="flex flex-col sm:flex-row gap-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 rounded-none">
        {/* Search */}
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400"
          />
          <Input
            placeholder="Cari Kegiatan / Lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full bg-zinc-50/50 dark:bg-zinc-900/30 pl-10 rounded-none border border-zinc-200 dark:border-zinc-800 font-mono text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-50 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
          />
        </div>

        {/* Filter Status */}
        <div className="w-full sm:w-48">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as "all" | "upcoming" | "ongoing" | "completed")}
            className="h-9 w-full bg-zinc-50/50 dark:bg-zinc-900/30 px-3 rounded-none border border-zinc-200 dark:border-zinc-800 font-mono text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-50 focus:outline-hidden focus:border-zinc-400 dark:focus:border-zinc-600"
          >
            <option value="all">Semua Status</option>
            <option value="upcoming">Mendatang</option>
            <option value="ongoing">Sedang Berlangsung</option>
            <option value="completed">Selesai</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        // Skeleton Loader Grid
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-12 text-center rounded-none animate-pulse space-y-4">
          <div className="h-6 bg-zinc-100 dark:bg-zinc-900 w-1/4 mx-auto rounded-none"></div>
          <div className="h-4 bg-zinc-150 dark:bg-zinc-900 w-1/2 mx-auto rounded-none"></div>
          <div className="space-y-2 pt-6">
            <div className="h-10 bg-zinc-50 dark:bg-zinc-900/50 w-full rounded-none"></div>
            <div className="h-10 bg-zinc-50 dark:bg-zinc-900/50 w-full rounded-none"></div>
            <div className="h-10 bg-zinc-50 dark:bg-zinc-900/50 w-full rounded-none"></div>
          </div>
        </div>
      ) : error ? (
        // Error Message State
        <div className="flex flex-col items-center justify-center py-16 text-center border border-[#e22718]/25 rounded-none bg-red-500/5 p-8 max-w-xl mx-auto">
          <div className="w-10 h-10 rounded-none bg-[#e22718]/10 flex items-center justify-center text-[#e22718] mb-4 border border-[#e22718]/20 font-bold font-mono">
            !
          </div>
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-800 dark:text-zinc-200">{error}</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        // Empty State
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-12 text-center rounded-none">
          <HugeiconsIcon icon={Calendar03Icon} size={40} className="mx-auto text-zinc-400 dark:text-zinc-600 mb-3" />
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
            Tidak ada agenda kegiatan ditemukan.
          </p>
        </div>
      ) : (
        <>
          {/* =======================================================
              DESKTOP VIEW: HTML table
              ======================================================= */}
          <div className="hidden md:block overflow-x-auto border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-none">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
                  {/* Banner/Miniatur Header */}
                  <th className="p-4 w-24 text-center font-mono text-[10px] uppercase tracking-wider font-bold text-zinc-600 dark:text-zinc-400">
                    Banner
                  </th>
                  {/* Nama Kegiatan Header */}
                  <th className="p-4 font-mono text-[10px] uppercase tracking-wider font-bold text-zinc-600 dark:text-zinc-400">
                    Nama Kegiatan
                  </th>
                  {/* Waktu & Tanggal Header */}
                  <th className="p-4 font-mono text-[10px] uppercase tracking-wider font-bold text-zinc-600 dark:text-zinc-400">
                    Tanggal & Waktu
                  </th>
                  {/* Lokasi Header */}
                  <th className="p-4 font-mono text-[10px] uppercase tracking-wider font-bold text-zinc-600 dark:text-zinc-400">
                    Lokasi
                  </th>
                  {/* Status Header */}
                  <th className="p-4 w-28 font-mono text-[10px] uppercase tracking-wider font-bold text-zinc-600 dark:text-zinc-400">
                    Status
                  </th>
                  {/* Aksi Header */}
                  <th className="p-4 w-32 text-center font-mono text-[10px] uppercase tracking-wider font-bold text-zinc-600 dark:text-zinc-400">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredActivities.map((activity) => (
                  <tr
                    key={activity.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors"
                  >
                    {/* Thumbnail Cell */}
                    <td className="p-4 align-middle text-center">
                      <div className="relative h-10 w-16 mx-auto rounded-none border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-hidden flex items-center justify-center">
                        {activity.banner_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={activity.banner_url}
                            alt={activity.title}
                            className="object-cover h-full w-full"
                          />
                        ) : (
                          <HugeiconsIcon
                            icon={Calendar03Icon}
                            size={16}
                            className="text-zinc-400 dark:text-zinc-500"
                          />
                        )}
                      </div>
                    </td>

                    {/* Name Cell */}
                    <td className="p-4 align-middle">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[280px]" title={activity.title}>
                        {activity.title}
                      </div>
                      <div className="font-mono text-[9px] text-zinc-500 mt-0.5 tracking-widest uppercase">
                        AUDIENCE: {activity.target_audience}
                      </div>
                    </td>

                    {/* DateTime Cell */}
                    <td className="p-4 align-middle">
                      <div className="text-zinc-800 dark:text-zinc-300 text-xs font-medium">
                        {formatIndoDate(activity.start_date)}
                      </div>
                      <div className="font-mono text-[10px] text-zinc-500 mt-0.5">
                        {formatTimeRange(activity.start_date, activity.end_date)}
                      </div>
                    </td>

                    {/* Location Cell */}
                    <td className="p-4 align-middle">
                      <div className="text-zinc-800 dark:text-zinc-300 text-xs truncate max-w-[220px]" title={activity.location || "TBA"}>
                        {activity.location || "TBA"}
                      </div>
                    </td>

                    {/* Status Cell */}
                    <td className="p-4 align-middle">
                      {getStatusBadge(activity)}
                    </td>

                    {/* Actions Cell */}
                    <td className="p-4 align-middle text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedActivity(activity)}
                          className="rounded-none border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-900 h-8 px-3 font-mono text-[10px] uppercase tracking-wider"
                        >
                          <HugeiconsIcon icon={EyeIcon} size={14} className="mr-1.5" />
                          Detail
                        </Button>
                        {isAttendanceWindowActive(activity) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/kegiatan/${activity.id}/absensi`)}
                            className="rounded-none border border-[#1c69d4]/30 dark:border-[#0066b1]/30 text-[#1c69d4] dark:text-[#0066b1] hover:bg-zinc-100 dark:hover:bg-zinc-900 h-8 px-3 font-mono text-[10px] uppercase tracking-wider"
                          >
                            Ambil Absen
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* =======================================================
              MOBILE VIEW: Card layout
              ======================================================= */}
          <div className="block md:hidden space-y-4">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 rounded-none space-y-3 relative shadow-xs"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-16 rounded-none border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-hidden flex items-center justify-center shrink-0">
                      {activity.banner_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={activity.banner_url}
                          alt={activity.title}
                          className="object-cover h-full w-full"
                        />
                      ) : (
                        <HugeiconsIcon icon={Calendar03Icon} size={16} className="text-zinc-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">NAMA KEGIATAN</span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate block max-w-[170px]">{activity.title}</span>
                    </div>
                  </div>
                  {getStatusBadge(activity)}
                </div>

                {/* Card Details */}
                <div className="space-y-2 pt-1 font-sans border-t border-zinc-100 dark:border-zinc-900">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">TANGGAL</span>
                      <span className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold">{formatIndoDate(activity.start_date)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">WAKTU</span>
                      <span className="text-xs text-zinc-700 dark:text-zinc-300 font-mono">{formatIndoTime(activity.start_date)}</span>
                    </div>
                  </div>
                  <div className="border-t border-zinc-100 dark:border-zinc-900 pt-2">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">LOKASI</span>
                    <span className="text-xs text-zinc-700 dark:text-zinc-300">{activity.location || "TBA"}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-900 pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedActivity(activity)}
                    className={`rounded-none border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono text-[10px] uppercase tracking-wider px-3 h-8 hover:bg-zinc-100 dark:hover:bg-zinc-900 ${isAttendanceWindowActive(activity) ? "w-1/2" : "w-full"}`}
                  >
                    <HugeiconsIcon icon={EyeIcon} size={14} className="mr-1.5" />
                    Detail
                  </Button>
                  {isAttendanceWindowActive(activity) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/kegiatan/${activity.id}/absensi`)}
                      className="rounded-none border border-[#1c69d4]/30 dark:border-[#0066b1]/30 text-[#1c69d4] dark:text-[#0066b1] font-mono text-[10px] uppercase tracking-wider px-3 h-8 hover:bg-zinc-100 dark:hover:bg-zinc-900 w-1/2"
                    >
                      Ambil Absen
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* =======================================================
          MODAL: VIEW ACTIVITY DETAIL (SHADCN DIALOG)
          ======================================================= */}
      <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        <DialogContent className="rounded-none max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-y-auto max-h-[90vh] p-0 font-sans">
          {selectedActivity && (
            <>
              {/* Detail Banner Section */}
              <div className="relative h-64 w-full bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                {/* Tricolor Tech Stripe at Top of Modal */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718] z-20" />
                
                {selectedActivity.banner_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedActivity.banner_url}
                    alt={selectedActivity.title}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-[#0066b1]/10 via-[#1c69d4]/5 to-transparent flex items-center justify-center">
                    <HugeiconsIcon icon={Calendar03Icon} size={64} className="text-zinc-400 dark:text-zinc-500" />
                  </div>
                )}
                
                {/* Floating Badges */}
                <div className="absolute bottom-4 left-4 z-10 flex gap-2">
                  {getStatusBadge(selectedActivity)}
                  <Badge className="bg-zinc-900/60 dark:bg-zinc-950/60 text-white border border-zinc-700 font-mono text-[9px] rounded-none px-2 uppercase py-0.5 backdrop-blur-xs">
                    AUDIENCE: {selectedActivity.target_audience === "caang" ? "CAANG" : "ANGGOTA"}
                  </Badge>
                </div>
              </div>

              {/* Detail Info Body */}
              <div className="p-6 space-y-6">
                <DialogHeader className="border-b border-zinc-200 dark:border-zinc-800 pb-3 relative">
                  <DialogTitle className="font-sans text-base font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-50 leading-tight">
                    {selectedActivity.title}
                  </DialogTitle>
                  <DialogDescription className="font-mono text-[10px] uppercase text-zinc-500 tracking-wider">
                    Informasi Lengkap & Rencana Pelaksanaan Kegiatan
                  </DialogDescription>
                </DialogHeader>

                {/* Section: Waktu & Lokasi */}
                <div className="space-y-2">
                  <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Jadwal & Lokasi Pelaksanaan
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900/30 p-3 border border-zinc-150 dark:border-zinc-900">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-mono">Hari & Tanggal</span>
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{formatIndoDate(selectedActivity.start_date)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-mono">Durasi Waktu</span>
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 font-mono">{formatTimeRange(selectedActivity.start_date, selectedActivity.end_date)}</span>
                    </div>
                    <div className="sm:col-span-2 border-t border-zinc-200/50 dark:border-zinc-800/50 pt-2 mt-1">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-mono">Lokasi</span>
                      <span className="text-xs font-semibold text-[#1c69d4] dark:text-[#0066b1]">{selectedActivity.location || "TBA (To Be Announced)"}</span>
                    </div>
                  </div>
                </div>

                {/* Section: Deskripsi */}
                <div className="space-y-3">
                  <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Deskripsi Kegiatan
                  </h4>
                  <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3.5 border border-zinc-150 dark:border-zinc-900">
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                      {selectedActivity.description || "Tidak ada deskripsi detail untuk kegiatan ini."}
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="border-t border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-900/10 flex flex-row justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedActivity(null)}
                  className="rounded-none border border-zinc-200 dark:border-zinc-800 font-mono text-xs uppercase tracking-wider h-10 px-4"
                >
                  Tutup
                </Button>
                {isAttendanceWindowActive(selectedActivity) && (
                  <Button
                    onClick={() => {
                      setSelectedActivity(null);
                      router.push(`/kegiatan/${selectedActivity.id}/absensi`);
                    }}
                    className="rounded-none bg-[#1c69d4] hover:bg-[#1059b0] text-white font-mono text-xs uppercase tracking-wider h-10 px-4"
                  >
                    Ambil Absen
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
