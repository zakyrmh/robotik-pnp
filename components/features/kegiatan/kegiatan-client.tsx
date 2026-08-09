"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Search01Icon,
  EyeIcon,
  CalendarAdd01Icon,
  Edit02Icon,
  Delete01Icon,
  Loading03Icon,
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
import { CreateKomdisActivityDialog } from "@/components/features/komdis/create-komdis-activity-dialog";
import { EditKomdisActivityDialog } from "@/components/features/komdis/edit-komdis-activity-dialog";
import { softDeleteKomdisActivity } from "@/lib/actions/komdis";
import { softDeleteActivity } from "@/lib/actions/activities";
import { toast } from "sonner";
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

interface KegiatanClientProps {
  initialActivities?: Activity[];
  userRole?: string;
}

export function KegiatanClient({
  initialActivities = [],
  userRole,
}: KegiatanClientProps = {}) {
  const supabase = createClient();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const activeRole = userRole || user?.role;

  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [loadingData, setLoadingData] = useState(
    initialActivities.length === 0,
  );
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingKomdisActivity, setEditingKomdisActivity] =
    useState<Activity | null>(null);
  const [deletingKomdisActivity, setDeletingKomdisActivity] =
    useState<Activity | null>(null);
  const [isDeletingKomdis, setIsDeletingKomdis] = useState(false);

  const handleSoftDelete = async () => {
    if (!deletingKomdisActivity) return;
    setIsDeletingKomdis(true);
    try {
      if (deletingKomdisActivity.target_audience === "anggota") {
        await softDeleteKomdisActivity(deletingKomdisActivity.id);
      } else {
        await softDeleteActivity(deletingKomdisActivity.id);
      }
      toast.success("Kegiatan berhasil dipindahkan ke tempat sampah.");
      setDeletingKomdisActivity(null);
      fetchActivities();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setIsDeletingKomdis(false);
    }
  };
  // Helper to check if attendance window is active (2 hours before start until activity end_date)
  const isAttendanceWindowActive = (activity: Activity | null) => {
    if (!activity) return false;
    const now = new Date();
    const startWindow = new Date(
      new Date(activity.start_date).getTime() - 2 * 60 * 60 * 1000,
    );
    const endWindow = new Date(activity.end_date);
    return now >= startWindow && now <= endWindow;
  };

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "upcoming" | "ongoing" | "completed"
  >("all");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );

  const [refreshKey, setRefreshKey] = useState(0);
  const fetchActivities = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    let isMounted = true;

    async function loadData() {
      setError(null);
      try {
        const audience = user?.role === "caang" ? "caang" : "anggota";
        const { data, error: queryError } = await supabase
          .from("activities")
          .select("*")
          .eq("target_audience", audience)
          .is("deleted_at", null)
          .order("start_date", { ascending: true });
        if (queryError) throw queryError;
        if (isMounted) {
          setActivities(data || []);
          setLoadingData(false);
        }
      } catch (err) {
        console.error("Gagal mengambil data kegiatan:", err);
        if (isMounted) {
          setError(
            "Gagal memuat daftar kegiatan. Silakan coba beberapa saat lagi.",
          );
          setLoadingData(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, supabase, refreshKey]);

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
      const searchLower = search.toLowerCase();
      const matchSearch =
        item.title.toLowerCase().includes(searchLower) ||
        (item.description &&
          item.description.toLowerCase().includes(searchLower)) ||
        (item.location && item.location.toLowerCase().includes(searchLower));

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
    return (
      new Date(dateStr).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    );
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

    return `${startTime} (Mulai) s/d ${endTime} (Selesai) WIB`;
  };

  // Helper status badge matching DESIGN.md tokens & Dark Mode
  const getStatusBadge = (activity: Activity) => {
    const now = new Date();
    const start = new Date(activity.start_date);
    const end = new Date(activity.end_date);

    if (now < start) {
      return (
        <Badge className="bg-blue-50 dark:bg-blue-950/60 text-dongker-surface dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 font-mono text-micro font-semibold rounded-full px-3 py-0.5 uppercase">
          MENDATANG
        </Badge>
      );
    } else if (now >= start && now <= end) {
      return (
        <Badge className="bg-orange-wash dark:bg-orange-950/60 text-orange-deep dark:text-orange-300 border border-orange-200 dark:border-orange-900/60 font-mono text-micro font-semibold rounded-full px-3 py-0.5 uppercase animate-pulse">
          ONGOING
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-mono text-micro font-semibold rounded-full px-3 py-0.5 uppercase">
          SELESAI
        </Badge>
      );
    }
  };

  const isLoading = authLoading || loadingData;

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
      {/* Header Banner - Mobile First & Precision Blueprint Style */}
      <div className="relative border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-xs overflow-hidden">
        {/* Dongker & Orange Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-dongker-surface via-[#3b82f6] to-pnp-orange" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-dongker-ink dark:text-slate-100 font-display flex items-center gap-2.5">
              <HugeiconsIcon
                icon={Calendar03Icon}
                size={24}
                className="text-dongker-surface dark:text-blue-400 shrink-0"
              />
              Kegiatan UKM Robotik
            </h1>
            <p className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
              Agenda Pelatihan, Rapat, dan Workshop Teknologi Robotik PNP
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="flex gap-2 w-full sm:w-auto">
              {(activeRole === "admin-or" ||
                activeRole === "admin-komdis" ||
                activeRole === "super-admin") && (
                <Button
                  onClick={() =>
                    router.push(
                      activeRole === "admin-or"
                        ? "/kegiatan-absensi-caang/trash"
                        : "/kegiatan/sampah",
                    )
                  }
                  variant="outline"
                  className="w-full sm:w-auto rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-xs font-mono text-micro uppercase tracking-wider px-4 py-2.5"
                >
                  <HugeiconsIcon
                    icon={Delete01Icon}
                    size={16}
                    className="mr-2"
                  />
                  Sampah
                </Button>
              )}
              {(user?.role === "admin-komdis" ||
                user?.role === "super-admin") && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full sm:w-auto bg-dongker-surface hover:bg-dongker-hover dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-medium text-xs rounded-lg px-4 py-2.5 shadow-xs transition-colors"
                >
                  <HugeiconsIcon
                    icon={CalendarAdd01Icon}
                    size={16}
                    className="mr-2"
                  />
                  Buat Kegiatan Komdis
                </Button>
              )}
            </div>
            <Badge className="bg-slate-100 dark:bg-slate-800 text-dongker-ink dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full font-mono text-micro uppercase tracking-wider font-semibold">
              {" "}
              TOTAL: {activities.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid (Mobile-First: 1 col on mobile, 3 cols on md+) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Telemetry */}
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border-l-4 border-l-dongker-surface dark:border-l-blue-500 flex flex-col justify-between min-h-37.5 shadow-xs">
          <div>
            <h3 className="font-mono text-micro font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>ACTIVITY TELEMETRY</span>
              <span className="bg-slate-100 dark:bg-slate-800 text-dongker-ink dark:text-slate-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                TOTAL: {stats.total}
              </span>
            </h3>

            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  ONGOING
                </span>
                <span className="font-display text-2xl font-bold text-dongker-ink dark:text-slate-100">
                  {stats.ongoing}
                </span>
              </div>
              <div className="space-y-1 border-x border-slate-100 dark:border-slate-800">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  UPCOMING
                </span>
                <span className="font-display text-2xl font-bold text-dongker-ink dark:text-slate-100">
                  {stats.upcoming}
                </span>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  COMPLETED
                </span>
                <span className="font-display text-2xl font-bold text-dongker-ink dark:text-slate-100">
                  {stats.completed}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              {stats.ongoing > 0 && (
                <div
                  className="h-full bg-pnp-orange"
                  style={{
                    width: `${stats.total > 0 ? (stats.ongoing / stats.total) * 100 : 0}%`,
                  }}
                />
              )}
              {stats.upcoming > 0 && (
                <div
                  className="h-full bg-dongker-surface dark:bg-blue-500"
                  style={{
                    width: `${stats.total > 0 ? (stats.upcoming / stats.total) * 100 : 0}%`,
                  }}
                />
              )}
              {stats.completed > 0 && (
                <div
                  className="h-full bg-slate-300 dark:bg-slate-600"
                  style={{
                    width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`,
                  }}
                />
              )}
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pnp-orange" /> ONGOING
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-dongker-surface dark:bg-blue-500" />{" "}
                UPCOMING
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />{" "}
                DONE
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Next Event Tracker */}
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border-l-4 border-l-pnp-orange flex flex-col justify-between min-h-37.5 shadow-xs">
          <div>
            <h3 className="font-mono text-micro font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
              NEXT UPCOMING ACTIVITY
            </h3>

            {stats.next ? (
              <div className="space-y-1">
                <span className="font-display text-base font-medium text-dongker-ink dark:text-slate-100 block line-clamp-1">
                  {stats.next.title}
                </span>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 block">
                  {formatIndoDate(stats.next.start_date)}
                </span>
                <span className="font-mono text-micro text-pnp-orange dark:text-orange-400 font-semibold block uppercase tracking-wide">
                  LOKASI: {stats.next.location || "TBA"}
                </span>
              </div>
            ) : (
              <p className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase py-2">
                Tidak ada kegiatan mendatang
              </p>
            )}
          </div>
          <div className="pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            UPCOMING EVENT TRACKER
          </div>
        </div>

        {/* Card 3: Access & Location */}
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border-l-4 border-l-slate-blue dark:border-l-slate-400 sm:col-span-2 md:col-span-1 flex flex-col justify-between min-h-37.5 shadow-xs">
          <div>
            <h3 className="font-mono text-micro font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
              SYSTEM TELEMETRY
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="text-slate-500 dark:text-slate-400">
                  ROLE LEVEL:
                </span>
                <span className="font-bold text-dongker-ink dark:text-slate-100 uppercase">
                  {user?.role || "GUEST"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="text-slate-500 dark:text-slate-400">
                  TARGET AUDIENCE:
                </span>
                <span className="font-bold text-dongker-surface dark:text-blue-400 uppercase">
                  {user?.role === "caang" ? "KHUSUS CAANG" : "ANGGOTA"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  UNIQUE LOCATIONS:
                </span>
                <span className="font-bold text-dongker-ink dark:text-slate-100">
                  {stats.uniqueLocations}
                </span>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest flex justify-between">
            <span>STATUS REPO</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* Filter Controls Panel - Mobile First */}
      <div className="flex flex-col sm:flex-row gap-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <Input
            placeholder="Cari Kegiatan / Lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full bg-slate-50 dark:bg-slate-800/60 pl-10 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs text-dongker-ink dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-pnp-orange/20 focus-visible:border-pnp-orange"
          />
        </div>

        {/* Filter Status */}
        <div className="w-full sm:w-52">
          <select
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(
                e.target.value as "all" | "upcoming" | "ongoing" | "completed",
              )
            }
            className="h-10 w-full bg-slate-50 dark:bg-slate-800/60 px-3 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs text-dongker-ink dark:text-slate-100 focus:outline-hidden focus:border-pnp-orange"
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
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 text-center rounded-xl animate-pulse space-y-4">
          <div className="h-6 bg-slate-100 dark:bg-slate-800 w-1/4 mx-auto rounded-lg"></div>
          <div className="h-4 bg-slate-100 dark:bg-slate-800 w-1/2 mx-auto rounded-lg"></div>
          <div className="space-y-2 pt-6">
            <div className="h-12 bg-slate-50 dark:bg-slate-800/50 w-full rounded-lg"></div>
            <div className="h-12 bg-slate-50 dark:bg-slate-800/50 w-full rounded-lg"></div>
            <div className="h-12 bg-slate-50 dark:bg-slate-800/50 w-full rounded-lg"></div>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-red-200 dark:border-red-900/50 rounded-xl bg-red-50 dark:bg-red-950/30 p-6 sm:p-8 max-w-xl mx-auto">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 mb-3 font-bold font-mono">
            !
          </div>
          <p className="text-xs font-mono uppercase tracking-wider text-red-700 dark:text-red-300">
            {error}
          </p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 text-center rounded-xl">
          <HugeiconsIcon
            icon={Calendar03Icon}
            size={42}
            className="mx-auto text-slate-400 dark:text-slate-600 mb-3"
          />
          <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Tidak ada agenda kegiatan ditemukan.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Layout Cards (Mobile First: Default Block) */}
          <div className="block md:hidden space-y-3 sm:space-y-4">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-xl space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-11 w-16 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                      {activity.banner_url ? (
                        <Image
                          src={activity.banner_url}
                          alt={activity.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <HugeiconsIcon
                          icon={Calendar03Icon}
                          size={18}
                          className="text-slate-400 dark:text-slate-500"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                        NAMA KEGIATAN
                      </span>
                      <span className="text-sm font-display font-medium text-dongker-ink dark:text-slate-100 truncate block">
                        {activity.title}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">{getStatusBadge(activity)}</div>
                </div>

                <div className="space-y-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                        TANGGAL
                      </span>
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        {formatIndoDate(activity.start_date)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                        WAKTU
                      </span>
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                        {formatIndoTime(activity.start_date)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                      LOKASI
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      {activity.location || "TBA"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedActivity(activity)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 text-dongker-ink dark:text-slate-200 font-mono text-micro uppercase tracking-wider px-3 h-9 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <HugeiconsIcon icon={EyeIcon} size={14} className="mr-1" />
                    Detail
                  </Button>
                  {(user?.role === "admin-komdis" ||
                    user?.role === "super-admin") && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingKomdisActivity(activity)}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-mono text-micro uppercase tracking-wider px-3 h-9 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                      >
                        <HugeiconsIcon
                          icon={Edit02Icon}
                          size={14}
                          className="mr-1"
                        />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingKomdisActivity(activity)}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 font-mono text-micro uppercase tracking-wider px-3 h-9 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <HugeiconsIcon
                          icon={Delete01Icon}
                          size={14}
                          className="mr-1"
                        />
                        Hapus
                      </Button>
                    </>
                  )}
                  {isAttendanceWindowActive(activity) && (
                    <Button
                      size="sm"
                      onClick={() =>
                        router.push(`/kegiatan/${activity.id}/absensi`)
                      }
                      className="rounded-lg bg-dongker-surface dark:bg-blue-600 text-white font-mono text-micro uppercase tracking-wider px-3 h-9 hover:bg-dongker-hover dark:hover:bg-blue-500"
                    >
                      Absen
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (Hidden on mobile, shown on md+) */}
          <div className="hidden md:block overflow-x-auto border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
            <table className="w-full min-w-225 border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="p-4 w-24 text-center font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Banner
                  </th>
                  <th className="p-4 font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Nama Kegiatan
                  </th>
                  <th className="p-4 font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Tanggal &amp; Waktu
                  </th>
                  <th className="p-4 font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Lokasi
                  </th>
                  <th className="p-4 w-32 font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Status
                  </th>
                  <th className="p-4 w-44 text-center font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredActivities.map((activity) => (
                  <tr
                    key={activity.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-4 align-middle text-center">
                      <div className="relative h-11 w-16 mx-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                        {activity.banner_url ? (
                          <Image
                            src={activity.banner_url}
                            alt={activity.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <HugeiconsIcon
                            icon={Calendar03Icon}
                            size={18}
                            className="text-slate-400 dark:text-slate-500"
                          />
                        )}
                      </div>
                    </td>

                    <td className="p-4 align-middle">
                      <div
                        className="font-display font-medium text-dongker-ink dark:text-slate-100 text-sm truncate max-w-70"
                        title={activity.title}
                      >
                        {activity.title}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 tracking-wider uppercase">
                        AUDIENCE: {activity.target_audience}
                      </div>
                    </td>

                    <td className="p-4 align-middle">
                      <div className="text-dongker-ink dark:text-slate-200 text-xs font-medium">
                        {formatIndoDate(activity.start_date)}
                      </div>
                      <div className="font-mono text-micro text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatTimeRange(
                          activity.start_date,
                          activity.end_date,
                        )}
                      </div>
                    </td>

                    <td className="p-4 align-middle">
                      <div
                        className="text-slate-700 dark:text-slate-300 text-xs truncate max-w-55"
                        title={activity.location || "TBA"}
                      >
                        {activity.location || "TBA"}
                      </div>
                    </td>

                    <td className="p-4 align-middle">
                      {getStatusBadge(activity)}
                    </td>

                    <td className="p-4 align-middle text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedActivity(activity)}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 text-dongker-ink dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 h-8 px-2.5 font-mono text-micro uppercase tracking-wider"
                        >
                          <HugeiconsIcon
                            icon={EyeIcon}
                            size={14}
                            className="mr-1"
                          />
                          Detail
                        </Button>
                        {((activity.target_audience === "anggota" &&
                          (user?.role === "admin-komdis" ||
                            user?.role === "super-admin")) ||
                          (activity.target_audience === "caang" &&
                            (user?.role === "admin-or" ||
                              user?.role === "super-admin"))) && (
                          <>
                            {activity.target_audience === "anggota" && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  setEditingKomdisActivity(activity)
                                }
                                className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                title="Edit Kegiatan"
                              >
                                <HugeiconsIcon icon={Edit02Icon} size={14} />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                setDeletingKomdisActivity(activity)
                              }
                              className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                              title="Hapus Kegiatan"
                            >
                              <HugeiconsIcon icon={Delete01Icon} size={14} />
                            </Button>
                          </>
                        )}{" "}
                        {isAttendanceWindowActive(activity) && (
                          <Button
                            size="sm"
                            onClick={() =>
                              router.push(`/kegiatan/${activity.id}/absensi`)
                            }
                            className="rounded-lg bg-dongker-surface dark:bg-blue-600 text-white hover:bg-dongker-hover dark:hover:bg-blue-500 h-8 px-2.5 font-mono text-micro uppercase tracking-wider"
                          >
                            Absen
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal: View Activity Detail */}
      <Dialog
        open={!!selectedActivity}
        onOpenChange={(open) => !open && setSelectedActivity(null)}
      >
        <DialogContent className="rounded-xl max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-y-auto max-h-[90vh] p-0 font-sans">
          {selectedActivity && (
            <>
              <div className="relative h-52 sm:h-64 w-full bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-dongker-surface via-[#3b82f6] to-pnp-orange z-20" />

                {selectedActivity.banner_url ? (
                  <Image
                    src={selectedActivity.banner_url}
                    alt={selectedActivity.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 672px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-dongker-surface/10 via-pnp-orange/5 to-transparent flex items-center justify-center">
                    <HugeiconsIcon
                      icon={Calendar03Icon}
                      size={64}
                      className="text-slate-400 dark:text-slate-600"
                    />
                  </div>
                )}

                <div className="absolute bottom-4 left-4 z-10 flex gap-2">
                  {getStatusBadge(selectedActivity)}
                  <Badge className="bg-slate-900/70 dark:bg-slate-950/70 text-white border border-slate-700 font-mono text-[10px] rounded-full px-3 py-0.5 uppercase backdrop-blur-xs">
                    AUDIENCE: {selectedActivity.target_audience}
                  </Badge>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl font-display font-medium text-dongker-ink dark:text-slate-100">
                    {selectedActivity.title}
                  </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 uppercase tracking-widest block text-[10px]">
                      LOKASI
                    </span>
                    <span className="text-dongker-ink dark:text-slate-200 font-semibold">
                      {selectedActivity.location || "TBA"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 uppercase tracking-widest block text-[10px]">
                      WAKTU MULAI
                    </span>
                    <span className="text-dongker-ink dark:text-slate-200 font-semibold">
                      {formatIndoDate(selectedActivity.start_date)} (
                      {formatIndoTime(selectedActivity.start_date)})
                    </span>
                  </div>
                </div>

                {selectedActivity.description && (
                  <div className="space-y-1.5">
                    <h4 className="font-mono text-micro font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      DESKRIPSI KEGIATAN
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800/60 font-body">
                      {selectedActivity.description}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedActivity(null)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs uppercase"
                  >
                    Tutup
                  </Button>
                  {isAttendanceWindowActive(selectedActivity) && (
                    <Button
                      onClick={() => {
                        const id = selectedActivity.id;
                        setSelectedActivity(null);
                        router.push(`/kegiatan/${id}/absensi`);
                      }}
                      className="rounded-lg bg-dongker-surface dark:bg-blue-600 text-white hover:bg-dongker-hover dark:hover:bg-blue-500 font-mono text-xs uppercase"
                    >
                      Buka Modul Presensi
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Create Komdis Activity */}
      <CreateKomdisActivityDialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchActivities}
      />

      {/* Modal: Edit Komdis Activity */}
      <EditKomdisActivityDialog
        activity={editingKomdisActivity}
        isOpen={!!editingKomdisActivity}
        onClose={() => setEditingKomdisActivity(null)}
        onSuccess={fetchActivities}
      />

      {/* Modal: Delete Confirmation */}
      <Dialog
        open={!!deletingKomdisActivity}
        onOpenChange={(open) => !open && setDeletingKomdisActivity(null)}
      >
        <DialogContent className="max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-dongker-ink dark:text-slate-100 font-display">
              Konfirmasi Hapus Kegiatan
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-2">
              Apakah Anda yakin ingin menghapus kegiatan &quot;
              {deletingKomdisActivity?.title}&quot;? Tindakan ini tidak dapat
              dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              onClick={() => setDeletingKomdisActivity(null)}
              disabled={isDeletingKomdis}
              className="rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs uppercase"
            >
              Batal
            </Button>
            <Button
              onClick={handleSoftDelete}
              disabled={isDeletingKomdis}
              className="rounded-lg bg-red-600 hover:bg-red-700 text-white font-mono text-xs uppercase tracking-wider"
            >
              {isDeletingKomdis ? (
                <>
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    size={14}
                    className="animate-spin mr-1.5"
                  />
                  Menghapus...
                </>
              ) : (
                "Hapus Kegiatan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
