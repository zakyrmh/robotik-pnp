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
    const base =
      "font-semibold text-micro uppercase rounded-full px-3 py-0.5 border";
    if (st === "ongoing") {
      return (
        <Badge
          className={`${base} bg-accent text-accent-foreground border-accent/40 animate-pulse`}
        >
          Berlangsung
        </Badge>
      );
    } else if (st === "upcoming") {
      return (
        <Badge
          className={`${base} bg-primary-soft text-primary border-primary/15`}
        >
          Akan Datang
        </Badge>
      );
    }
    return (
      <Badge className={`${base} bg-muted text-muted-foreground border-border`}>
        Selesai
      </Badge>
    );
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
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="border border-border bg-card rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-md bg-primary-soft text-primary shrink-0">
              <HugeiconsIcon
                icon={isRecruitmentMode ? CalendarAdd01Icon : Calendar03Icon}
                size={20}
              />
            </div>
            <div>
              <h1 className="font-display font-semibold tracking-tight text-lg sm:text-xl text-foreground">
                {isRecruitmentMode
                  ? "Kegiatan & Absensi Caang"
                  : "Kegiatan UKM Robotik"}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isRecruitmentMode
                  ? "Manajemen kegiatan dan rekap absensi Calon Anggota UKM Robotik PNP"
                  : "Agenda pelatihan, rapat, dan workshop teknologi robotik PNP"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {isRecruitmentMode ? (
              <>
                {(activeRole === "admin-or" ||
                  activeRole === "super-admin") && (
                  <Button
                    variant="outline"
                    onClick={() => router.push("/kegiatan-absensi-caang/trash")}
                    className="rounded-md h-9 px-4 font-medium text-sm border-primary text-primary hover:bg-primary-soft"
                  >
                    <HugeiconsIcon icon={Archive01Icon} size={15} />
                    Trash
                  </Button>
                )}
                {(activeRole === "admin-or" ||
                  activeRole === "super-admin") && (
                  <Button
                    variant="outline"
                    onClick={() => router.push("/kegiatan-absensi-caang/scan")}
                    className="rounded-md h-9 px-4 font-medium text-sm border-primary text-primary hover:bg-primary-soft"
                  >
                    <HugeiconsIcon icon={QrCode01Icon} size={15} />
                    Scan QR
                  </Button>
                )}
                {(activeRole === "admin-or" ||
                  activeRole === "super-admin") && (
                  <Button
                    onClick={openAddForm}
                    className="rounded-md h-9 px-4 font-medium text-sm bg-primary text-primary-foreground hover:bg-primary-hover"
                  >
                    <HugeiconsIcon icon={Add01Icon} size={15} />
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
                    className="rounded-md h-9 px-4 font-medium text-sm border-primary text-primary hover:bg-primary-soft w-full sm:w-auto"
                  >
                    <HugeiconsIcon icon={Delete01Icon} size={15} />
                    Sampah
                  </Button>
                )}
                {(activeRole === "admin-komdis" ||
                  activeRole === "super-admin") && (
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="rounded-md h-9 px-4 font-medium text-sm bg-primary text-primary-foreground hover:bg-primary-hover w-full sm:w-auto"
                  >
                    <HugeiconsIcon icon={CalendarAdd01Icon} size={15} />
                    Buat Kegiatan Komdis
                  </Button>
                )}
              </>
            )}
            <Badge className="bg-accent text-accent-foreground border-accent/40 rounded-full px-3 py-1 text-micro font-semibold uppercase">
              Total: {activities.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* ── Recruitment Mode Tabs Switcher ──────────────────────────────── */}
      {isRecruitmentMode && (
        <div className="flex border-b border-border">
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
                className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <HugeiconsIcon icon={tab.icon} size={16} />
                {tab.label}
                <Badge className="rounded-full px-2 py-0 text-[10px] bg-muted text-muted-foreground border-border font-semibold">
                  {tab.count}
                </Badge>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Stats Cards Grid ────────────────────────────────────────────── */}
      {activeTab === "kegiatan" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1: Ringkasan Kegiatan */}
          <div className="border border-border bg-card rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Ringkasan Kegiatan
                </h3>
                <span className="bg-primary-soft text-primary rounded-full px-2.5 py-0.5 text-micro font-semibold uppercase">
                  Total {stats.total}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="space-y-1">
                  <span className="text-micro uppercase tracking-wide text-muted-foreground block">
                    Berlangsung
                  </span>
                  <span className="font-display text-2xl font-semibold text-accent-strong">
                    {stats.ongoing}
                  </span>
                </div>
                <div className="space-y-1 border-x border-border">
                  <span className="text-micro uppercase tracking-wide text-muted-foreground block">
                    Akan Datang
                  </span>
                  <span className="font-display text-2xl font-semibold text-primary">
                    {stats.upcoming}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-micro uppercase tracking-wide text-muted-foreground block">
                    Selesai
                  </span>
                  <span className="font-display text-2xl font-semibold text-foreground">
                    {stats.completed}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                {stats.ongoing > 0 && (
                  <div
                    className="h-full bg-accent-strong"
                    style={{
                      width: `${stats.total > 0 ? (stats.ongoing / stats.total) * 100 : 0}%`,
                    }}
                  />
                )}
                {stats.upcoming > 0 && (
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${stats.total > 0 ? (stats.upcoming / stats.total) * 100 : 0}%`,
                    }}
                  />
                )}
                {stats.completed > 0 && (
                  <div
                    className="h-full bg-muted-foreground/30"
                    style={{
                      width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`,
                    }}
                  />
                )}
              </div>
              <div className="flex justify-between text-micro text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent-strong" />
                  Berlangsung
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Akan Datang
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  Selesai
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Kegiatan Berikutnya */}
          <div className="border border-border bg-card rounded-lg p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Kegiatan Berikutnya
              </h3>
              {stats.next ? (
                <div className="space-y-1.5">
                  <span className="font-display text-base font-medium text-foreground block line-clamp-1">
                    {stats.next.title}
                  </span>
                  <span className="text-sm text-muted-foreground block">
                    {formatIndoDate(stats.next.start_date)}
                  </span>
                  <span className="text-micro text-accent-strong font-semibold block uppercase tracking-wide">
                    {stats.next.location || "TBA"}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  Tidak ada kegiatan mendatang.
                </p>
              )}
            </div>
            <div className="pt-3 mt-3 border-t border-dashed border-border text-micro text-muted-foreground uppercase tracking-wider">
              Agenda Terdekat
            </div>
          </div>

          {/* Card 3: Akses & Informasi */}
          <div className="border border-border bg-card rounded-lg p-5 sm:col-span-2 lg:col-span-1 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Akses &amp; Informasi
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between border-b border-border pb-1.5">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-semibold text-foreground uppercase">
                    {activeRole || "GUEST"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-1.5">
                  <span className="text-muted-foreground">Target</span>
                  <span className="font-semibold text-primary uppercase">
                    {isRecruitmentMode
                      ? "Khusus Caang"
                      : user?.role === "caang"
                        ? "Khusus Caang"
                        : "Anggota"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Lokasi Unik</span>
                  <span className="font-semibold text-foreground">
                    {stats.uniqueLocations}
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-dashed border-border text-micro text-muted-foreground uppercase tracking-wider flex justify-between">
              <span>Status</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Online
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Filter Controls ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder={
              activeTab === "kegiatan"
                ? "Cari kegiatan / lokasi..."
                : "Cari nama / NIM Caang..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full bg-card pl-10 rounded-md border-border text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
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
              className="h-10 w-full bg-card px-3 rounded-md border border-border text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Semua Status</option>
              <option value="upcoming">Akan Datang</option>
              <option value="ongoing">Sedang Berlangsung</option>
              <option value="completed">Selesai</option>
            </select>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TAB: DAFTAR KEGIATAN
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "kegiatan" && (
        <>
          {isLoading ? (
            <div className="border border-border bg-card p-8 sm:p-12 text-center rounded-lg animate-pulse space-y-4">
              <div className="h-6 bg-muted w-1/4 mx-auto rounded-md" />
              <div className="h-4 bg-muted w-1/2 mx-auto rounded-md" />
              <div className="space-y-2 pt-6">
                <div className="h-12 bg-muted/50 w-full rounded-md" />
                <div className="h-12 bg-muted/50 w-full rounded-md" />
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border border-destructive/30 rounded-lg bg-destructive/5 p-6 sm:p-8 max-w-xl mx-auto">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-3 font-bold">
                !
              </div>
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="border border-border bg-card p-8 sm:p-12 text-center rounded-lg">
              <HugeiconsIcon
                icon={Calendar03Icon}
                size={42}
                className="mx-auto text-muted-foreground mb-3"
              />
              <p className="text-sm text-muted-foreground">
                {search
                  ? "Tidak ada kegiatan yang cocok."
                  : 'Belum ada kegiatan. Klik "Tambah Kegiatan" untuk memulai.'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="block lg:hidden space-y-3 sm:space-y-4">
                {filteredActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="border border-border bg-card rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative h-11 w-16 rounded-md border border-border bg-muted overflow-hidden flex items-center justify-center shrink-0">
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
                              className="text-muted-foreground"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-micro text-muted-foreground block">
                            Nama Kegiatan
                          </span>
                          <span className="text-sm font-display font-medium text-foreground truncate block">
                            {activity.title}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">{getStatusBadge(activity)}</div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-dashed border-border">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-micro text-muted-foreground block">
                            Tanggal
                          </span>
                          <span className="text-sm text-foreground font-medium">
                            {formatIndoDate(activity.start_date)}
                          </span>
                        </div>
                        <div>
                          <span className="text-micro text-muted-foreground block">
                            Waktu
                          </span>
                          <span className="text-sm text-foreground font-mono">
                            {formatIndoTime(activity.start_date)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-micro text-muted-foreground block">
                          Lokasi
                        </span>
                        <span className="text-sm text-foreground">
                          {activity.location || "TBA"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
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
                        className="rounded-md border-border text-foreground font-medium text-xs px-3 h-8 hover:bg-muted"
                      >
                        <HugeiconsIcon icon={EyeIcon} size={14} />
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
                            className="rounded-md border-primary text-primary font-medium text-xs px-3 h-8 hover:bg-primary-soft"
                          >
                            <HugeiconsIcon icon={Edit02Icon} size={14} />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingActivity(activity)}
                            className="rounded-md border-destructive/40 text-destructive font-medium text-xs px-3 h-8 hover:bg-destructive/10"
                          >
                            <HugeiconsIcon icon={Delete01Icon} size={14} />
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
                          className="rounded-md bg-primary text-primary-foreground hover:bg-primary-hover font-medium text-xs px-3 h-8"
                        >
                          Absen
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto border border-border bg-card rounded-lg">
                <table className="w-full min-w-225 border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <th className="px-4 py-3 w-24 text-center text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                        Banner
                      </th>
                      <th className="px-4 py-3 text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                        Nama Kegiatan
                      </th>
                      <th className="px-4 py-3 text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                        Tanggal &amp; Waktu
                      </th>
                      <th className="px-4 py-3 text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                        Lokasi
                      </th>
                      <th className="px-4 py-3 w-32 text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 w-44 text-center text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredActivities.map((activity) => (
                      <tr
                        key={activity.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3 align-middle text-center">
                          <div className="relative h-11 w-16 mx-auto rounded-md border border-border bg-muted overflow-hidden flex items-center justify-center">
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
                                className="text-muted-foreground"
                              />
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div
                            className="font-display font-medium text-foreground text-sm truncate max-w-70"
                            title={activity.title}
                          >
                            {activity.title}
                          </div>
                          <div className="text-micro text-muted-foreground mt-0.5 uppercase tracking-wide">
                            Audience: {activity.target_audience}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div className="text-foreground text-xs font-medium">
                            {formatIndoDate(activity.start_date)}
                          </div>
                          <div className="text-micro text-muted-foreground mt-0.5 font-mono">
                            {formatTimeRange(
                              activity.start_date,
                              activity.end_date,
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div
                            className="text-foreground text-xs truncate max-w-55"
                            title={activity.location || "TBA"}
                          >
                            {activity.location || "TBA"}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          {getStatusBadge(activity)}
                        </td>

                        <td className="px-4 py-3 align-middle text-center">
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
                              className="rounded-md border-border text-foreground font-medium text-xs h-8 px-2.5 hover:bg-muted"
                            >
                              <HugeiconsIcon icon={EyeIcon} size={14} />
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
                                  className="h-8 w-8 rounded-md border-primary text-primary hover:bg-primary-soft"
                                  title="Edit"
                                >
                                  <HugeiconsIcon icon={Edit02Icon} size={14} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setDeletingActivity(activity)}
                                  className="h-8 w-8 rounded-md border-destructive/40 text-destructive hover:bg-destructive/10"
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
                                className="rounded-md bg-primary text-primary-foreground hover:bg-primary-hover font-medium text-xs h-8 px-2.5"
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

      {/* ════════════════════════════════════════════════════════════════════
          TAB: REKAP ABSENSI CAANG (Oprec / Caang Mode)
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "absensi" && isRecruitmentMode && (
        <>
          {filteredSummary.length === 0 ? (
            <div className="border border-border bg-card p-12 text-center rounded-lg">
              <HugeiconsIcon
                icon={UserGroupIcon}
                size={40}
                className="mx-auto text-muted-foreground mb-3"
              />
              <p className="text-sm text-muted-foreground">
                {search
                  ? "Tidak ada Caang yang cocok dengan pencarian."
                  : "Belum ada Caang terverifikasi yang terdaftar."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Attendance Matrix Table */}
              <div className="hidden lg:block overflow-x-auto border border-border bg-card rounded-lg">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <th className="px-3 py-3 text-micro font-semibold uppercase tracking-wide text-muted-foreground min-w-55 sticky left-0 bg-surface z-10 border-r border-border">
                        Caang
                      </th>
                      {initialActivitiesForSummary.map((act) => (
                        <th
                          key={act.id}
                          className="px-3 py-3 text-micro font-semibold uppercase tracking-wide text-muted-foreground min-w-27.5 text-center border-r border-border"
                        >
                          <div className="max-w-25 mx-auto">
                            <span className="line-clamp-2 text-[10px] leading-tight block">
                              {act.title}
                            </span>
                            <span className="text-muted-foreground text-[9px] mt-0.5 block">
                              {formatDate(act.start_date)}
                            </span>
                          </div>
                        </th>
                      ))}
                      <th className="px-3 py-3 text-micro font-semibold uppercase tracking-wide text-center text-emerald-600 dark:text-emerald-400 min-w-15">
                        Hadir
                      </th>
                      <th className="px-3 py-3 text-micro font-semibold uppercase tracking-wide text-center text-amber-600 dark:text-amber-400 min-w-15">
                        Izin
                      </th>
                      <th className="px-3 py-3 text-micro font-semibold uppercase tracking-wide text-center text-blue-600 dark:text-blue-400 min-w-15">
                        Sakit
                      </th>
                      <th className="px-3 py-3 text-micro font-semibold uppercase tracking-wide text-center text-red-600 dark:text-red-400 min-w-15">
                        Alfa
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredSummary.map((item, idx) => (
                      <tr
                        key={item.profileId}
                        className={`hover:bg-muted/50 transition-colors ${
                          idx % 2 === 1 ? "bg-surface/50" : ""
                        }`}
                      >
                        {/* Caang Info */}
                        <td className="px-3 py-3 sticky left-0 z-10 border-r border-border bg-card">
                          <div className="flex items-center gap-3 min-w-50">
                            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-border shrink-0 bg-muted">
                              {item.photoUrl ? (
                                <Image
                                  src={item.photoUrl}
                                  alt={item.fullName}
                                  fill
                                  sizes="36px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold text-xs">
                                  {item.fullName[0]?.toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-foreground truncate max-w-37.5">
                                {item.fullName}
                              </p>
                              <p className="text-micro text-muted-foreground">
                                {item.nim}
                              </p>
                              <p className="text-[9px] text-muted-foreground truncate max-w-37.5">
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
                              className="px-2 py-2 text-center border-r border-border relative"
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
                                className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-md border transition-all w-full ${
                                  cfg
                                    ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                                    : "bg-muted text-muted-foreground border-border"
                                } hover:opacity-80`}
                                title="Klik untuk mengubah status absensi"
                              >
                                {cfg ? cfg.label : "Alfa"}
                              </button>

                              {/* Dropdown Menu Override */}
                              {isOpen && (
                                <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-1 bg-card border border-border shadow-soft rounded-md overflow-hidden min-w-23.75">
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
                                      className={`w-full text-left px-3 py-1.5 text-[10px] uppercase tracking-wide hover:opacity-80 transition-colors ${STATUS_CONFIG[s].color} ${STATUS_CONFIG[s].bg}`}
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
                        <td className="px-3 py-3 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {item.totals.hadir}
                        </td>
                        <td className="px-3 py-3 text-center text-xs font-semibold text-amber-600 dark:text-amber-400">
                          {item.totals.izin}
                        </td>
                        <td className="px-3 py-3 text-center text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {item.totals.sakit}
                        </td>
                        <td className="px-3 py-3 text-center text-xs font-semibold text-red-600 dark:text-red-400">
                          {item.totals.alfa}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Attendance Cards */}
              <div className="flex flex-col gap-3 lg:hidden">
                {filteredSummary.map((item) => (
                  <div
                    key={item.profileId}
                    className="border border-border bg-card rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center gap-3 p-4 border-b border-border">
                      <div className="relative w-10 h-10 rounded-full border border-border shrink-0 bg-muted overflow-hidden">
                        {item.photoUrl ? (
                          <Image
                            src={item.photoUrl}
                            alt={item.fullName}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-sm text-muted-foreground">
                            {item.fullName[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          {item.fullName}
                        </p>
                        <p className="text-micro text-muted-foreground">
                          {item.nim} · {item.studyProgramName}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 divide-x divide-border text-center py-2">
                      {(
                        ["hadir", "izin", "sakit", "alfa"] as StatusAbsensi[]
                      ).map((s) => (
                        <div key={s} className="py-2">
                          <p
                            className={`font-bold text-base font-mono ${STATUS_CONFIG[s].color}`}
                          >
                            {item.totals[s]}
                          </p>
                          <p className="text-micro text-muted-foreground mt-0.5">
                            {STATUS_CONFIG[s].label}
                          </p>
                        </div>
                      ))}
                    </div>

                    {initialActivitiesForSummary.length > 0 && (
                      <div className="border-t border-border p-3 space-y-2">
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
                              <span className="text-xs text-foreground line-clamp-1 flex-1">
                                {act.title}
                              </span>
                              <span
                                className={`text-[9px] uppercase px-2 py-0.5 rounded-md border ${cfg.bg} ${cfg.color} ${cfg.border}`}
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

      {/* ════════════════════════════════════════════════════════════════════
          MODAL: DETAIL KEGIATAN (View Only)
          ════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={!!selectedActivity}
        onOpenChange={() => setSelectedActivity(null)}
      >
        <DialogContent className="max-w-lg rounded-lg border border-border bg-card p-0 overflow-hidden shadow-soft">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-lg font-display font-semibold text-foreground">
              {selectedActivity?.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Audience: {selectedActivity?.target_audience}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pt-2 space-y-4">
            {selectedActivity?.banner_url && (
              <div className="relative w-full h-44 rounded-md overflow-hidden border border-border bg-muted">
                <Image
                  src={selectedActivity.banner_url}
                  alt={selectedActivity.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-micro text-muted-foreground uppercase tracking-wide block">
                  Deskripsi
                </span>
                <p className="text-foreground mt-1 whitespace-pre-line">
                  {selectedActivity?.description || "Tidak ada deskripsi."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-micro text-muted-foreground uppercase tracking-wide block">
                    Waktu
                  </span>
                  <p className="text-foreground mt-0.5">
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
                  <span className="text-micro text-muted-foreground uppercase tracking-wide block">
                    Lokasi
                  </span>
                  <p className="text-foreground mt-0.5">
                    {selectedActivity?.location || "TBA"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-4 bg-surface border-t border-border">
            <Button
              variant="outline"
              onClick={() => setSelectedActivity(null)}
              className="rounded-md font-medium text-sm border-border text-foreground hover:bg-muted"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          MODAL: FORM TAMBAH / EDIT KEGIATAN
          ════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) setIsFormOpen(false);
        }}
      >
        <DialogContent className="max-w-xl rounded-lg border border-border bg-card p-0 overflow-hidden shadow-soft">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
              <HugeiconsIcon
                icon={editingActivity ? Edit02Icon : Add01Icon}
                size={18}
                className="text-primary"
              />
              {editingActivity ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {isRecruitmentMode
                ? "Target audiens: Caang (otomatis)"
                : "Form pengelolaan kegiatan UKM Robotik"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit}>
            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  Judul <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Nama kegiatan..."
                  className="rounded-md h-9 bg-card border-border text-sm focus-visible:border-primary focus-visible:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  Deskripsi
                </Label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Deskripsi kegiatan (opsional)..."
                  rows={3}
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-foreground">
                    Waktu Mulai <span className="text-destructive">*</span>
                  </Label>
                  <input
                    type="datetime-local"
                    value={form.start_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, start_date: e.target.value }))
                    }
                    className="w-full h-9 rounded-md border border-border bg-card px-3 text-sm font-mono text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-foreground">
                    Waktu Berakhir <span className="text-destructive">*</span>
                  </Label>
                  <input
                    type="datetime-local"
                    value={form.end_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, end_date: e.target.value }))
                    }
                    className="w-full h-9 rounded-md border border-border bg-card px-3 text-sm font-mono text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  Lokasi
                </Label>
                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  placeholder="Gedung / ruangan / link online..."
                  className="rounded-md h-9 bg-card border-border text-sm focus-visible:border-primary focus-visible:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  Banner Kegiatan
                </Label>
                {bannerPreview && (
                  <div className="relative w-full h-36 border border-border overflow-hidden rounded-md mb-2">
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
                      className="absolute top-2 right-2 w-6 h-6 bg-foreground/80 text-background rounded-full flex items-center justify-center hover:bg-foreground"
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
                  className="w-full h-9 border border-dashed border-border text-muted-foreground text-sm font-medium flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors rounded-md"
                >
                  <HugeiconsIcon icon={Upload01Icon} size={14} />
                  {bannerPreview ? "Ganti Banner" : "Upload Banner (Maks. 5MB)"}
                </button>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
                className="rounded-md font-medium text-sm h-9 px-4 text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-sm h-9 px-6 disabled:opacity-50"
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

      {/* ════════════════════════════════════════════════════════════════════
          MODAL: KONFIRMASI HAPUS (SOFT DELETE)
          ════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={!!deletingActivity}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingActivity(null);
        }}
      >
        <DialogContent className="max-w-sm rounded-lg border border-border bg-card p-0 overflow-hidden shadow-soft">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
              <HugeiconsIcon
                icon={Delete01Icon}
                size={16}
                className="text-destructive"
              />
              Hapus Kegiatan
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Kegiatan akan dipindahkan ke Trash
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5">
            <p className="text-sm text-foreground">
              Apakah Anda yakin ingin menghapus kegiatan{" "}
              <span className="font-semibold text-foreground">
                &quot;{deletingActivity?.title}&quot;
              </span>
              ?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Kegiatan dapat dipulihkan kembali dari halaman Trash.
            </p>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => setDeletingActivity(null)}
              disabled={isDeleting}
              className="rounded-md font-medium text-sm h-9 px-4 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Batal
            </Button>
            <Button
              onClick={handleSoftDelete}
              disabled={isDeleting}
              className="rounded-md bg-destructive hover:bg-destructive/90 text-white font-medium text-sm h-9 px-4 disabled:opacity-50"
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
        <div className="fixed bottom-4 right-4 z-50 bg-foreground text-background text-xs font-medium px-3 py-2 rounded-md shadow-soft">
          Memperbarui...
        </div>
      )}
    </div>
  );
}
