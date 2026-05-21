"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Clock01Icon,
  Location01Icon,
  InformationCircleIcon,
  Cancel01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

type TabType = "upcoming" | "ongoing" | "completed";

export default function KegiatanPage() {
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
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

  // Klasifikasi kegiatan secara dinamis berdasarkan waktu saat ini
  const getCategorizedActivities = () => {
    const now = new Date();
    
    return activities.reduce(
      (acc, activity) => {
        const start = new Date(activity.start_date);
        const end = new Date(activity.end_date);

        if (now < start) {
          acc.upcoming.push(activity);
        } else if (now >= start && now <= end) {
          acc.ongoing.push(activity);
        } else {
          acc.completed.push(activity);
        }
        return acc;
      },
      { upcoming: [] as Activity[], ongoing: [] as Activity[], completed: [] as Activity[] }
    );
  };

  const categorized = getCategorizedActivities();
  const displayedActivities = categorized[activeTab];

  // Helper formatting waktu
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
    
    // Jika hari yang sama, gabung jam saja
    if (start.toDateString() === end.toDateString()) {
      return `${startTime} - ${endTime} WIB`;
    }
    
    return `${startTime} (Mulai) s/d ${endTime} (Selesai) WIB`;
  };

  const getStatusBadge = (activity: Activity) => {
    const now = new Date();
    const start = new Date(activity.start_date);
    const end = new Date(activity.end_date);

    if (now < start) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          Mendatang
        </span>
      );
    } else if (now >= start && now <= end) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          Sedang Berlangsung
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-500/10 text-neutral-400 border border-neutral-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
          Selesai
        </span>
      );
    }
  };

  const isLoading = authLoading || loadingData;

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-neutral-900 to-neutral-600 dark:from-neutral-100 dark:to-neutral-400 bg-clip-text text-transparent">
          Kegiatan UKM
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Ikuti berbagai agenda menarik, pelatihan robotik, workshop teknologi, dan rapat koordinasi di UKM Robotik PNP.
        </p>
      </div>

      {/* Tabs Navigator */}
      <div className="border-b border-border/50 pb-px">
        <div className="flex gap-4">
          {([
            { id: "upcoming", label: "Mendatang", count: categorized.upcoming.length },
            { id: "ongoing", label: "Sedang Berlangsung", count: categorized.ongoing.length },
            { id: "completed", label: "Selesai", count: categorized.completed.length },
          ] as const).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative pb-3 text-sm font-semibold transition-colors focus:outline-none"
                style={{ color: isActive ? "var(--foreground)" : "var(--color-muted-foreground)" }}
              >
                <div className="flex items-center gap-2">
                  {tab.label}
                  <span
                    className={`inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-medium border ${
                      isActive
                        ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700"
                    }`}
                  >
                    {isLoading ? "..." : tab.count}
                  </span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="activeKegiatanTabLine"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Section */}
      {isLoading ? (
        // Skeleton Loader Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-sm animate-pulse"
            >
              <div className="h-44 w-full rounded-xl bg-muted/60" />
              <div className="space-y-2">
                <div className="h-6 w-3/4 rounded-md bg-muted/60" />
                <div className="h-4 w-1/2 rounded-md bg-muted/60" />
              </div>
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="h-4 w-5/6 rounded-md bg-muted/60" />
                <div className="h-4 w-2/3 rounded-md bg-muted/60" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        // Error Message State
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-red-500/20 rounded-3xl bg-red-500/5 p-8 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4 border border-red-500/25">
            !
          </div>
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{error}</p>
        </div>
      ) : displayedActivities.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border/80 rounded-3xl bg-neutral-50/50 dark:bg-neutral-900/10 p-8 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-border/50 flex items-center justify-center mb-5 text-neutral-400">
            <HugeiconsIcon icon={Calendar03Icon} size={28} />
          </div>
          <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 mb-2">
            Tidak Ada Kegiatan
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            Saat ini tidak ada kegiatan di kategori ini untuk Anda. Silakan cek berkala atau hubungi pengurus.
          </p>
        </div>
      ) : (
        // Activities Grid
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {displayedActivities.map((activity) => (
              <motion.div
                key={activity.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25 }}
                onClick={() => setSelectedActivity(activity)}
                className="group flex flex-col h-full cursor-pointer rounded-2xl border border-border/50 bg-card hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 transition-all overflow-hidden relative shadow-xs"
              >
                {/* Banner Image or Gradient Fallback */}
                <div className="h-44 w-full relative bg-neutral-100 dark:bg-neutral-900 overflow-hidden shrink-0 border-b border-border/30">
                  {activity.banner_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activity.banner_url}
                      alt={activity.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-600/20 via-violet-600/10 to-transparent flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-grid-white/[0.02]" />
                      <HugeiconsIcon
                        icon={Calendar03Icon}
                        size={48}
                        className="text-indigo-500/40 group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  )}
                  {/* Status Badge floating on image */}
                  <div className="absolute top-4 left-4 z-10">
                    {getStatusBadge(activity)}
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="flex-1 p-5 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-100 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {activity.title}
                    </h3>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {activity.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata Footer */}
                  <div className="pt-4 border-t border-border/40 space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={Calendar03Icon} size={14} className="shrink-0 text-indigo-500" />
                      <span className="line-clamp-1">{formatIndoDate(activity.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={Clock01Icon} size={14} className="shrink-0 text-indigo-500" />
                      <span className="line-clamp-1">{formatTimeRange(activity.start_date, activity.end_date)}</span>
                    </div>
                    {activity.location && (
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={Location01Icon} size={14} className="shrink-0 text-indigo-500" />
                        <span className="line-clamp-1">{activity.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Pop-up Modal Detail Kegiatan */}
      <AnimatePresence>
        {selectedActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-md">
            {/* Click Outside to Close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedActivity(null)}
              className="absolute inset-0"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative z-10 w-full max-w-2xl bg-card border border-border/80 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Close Button floating top-right */}
              <button
                onClick={() => setSelectedActivity(null)}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-neutral-950/50 hover:bg-neutral-950/70 text-white flex items-center justify-center transition-colors border border-white/10"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>

              {/* Detail Banner */}
              <div className="h-64 w-full relative bg-neutral-100 dark:bg-neutral-950 shrink-0 border-b border-border/30">
                {selectedActivity.banner_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedActivity.banner_url}
                    alt={selectedActivity.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-600/30 via-violet-600/15 to-transparent flex items-center justify-center">
                    <div className="absolute inset-0 bg-grid-white/[0.02]" />
                    <HugeiconsIcon icon={Calendar03Icon} size={72} className="text-indigo-500/50" />
                  </div>
                )}
                {/* Floating Status and Audience Info */}
                <div className="absolute bottom-4 left-6 flex gap-2">
                  {getStatusBadge(selectedActivity)}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-950/60 text-indigo-300 border border-indigo-400/20 backdrop-blur-xs">
                    <HugeiconsIcon icon={UserGroupIcon} size={12} />
                    Untuk: {selectedActivity.target_audience === "caang" ? "Calon Anggota" : "Anggota"}
                  </span>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
                <div className="space-y-3">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white leading-tight">
                    {selectedActivity.title}
                  </h2>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs md:text-sm text-muted-foreground border-b border-border/40 pb-4">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={Calendar03Icon} size={16} className="text-indigo-500" />
                      <span>{formatIndoDate(selectedActivity.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={Clock01Icon} size={16} className="text-indigo-500" />
                      <span>{formatIndoTime(selectedActivity.start_date)} s/d selesai</span>
                    </div>
                  </div>
                </div>

                {/* Detail Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-neutral-50 dark:bg-neutral-900/60 border border-border/40 rounded-2xl p-4 flex gap-3">
                    <HugeiconsIcon icon={Clock01Icon} size={20} className="text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Durasi Kegiatan</h4>
                      <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                        {formatTimeRange(selectedActivity.start_date, selectedActivity.end_date)}
                      </p>
                    </div>
                  </div>

                  {selectedActivity.location && (
                    <div className="bg-neutral-50 dark:bg-neutral-900/60 border border-border/40 rounded-2xl p-4 flex gap-3">
                      <HugeiconsIcon icon={Location01Icon} size={20} className="text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Lokasi</h4>
                        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 leading-relaxed">
                          {selectedActivity.location}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Deskripsi Kegiatan */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <HugeiconsIcon icon={InformationCircleIcon} size={18} className="text-indigo-500" />
                    Deskripsi Kegiatan
                  </h3>
                  <div className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed space-y-2 whitespace-pre-line p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/20 border border-border/30">
                    {selectedActivity.description || "Tidak ada deskripsi detail untuk kegiatan ini."}
                  </div>
                </div>
              </div>

              {/* Action/Footer */}
              <div className="p-6 border-t border-border/40 bg-neutral-50/50 dark:bg-neutral-900/40 flex justify-end shrink-0">
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
