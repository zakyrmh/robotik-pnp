"use client";

import {
  useState,
  useMemo,
  useRef,
  useTransition,
  useCallback,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Add01Icon,
  Edit02Icon,
  Delete01Icon,
  Search01Icon,
  UserGroupIcon,
  CalendarAdd01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Upload01Icon,
  Archive01Icon,
  QrCode01Icon,
  EyeIcon,
} from "@hugeicons/core-free-icons";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import {
  createActivity,
  updateActivity,
  softDeleteActivity,
  upsertAttendanceStatus,
  type ActivityItem,
  type AttendanceSummaryItem,
} from "@/lib/actions/activities";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ActivityForSummary {
  id: string;
  title: string;
  start_date: string;
}

export interface KegiatanClientProps {
  initialActivities?: ActivityItem[];
  variant?: "membership" | "caang-recruitment";
  initialActivitiesForSummary?: ActivityForSummary[];
  initialSummary?: AttendanceSummaryItem[];
  userRole?: string;
}

type TabType = "kegiatan" | "absensi";
type StatusAbsensi = "hadir" | "izin" | "sakit" | "alfa";

const STATUS_CONFIG: Record<
  StatusAbsensi,
  { label: string; color: string; bg: string; border: string }
> = {
  hadir: {
    label: "Hadir",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  izin: {
    label: "Izin",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
  },
  sakit: {
    label: "Sakit",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
  },
  alfa: {
    label: "Alfa",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatIndoDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatIndoTime(dateStr: string) {
  return (
    new Date(dateStr).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB"
  );
}

function formatTimeRange(startStr: string, endStr: string) {
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
}

function toLocalDatetimeInput(dateStr: string) {
  const d = new Date(dateStr);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function getActivityStatus(
  activity: ActivityItem,
): "upcoming" | "ongoing" | "completed" {
  const now = new Date();
  const start = new Date(activity.start_date);
  const end = new Date(activity.end_date);
  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "ongoing";
  return "completed";
}

const emptyForm = {
  title: "",
  description: "",
  start_date: "",
  end_date: "",
  location: "",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function KegiatanClient({
  initialActivities = [],
  variant = "membership",
  initialActivitiesForSummary = [],
  initialSummary = [],
  userRole,
}: KegiatanClientProps = {}) {
  const supabase = createClient();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const activeRole = userRole || user?.role;
  const [isPending, startTransition] = useTransition();

  const isRecruitmentMode = variant === "caang-recruitment";

  // Data & Client Refresh State
  const [activities, setActivities] =
    useState<ActivityItem[]>(initialActivities);
  const [loadingData, setLoadingData] = useState(
    initialActivities.length === 0,
  );
  const [error, setError] = useState<string | null>(null);

  // Tabs state
  const [activeTab, setActiveTab] = useState<TabType>("kegiatan");

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "upcoming" | "ongoing" | "completed"
  >("all");

  // Modals state
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(
    null,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingKomdisActivity, setEditingKomdisActivity] =
    useState<ActivityItem | null>(null);

  // Activity Form Modal (Create / Edit General or Caang)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(
    null,
  );
  const [form, setForm] = useState(emptyForm);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Soft Delete Modal
  const [deletingActivity, setDeletingActivity] = useState<ActivityItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Attendance Override Popover Cell
  const [overrideCell, setOverrideCell] = useState<{
    profileId: string;
    activityId: string;
  } | null>(null);

  // Sync initialActivities when prop changes
  const [prevInitialActivities, setPrevInitialActivities] =
    useState(initialActivities);
  if (prevInitialActivities !== initialActivities) {
    setPrevInitialActivities(initialActivities);
    setActivities(initialActivities);
  }

  // Fetch client side if initialActivities was empty
  const [refreshKey, setRefreshKey] = useState(0);
  const fetchActivities = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (authLoading || !user || initialActivities.length > 0) return;
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
          setActivities((data as ActivityItem[]) || []);
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
  }, [user, authLoading, supabase, refreshKey, initialActivities.length]);

  // Dynamic telemetry calculations
  const stats = useMemo<{
    total: number;
    upcoming: number;
    ongoing: number;
    completed: number;
    next: ActivityItem | null;
    uniqueLocations: number;
  }>(() => {
    const now = new Date();
    let upcoming = 0;
    let ongoing = 0;
    let completed = 0;
    let next: ActivityItem | null = null;
    const locations = new Set<string>();

    activities.forEach((item: ActivityItem) => {
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

  // Filtered Activities
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

  // Filtered Attendance Summary
  const filteredSummary = useMemo(() => {
    if (!search.trim()) return initialSummary;
    const q = search.toLowerCase();
    return initialSummary.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.nim.toLowerCase().includes(q) ||
        s.studyProgramName.toLowerCase().includes(q),
    );
  }, [initialSummary, search]);

  // Attendance window helper
  const isAttendanceWindowActive = (activity: ActivityItem | null) => {
    if (!activity) return false;
    const now = new Date();
    const startWindow = new Date(
      new Date(activity.start_date).getTime() - 2 * 60 * 60 * 1000,
    );
    const endWindow = new Date(activity.end_date);
    return now >= startWindow && now <= endWindow;
  };

  // Status Badge Helper
  const getStatusBadge = (activity: ActivityItem) => {
    const st = getActivityStatus(activity);
    if (st === "ongoing") {
      return (
        <Badge className="bg-orange-wash dark:bg-orange-950/60 text-orange-deep dark:text-orange-300 border border-orange-200 dark:border-orange-900/60 font-mono text-micro font-semibold rounded-full px-3 py-0.5 uppercase animate-pulse">
          ONGOING
        </Badge>
      );
    } else if (st === "upcoming") {
      return (
        <Badge className="bg-blue-50 dark:bg-blue-950/60 text-dongker-surface dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 font-mono text-micro font-semibold rounded-full px-3 py-0.5 uppercase">
          MENDATANG
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

  // Open Form Handlers
  const openAddForm = () => {
    setEditingActivity(null);
    setForm(emptyForm);
    setBannerFile(null);
    setBannerPreview(null);
    setIsFormOpen(true);
  };

  const openEditForm = (activity: ActivityItem) => {
    setEditingActivity(activity);
    setForm({
      title: activity.title,
      description: activity.description ?? "",
      start_date: toLocalDatetimeInput(activity.start_date),
      end_date: toLocalDatetimeInput(activity.end_date),
      location: activity.location ?? "",
    });
    setBannerFile(null);
    setBannerPreview(activity.banner_url);
    setIsFormOpen(true);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setBannerPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Submit Add/Edit Activity Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.start_date || !form.end_date) {
      toast.error("Judul, Waktu Mulai, dan Waktu Berakhir wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(
      editingActivity ? "Memperbarui kegiatan..." : "Menyimpan kegiatan...",
    );

    const fd = new FormData();
    fd.set("title", form.title);
    fd.set("description", form.description);
    fd.set("start_date", new Date(form.start_date).toISOString());
    fd.set("end_date", new Date(form.end_date).toISOString());
    fd.set("location", form.location);
    if (isRecruitmentMode) {
      fd.set("target_audience", "caang");
    }
    if (bannerFile) fd.set("banner", bannerFile);
    if (editingActivity?.banner_url && !bannerFile) {
      fd.set("existing_banner_url", editingActivity.banner_url);
    }

    try {
      const res = editingActivity
        ? await updateActivity(editingActivity.id, fd)
        : await createActivity(fd);

      toast.dismiss(toastId);
      if (res.success) {
        toast.success(res.message);
        setIsFormOpen(false);
        startTransition(() => {
          router.refresh();
          fetchActivities();
        });
      } else {
        toast.error(res.message || "Terjadi kesalahan.");
      }
    } catch {
      toast.dismiss(toastId);
      toast.error("Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Soft Delete
  const handleSoftDelete = async () => {
    if (!deletingActivity) return;
    setIsDeleting(true);
    const toastId = toast.loading("Memindahkan kegiatan ke tempat sampah...");

    try {
      let res;
      if (
        !isRecruitmentMode &&
        deletingActivity.target_audience === "anggota"
      ) {
        await softDeleteKomdisActivity(deletingActivity.id);
        res = {
          success: true,
          message: "Kegiatan berhasil dipindahkan ke tempat sampah.",
        };
      } else {
        res = await softDeleteActivity(deletingActivity.id);
      }

      toast.dismiss(toastId);
      if (res.success) {
        toast.success(res.message);
        setDeletingActivity(null);
        startTransition(() => {
          router.refresh();
          fetchActivities();
        });
      } else {
        toast.error(res.message);
      }
    } catch (err: unknown) {
      toast.dismiss(toastId);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Attendance Status Override
  const handleAttendanceChange = async (
    profileId: string,
    activityId: string,
    status: StatusAbsensi,
  ) => {
    setOverrideCell(null);
    const toastId = toast.loading("Memperbarui status absensi...");
    try {
      const res = await upsertAttendanceStatus(activityId, profileId, status);
      toast.dismiss(toastId);
      if (res.success) {
        toast.success(res.message);
        startTransition(() => router.refresh());
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.dismiss(toastId);
      toast.error("Terjadi kesalahan koneksi.");
    }
  };

  const isLoading =
    (authLoading && initialActivities.length === 0) || loadingData;

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
      {/* ── Header Banner ────────────────────────────────────────────────── */}
      <div className="relative border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-xs overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-dongker-surface via-[#3b82f6] to-pnp-orange" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-dongker-ink dark:text-slate-100 font-display flex items-center gap-2.5">
              <HugeiconsIcon
                icon={isRecruitmentMode ? CalendarAdd01Icon : Calendar03Icon}
                size={24}
                className="text-dongker-surface dark:text-blue-400 shrink-0"
              />
              {isRecruitmentMode
                ? "Kegiatan & Absensi Caang"
                : "Kegiatan UKM Robotik"}
            </h1>
            <p className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
              {isRecruitmentMode
                ? "Manajemen Kegiatan dan Rekap Absensi Calon Anggota UKM Robotik PNP"
                : "Agenda Pelatihan, Rapat, dan Workshop Teknologi Robotik PNP"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {isRecruitmentMode ? (
              <>
                {(activeRole === "admin-or" ||
                  activeRole === "super-admin") && (
                  <Button
                    variant="outline"
                    onClick={() => router.push("/kegiatan-absensi-caang/trash")}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-xs font-mono text-micro uppercase tracking-wider px-3.5 h-9"
                  >
                    <HugeiconsIcon
                      icon={Archive01Icon}
                      size={15}
                      className="mr-1.5 text-slate-500"
                    />
                    Trash
                  </Button>
                )}
                {(activeRole === "admin-or" ||
                  activeRole === "super-admin") && (
                  <Button
                    variant="outline"
                    onClick={() => router.push("/kegiatan-absensi-caang/scan")}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-xs font-mono text-micro uppercase tracking-wider px-3.5 h-9"
                  >
                    <HugeiconsIcon
                      icon={QrCode01Icon}
                      size={15}
                      className="mr-1.5 text-slate-500"
                    />
                    Scan QR
                  </Button>
                )}
                {(activeRole === "admin-or" ||
                  activeRole === "super-admin") && (
                  <Button
                    onClick={openAddForm}
                    className="bg-dongker-surface hover:bg-dongker-hover dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-mono text-micro uppercase tracking-wider rounded-lg px-4 h-9 shadow-xs"
                  >
                    <HugeiconsIcon
                      icon={Add01Icon}
                      size={15}
                      className="mr-1.5"
                    />
                    Tambah Kegiatan
                  </Button>
                )}
              </>
            ) : (
              <>
                {(activeRole === "admin-komdis" ||
                  activeRole === "super-admin") && (
                  <Button
                    onClick={() => router.push("/kegiatan/sampah")}
                    variant="outline"
                    className="w-full sm:w-auto rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-xs font-mono text-micro uppercase tracking-wider px-4 h-9"
                  >
                    <HugeiconsIcon
                      icon={Delete01Icon}
                      size={15}
                      className="mr-1.5"
                    />
                    Sampah
                  </Button>
                )}
                {(activeRole === "admin-komdis" ||
                  activeRole === "super-admin") && (
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full sm:w-auto bg-dongker-surface hover:bg-dongker-hover dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-medium text-xs rounded-lg px-4 h-9 shadow-xs transition-colors"
                  >
                    <HugeiconsIcon
                      icon={CalendarAdd01Icon}
                      size={15}
                      className="mr-1.5"
                    />
                    Buat Kegiatan Komdis
                  </Button>
                )}
              </>
            )}
            <Badge className="bg-slate-100 dark:bg-slate-800 text-dongker-ink dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full font-mono text-micro uppercase tracking-wider font-semibold">
              TOTAL: {activities.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* ── Recruitment Mode Tabs Switcher ──────────────────────────────── */}
      {isRecruitmentMode && (
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          {(
            [
              {
                id: "kegiatan",
                label: "Daftar Kegiatan",
                icon: Calendar03Icon,
                count: activities.length,
              },
              {
                id: "absensi",
                label: "Rekap Absensi Caang",
                icon: CheckmarkCircle01Icon,
                count: initialSummary.length,
              },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearch("");
                }}
                className={`relative flex items-center gap-2 px-5 py-3 font-mono text-xs uppercase tracking-wider transition-colors ${
                  isActive
                    ? "text-dongker-surface dark:text-blue-400 font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <HugeiconsIcon icon={tab.icon} size={16} />
                {tab.label}
                <Badge className="rounded-full font-mono text-[10px] px-2 py-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  {tab.count}
                </Badge>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-dongker-surface dark:bg-blue-500" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Stats Cards Grid ─────────────────────────────────────────────── */}
      {activeTab === "kegiatan" && (
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
                  <span className="w-2 h-2 rounded-full bg-pnp-orange" />{" "}
                  ONGOING
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
                    {activeRole || "GUEST"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <span className="text-slate-500 dark:text-slate-400">
                    TARGET AUDIENCE:
                  </span>
                  <span className="font-bold text-dongker-surface dark:text-blue-400 uppercase">
                    {isRecruitmentMode
                      ? "KHUSUS CAANG"
                      : user?.role === "caang"
                        ? "KHUSUS CAANG"
                        : "ANGGOTA"}
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
      )}

      {/* ── Filter Controls Panel ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl shadow-xs">
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <Input
            placeholder={
              activeTab === "kegiatan"
                ? "Cari kegiatan / lokasi..."
                : "Cari nama / NIM Caang..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full bg-slate-50 dark:bg-slate-800/60 pl-10 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs text-dongker-ink dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-pnp-orange/20 focus-visible:border-pnp-orange"
          />
        </div>

        {activeTab === "kegiatan" && (
          <div className="w-full sm:w-52">
            <select
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(
                  e.target.value as
                    | "all"
                    | "upcoming"
                    | "ongoing"
                    | "completed",
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
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TAB: DAFTAR KEGIATAN
          ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "kegiatan" && (
        <>
          {isLoading ? (
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 text-center rounded-xl animate-pulse space-y-4">
              <div className="h-6 bg-slate-100 dark:bg-slate-800 w-1/4 mx-auto rounded-lg" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 w-1/2 mx-auto rounded-lg" />
              <div className="space-y-2 pt-6">
                <div className="h-12 bg-slate-50 dark:bg-slate-800/50 w-full rounded-lg" />
                <div className="h-12 bg-slate-50 dark:bg-slate-800/50 w-full rounded-lg" />
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
                {search
                  ? "Tidak ada kegiatan yang cocok."
                  : 'Belum ada kegiatan. Klik "+ Tambah Kegiatan" untuk memulai.'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
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
                        onClick={() =>
                          isRecruitmentMode
                            ? router.push(
                                `/kegiatan-absensi-caang/${activity.id}`,
                              )
                            : setSelectedActivity(activity)
                        }
                        className="rounded-lg border border-slate-200 dark:border-slate-700 text-dongker-ink dark:text-slate-200 font-mono text-micro uppercase tracking-wider px-3 h-8 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <HugeiconsIcon
                          icon={EyeIcon}
                          size={14}
                          className="mr-1"
                        />
                        Detail
                      </Button>

                      {(activeRole === "super-admin" ||
                        (isRecruitmentMode && activeRole === "admin-or") ||
                        (!isRecruitmentMode &&
                          activeRole === "admin-komdis")) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              isRecruitmentMode
                                ? openEditForm(activity)
                                : setEditingKomdisActivity(activity)
                            }
                            className="rounded-lg border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-mono text-micro uppercase tracking-wider px-3 h-8 hover:bg-blue-50 dark:hover:bg-blue-950/40"
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
                            onClick={() => setDeletingActivity(activity)}
                            className="rounded-lg border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 font-mono text-micro uppercase tracking-wider px-3 h-8 hover:bg-red-50 dark:hover:bg-red-950/40"
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
                            router.push(
                              isRecruitmentMode
                                ? `/kegiatan-absensi-caang/${activity.id}`
                                : `/kegiatan/${activity.id}/absensi`,
                            )
                          }
                          className="rounded-lg bg-dongker-surface dark:bg-blue-600 text-white font-mono text-micro uppercase tracking-wider px-3 h-8 hover:bg-dongker-hover dark:hover:bg-blue-500"
                        >
                          Absen
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
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
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                isRecruitmentMode
                                  ? router.push(
                                      `/kegiatan-absensi-caang/${activity.id}`,
                                    )
                                  : setSelectedActivity(activity)
                              }
                              className="rounded-lg border border-slate-200 dark:border-slate-700 text-dongker-ink dark:text-slate-200 font-mono text-micro uppercase tracking-wider h-8 px-2.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <HugeiconsIcon
                                icon={EyeIcon}
                                size={14}
                                className="mr-1"
                              />
                              Detail
                            </Button>

                            {(activeRole === "super-admin" ||
                              (isRecruitmentMode &&
                                activeRole === "admin-or") ||
                              (!isRecruitmentMode &&
                                activeRole === "admin-komdis")) && (
                              <>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    isRecruitmentMode
                                      ? openEditForm(activity)
                                      : setEditingKomdisActivity(activity)
                                  }
                                  className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                  title="Edit"
                                >
                                  <HugeiconsIcon icon={Edit02Icon} size={14} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setDeletingActivity(activity)}
                                  className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                                  title="Hapus"
                                >
                                  <HugeiconsIcon
                                    icon={Delete01Icon}
                                    size={14}
                                  />
                                </Button>
                              </>
                            )}

                            {isAttendanceWindowActive(activity) && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    isRecruitmentMode
                                      ? `/kegiatan-absensi-caang/${activity.id}`
                                      : `/kegiatan/${activity.id}/absensi`,
                                  )
                                }
                                className="rounded-lg bg-dongker-surface dark:bg-blue-600 text-white font-mono text-micro uppercase tracking-wider h-8 px-2.5 hover:bg-dongker-hover dark:hover:bg-blue-500"
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
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB: REKAP ABSENSI CAANG (Oprec / Caang Mode)
          ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "absensi" && isRecruitmentMode && (
        <>
          {filteredSummary.length === 0 ? (
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center rounded-xl">
              <HugeiconsIcon
                icon={UserGroupIcon}
                size={40}
                className="mx-auto text-slate-400 dark:text-slate-600 mb-3"
              />
              <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {search
                  ? "Tidak ada Caang yang cocok dengan pencarian."
                  : "Belum ada Caang terverifikasi yang terdaftar."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Attendance Matrix Table */}
              <div className="hidden md:block overflow-x-auto border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <th className="p-3 font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 min-w-[220px] sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 border-r border-slate-200 dark:border-slate-800">
                        Caang
                      </th>
                      {initialActivitiesForSummary.map((act) => (
                        <th
                          key={act.id}
                          className="p-3 font-mono text-micro uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 min-w-[110px] text-center border-r border-slate-200 dark:border-slate-800"
                        >
                          <div className="max-w-[100px] mx-auto">
                            <span className="line-clamp-2 text-[10px] leading-tight block">
                              {act.title}
                            </span>
                            <span className="text-slate-400 text-[9px] mt-0.5 block font-mono">
                              {formatDate(act.start_date)}
                            </span>
                          </div>
                        </th>
                      ))}
                      <th className="p-3 font-mono text-micro uppercase tracking-wider text-center text-emerald-600 dark:text-emerald-400 min-w-[60px]">
                        Hadir
                      </th>
                      <th className="p-3 font-mono text-micro uppercase tracking-wider text-center text-amber-600 dark:text-amber-400 min-w-[60px]">
                        Izin
                      </th>
                      <th className="p-3 font-mono text-micro uppercase tracking-wider text-center text-blue-600 dark:text-blue-400 min-w-[60px]">
                        Sakit
                      </th>
                      <th className="p-3 font-mono text-micro uppercase tracking-wider text-center text-red-600 dark:text-red-400 min-w-[60px]">
                        Alfa
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredSummary.map((item, idx) => (
                      <tr
                        key={item.profileId}
                        className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 ${
                          idx % 2 === 1
                            ? "bg-slate-50/30 dark:bg-slate-900/30"
                            : ""
                        }`}
                      >
                        {/* Caang Info */}
                        <td className="p-3 sticky left-0 z-10 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800">
                              {item.photoUrl ? (
                                <Image
                                  src={item.photoUrl}
                                  alt={item.fullName}
                                  fill
                                  sizes="36px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs font-mono">
                                  {item.fullName[0]?.toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-dongker-ink dark:text-slate-100 truncate max-w-37.5">
                                {item.fullName}
                              </p>
                              <p className="font-mono text-[9px] text-slate-500 dark:text-slate-400 uppercase">
                                {item.nim}
                              </p>
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate max-w-37.5">
                                {item.studyProgramName}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Per Activity Attendance Status Cell */}
                        {initialActivitiesForSummary.map((act) => {
                          const status = item.attendances[
                            act.id
                          ] as StatusAbsensi | null;
                          const cfg =
                            status && STATUS_CONFIG[status]
                              ? STATUS_CONFIG[status]
                              : null;
                          const isOpen =
                            overrideCell?.profileId === item.profileId &&
                            overrideCell?.activityId === act.id;
                          return (
                            <td
                              key={act.id}
                              className="p-2 text-center border-r border-slate-200 dark:border-slate-800 relative"
                            >
                              <button
                                onClick={() =>
                                  setOverrideCell(
                                    isOpen
                                      ? null
                                      : {
                                          profileId: item.profileId,
                                          activityId: act.id,
                                        },
                                  )
                                }
                                className={`font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border transition-all w-full ${
                                  cfg
                                    ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                                } hover:opacity-80`}
                                title="Klik untuk mengoperasikan status absensi"
                              >
                                {cfg ? cfg.label : "Alfa"}
                              </button>

                              {/* Dropdown Menu Override */}
                              {isOpen && (
                                <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg rounded-lg overflow-hidden min-w-[95px]">
                                  {(
                                    [
                                      "hadir",
                                      "izin",
                                      "sakit",
                                      "alfa",
                                    ] as StatusAbsensi[]
                                  ).map((s) => (
                                    <button
                                      key={s}
                                      onClick={() =>
                                        handleAttendanceChange(
                                          item.profileId,
                                          act.id,
                                          s,
                                        )
                                      }
                                      className={`w-full text-left px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider hover:opacity-80 transition-colors ${STATUS_CONFIG[s].color} ${STATUS_CONFIG[s].bg}`}
                                    >
                                      {STATUS_CONFIG[s].label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </td>
                          );
                        })}

                        {/* Summary Totals */}
                        <td className="p-3 text-center font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {item.totals.hadir}
                        </td>
                        <td className="p-3 text-center font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          {item.totals.izin}
                        </td>
                        <td className="p-3 text-center font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          {item.totals.sakit}
                        </td>
                        <td className="p-3 text-center font-mono text-xs font-bold text-red-600 dark:text-red-400">
                          {item.totals.alfa}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Attendance Cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {filteredSummary.map((item) => (
                  <div
                    key={item.profileId}
                    className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-xs"
                  >
                    <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="relative w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        {item.photoUrl ? (
                          <Image
                            src={item.photoUrl}
                            alt={item.fullName}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-sm text-slate-500 font-mono">
                            {item.fullName[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-dongker-ink dark:text-slate-100">
                          {item.fullName}
                        </p>
                        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase">
                          {item.nim} · {item.studyProgramName}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 divide-x divide-slate-100 dark:divide-slate-800 text-center py-2">
                      {(
                        ["hadir", "izin", "sakit", "alfa"] as StatusAbsensi[]
                      ).map((s) => (
                        <div key={s} className="py-2">
                          <p
                            className={`font-bold text-base font-mono ${STATUS_CONFIG[s].color}`}
                          >
                            {item.totals[s]}
                          </p>
                          <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
                            {STATUS_CONFIG[s].label}
                          </p>
                        </div>
                      ))}
                    </div>

                    {initialActivitiesForSummary.length > 0 && (
                      <div className="border-t border-slate-100 dark:border-slate-800 p-3 space-y-2">
                        {initialActivitiesForSummary.map((act) => {
                          const status = item.attendances[
                            act.id
                          ] as StatusAbsensi | null;
                          const cfg =
                            status && STATUS_CONFIG[status]
                              ? STATUS_CONFIG[status]
                              : STATUS_CONFIG.alfa;
                          return (
                            <div
                              key={act.id}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="text-xs text-slate-700 dark:text-slate-300 line-clamp-1 flex-1">
                                {act.title}
                              </span>
                              <span
                                className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded-md border ${cfg.bg} ${cfg.color} ${cfg.border}`}
                              >
                                {cfg.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL: DETAIL KEGIATAN (View Only)
          ════════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={!!selectedActivity}
        onOpenChange={() => setSelectedActivity(null)}
      >
        <DialogContent className="max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 overflow-hidden shadow-lg">
          <div className="h-1 bg-linear-to-r from-dongker-surface via-[#3b82f6] to-pnp-orange" />
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-lg font-display font-semibold text-dongker-ink dark:text-slate-100">
              {selectedActivity?.title}
            </DialogTitle>
            <DialogDescription className="font-mono text-micro uppercase tracking-wider text-slate-500">
              Audience: {selectedActivity?.target_audience}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 pt-2 space-y-4">
            {selectedActivity?.banner_url && (
              <div className="relative w-full h-44 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                <Image
                  src={selectedActivity.banner_url}
                  alt={selectedActivity.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-mono text-[10px] uppercase text-slate-400 block">
                  Deskripsi
                </span>
                <p className="text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-line">
                  {selectedActivity?.description || "Tidak ada deskripsi."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="font-mono text-[10px] uppercase text-slate-400 block">
                    Waktu
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 font-mono mt-0.5">
                    {selectedActivity &&
                      formatIndoDate(selectedActivity.start_date)}
                    <br />
                    {selectedActivity &&
                      formatTimeRange(
                        selectedActivity.start_date,
                        selectedActivity.end_date,
                      )}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase text-slate-400 block">
                    Lokasi
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                    {selectedActivity?.location || "TBA"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              onClick={() => setSelectedActivity(null)}
              className="rounded-lg font-mono text-xs uppercase"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL: FORM TAMBAH / EDIT KEGIATAN
          ════════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) setIsFormOpen(false);
        }}
      >
        <DialogContent className="max-w-xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 overflow-hidden shadow-xl">
          <div className="h-1 bg-linear-to-r from-dongker-surface via-[#3b82f6] to-pnp-orange" />
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="font-mono text-sm uppercase tracking-wider text-dongker-ink dark:text-slate-100 flex items-center gap-2">
              <HugeiconsIcon
                icon={editingActivity ? Edit02Icon : Add01Icon}
                size={18}
                className="text-dongker-surface dark:text-blue-400"
              />
              {editingActivity ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}
            </DialogTitle>
            <DialogDescription className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
              {isRecruitmentMode
                ? "Target audiens: CAANG (otomatis)"
                : "Form pengelolaan kegiatan UKM Robotik"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit}>
            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  Judul <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Nama kegiatan..."
                  className="rounded-lg h-9 font-mono text-xs border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-pnp-orange/20"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  Deskripsi
                </Label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Deskripsi kegiatan (opsional)..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm text-dongker-ink dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-pnp-orange font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    Waktu Mulai <span className="text-red-500">*</span>
                  </Label>
                  <input
                    type="datetime-local"
                    value={form.start_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, start_date: e.target.value }))
                    }
                    className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 text-xs font-mono text-dongker-ink dark:text-slate-100 focus:outline-none focus:border-pnp-orange dark:scheme-dark"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    Waktu Berakhir <span className="text-red-500">*</span>
                  </Label>
                  <input
                    type="datetime-local"
                    value={form.end_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, end_date: e.target.value }))
                    }
                    className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 text-xs font-mono text-dongker-ink dark:text-slate-100 focus:outline-none focus:border-pnp-orange dark:scheme-dark"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  Lokasi
                </Label>
                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  placeholder="Gedung / ruangan / link online..."
                  className="rounded-lg h-9 font-mono text-xs border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-pnp-orange/20"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  Banner Kegiatan
                </Label>
                {bannerPreview && (
                  <div className="relative w-full h-36 border border-slate-200 dark:border-slate-700 overflow-hidden rounded-lg mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bannerPreview}
                      alt="Preview banner"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBannerPreview(null);
                        setBannerFile(null);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-slate-900/70 text-white rounded-full flex items-center justify-center hover:bg-slate-900"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={12} />
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-9 border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 font-mono text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 hover:border-pnp-orange hover:text-pnp-orange transition-colors rounded-lg"
                >
                  <HugeiconsIcon icon={Upload01Icon} size={14} />
                  {bannerPreview ? "Ganti Banner" : "Upload Banner (Maks. 5MB)"}
                </button>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
                className="rounded-lg font-mono text-xs uppercase h-9 px-4"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-dongker-surface hover:bg-dongker-hover dark:bg-blue-600 text-white font-mono text-xs uppercase tracking-wider h-9 px-6 disabled:opacity-50"
              >
                {isSubmitting
                  ? "Menyimpan..."
                  : editingActivity
                    ? "Perbarui Kegiatan"
                    : "Simpan Kegiatan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL: KONFIRMASI HAPUS (SOFT DELETE)
          ════════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={!!deletingActivity}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingActivity(null);
        }}
      >
        <DialogContent className="max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 overflow-hidden shadow-xl">
          <div className="h-1 bg-red-600" />
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="font-mono text-sm uppercase tracking-wider text-dongker-ink dark:text-slate-100 flex items-center gap-2">
              <HugeiconsIcon
                icon={Delete01Icon}
                size={16}
                className="text-red-600"
              />
              Hapus Kegiatan
            </DialogTitle>
            <DialogDescription className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
              Kegiatan akan dipindahkan ke Trash
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Apakah Anda yakin ingin menghapus kegiatan{" "}
              <span className="font-semibold text-dongker-ink dark:text-slate-100">
                &quot;{deletingActivity?.title}&quot;
              </span>
              ?
            </p>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              Kegiatan dapat dipulihkan kembali dari halaman Trash.
            </p>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="ghost"
              onClick={() => setDeletingActivity(null)}
              disabled={isDeleting}
              className="rounded-lg font-mono text-xs uppercase h-9 px-4"
            >
              Batal
            </Button>
            <Button
              onClick={handleSoftDelete}
              disabled={isDeleting}
              className="rounded-lg bg-red-600 hover:bg-red-700 text-white font-mono text-xs uppercase tracking-wider h-9 px-4 disabled:opacity-50"
            >
              {isDeleting ? "Menghapus..." : "Pindahkan ke Trash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Komdis Dialogs (Membership Mode) ──────────────────────────────── */}
      {isCreateModalOpen && (
        <CreateKomdisActivityDialog
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => fetchActivities()}
        />
      )}

      {editingKomdisActivity && (
        <EditKomdisActivityDialog
          activity={editingKomdisActivity}
          isOpen={!!editingKomdisActivity}
          onClose={() => setEditingKomdisActivity(null)}
          onSuccess={() => fetchActivities()}
        />
      )}

      {/* Overlay to close attendance dropdown */}
      {overrideCell && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOverrideCell(null)}
        />
      )}

      {isPending && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white font-mono text-xs px-3 py-2 rounded-lg border border-slate-700 shadow-lg">
          Memperbarui...
        </div>
      )}
    </div>
  );
}
