"use client";

import { useState, useMemo, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Clock01Icon,
  Location01Icon,
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
} from "@hugeicons/core-free-icons";
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
import { Label } from "@/components/ui/label";
import {
  createActivity,
  updateActivity,
  softDeleteActivity,
  upsertAttendanceStatus,
  type ActivityItem,
  type AttendanceSummaryItem,
} from "@/lib/actions/activities";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActivityForSummary {
  id: string;
  title: string;
  start_date: string;
}

interface KegiatanAbsensiClientProps {
  initialActivities: ActivityItem[];
  initialActivitiesForSummary: ActivityForSummary[];
  initialSummary: AttendanceSummaryItem[];
}

type TabType = "kegiatan" | "absensi";
type StatusAbsensi = "hadir" | "izin" | "sakit" | "alfa";

const STATUS_CONFIG: Record<
  StatusAbsensi,
  { label: string; color: string; bg: string; border: string }
> = {
  hadir: {
    label: "Hadir",
    color: "text-[#10b981]",
    bg: "bg-[#10b981]/15",
    border: "border-[#10b981]/30",
  },
  izin: {
    label: "Izin",
    color: "text-amber-500",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
  },
  sakit: {
    label: "Sakit",
    color: "text-[#1c69d4]",
    bg: "bg-[#1c69d4]/15",
    border: "border-[#1c69d4]/30",
  },
  alfa: {
    label: "Alfa",
    color: "text-[#e22718]",
    bg: "bg-[#e22718]/15",
    border: "border-[#e22718]/30",
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

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })} ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`;
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

// ─── Empty Form State ─────────────────────────────────────────────────────────

const emptyForm = {
  title: "",
  description: "",
  start_date: "",
  end_date: "",
  location: "",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function KegiatanAbsensiClient({
  initialActivities,
  initialActivitiesForSummary,
  initialSummary,
}: KegiatanAbsensiClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ── Tab State ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabType>("kegiatan");

  // ── Search State ───────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");

  // ── Activity Form Modal ────────────────────────────────────────────────────
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(
    null,
  );
  const [form, setForm] = useState(emptyForm);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Delete Modal ───────────────────────────────────────────────────────────
  const [deletingActivity, setDeletingActivity] = useState<ActivityItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Attendance Override Popover ────────────────────────────────────────────
  const [overrideCell, setOverrideCell] = useState<{
    profileId: string;
    activityId: string;
  } | null>(null);

  // ── Filtered Activities ────────────────────────────────────────────────────
  const filteredActivities = useMemo(() => {
    if (!search.trim()) return initialActivities;
    const q = search.toLowerCase();
    return initialActivities.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.location ?? "").toLowerCase().includes(q),
    );
  }, [initialActivities, search]);

  // ── Filtered Summary ───────────────────────────────────────────────────────
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

  // ── Open Add Form ──────────────────────────────────────────────────────────
  const openAddForm = () => {
    setEditingActivity(null);
    setForm(emptyForm);
    setBannerFile(null);
    setBannerPreview(null);
    setIsFormOpen(true);
  };

  // ── Open Edit Form ─────────────────────────────────────────────────────────
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

  // ── Handle Banner File ─────────────────────────────────────────────────────
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setBannerPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // ── Submit Form ────────────────────────────────────────────────────────────
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
        startTransition(() => router.refresh());
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

  // ── Soft Delete ────────────────────────────────────────────────────────────
  const handleSoftDelete = async () => {
    if (!deletingActivity) return;
    setIsDeleting(true);
    const toastId = toast.loading("Memindahkan kegiatan ke Trash...");

    try {
      const res = await softDeleteActivity(deletingActivity.id);
      toast.dismiss(toastId);
      if (res.success) {
        toast.success(res.message);
        setDeletingActivity(null);
        startTransition(() => router.refresh());
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.dismiss(toastId);
      toast.error("Terjadi kesalahan koneksi.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Attendance Override ────────────────────────────────────────────────────
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

  // ── Status Badges ──────────────────────────────────────────────────────────
  const getActivityStatusBadge = (activity: ActivityItem) => {
    const st = getActivityStatus(activity);
    if (st === "ongoing")
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider border rounded-none bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30">
          <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-ping inline-block" />
          BERLANGSUNG
        </span>
      );
    if (st === "upcoming")
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider border rounded-none bg-[#1c69d4]/15 text-[#1c69d4] border-[#1c69d4]/30">
          MENDATANG
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider border rounded-none bg-zinc-500/15 text-zinc-500 border-zinc-500/30">
        SELESAI
      </span>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-1 lg:px-4">
      {/* ── Header Banner ──────────────────────────────────────────────────── */}
      <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 rounded-none shadow-sm overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-50 font-sans flex items-center gap-2">
              <HugeiconsIcon
                icon={CalendarAdd01Icon}
                size={22}
                className="text-[#1c69d4]"
              />
              Kegiatan &amp; Absensi Caang
            </h1>
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-500 mt-1">
              Manajemen Kegiatan dan Rekap Absensi UKM Robotik PNP
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => router.push("/kegiatan-absensi-caang/trash")}
              className="rounded-none border border-zinc-200 dark:border-zinc-800 font-mono text-xs uppercase tracking-wider px-4 py-2 h-9 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              <HugeiconsIcon
                icon={Archive01Icon}
                size={16}
                className="mr-2 text-zinc-500"
              />
              Trash
            </Button>
            <Button
              onClick={openAddForm}
              className="rounded-none bg-[#1c69d4] hover:bg-[#0066b1] text-white font-mono text-xs uppercase tracking-wider px-4 py-2 h-9 shadow-[0_0_8px_rgba(28,105,212,0.25)]"
            >
              <HugeiconsIcon icon={Add01Icon} size={16} className="mr-2" />
              Tambah Kegiatan
            </Button>
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        {(
          [
            {
              id: "kegiatan",
              label: "Daftar Kegiatan",
              icon: Calendar03Icon,
              count: initialActivities.length,
            },
            {
              id: "absensi",
              label: "Rekap Absensi",
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
              className={`relative flex items-center gap-2 px-5 py-3 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                isActive
                  ? "text-[#1c69d4] dark:text-[#0066b1]"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <HugeiconsIcon icon={tab.icon} size={14} />
              {tab.label}
              <Badge className="rounded-none font-mono text-[9px] px-1.5 py-0 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                {tab.count}
              </Badge>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1c69d4]" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Search Bar ─────────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <HugeiconsIcon
          icon={Search01Icon}
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        />
        <Input
          placeholder={
            activeTab === "kegiatan"
              ? "Cari judul / lokasi..."
              : "Cari nama / NIM..."
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-10 rounded-none border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 font-mono text-xs uppercase tracking-wider focus-visible:ring-1 focus-visible:ring-zinc-400"
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TAB: DAFTAR KEGIATAN
          ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "kegiatan" && (
        <>
          {filteredActivities.length === 0 ? (
            <div className="border border-dashed border-zinc-200 dark:border-zinc-800 p-16 text-center rounded-none">
              <HugeiconsIcon
                icon={Calendar03Icon}
                size={36}
                className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3"
              />
              <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                {search
                  ? "Tidak ada kegiatan yang cocok."
                  : 'Belum ada kegiatan. Klik "+ Tambah Kegiatan" untuk memulai.'}
              </p>
            </div>
          ) : (
            <>
              {/* ── Desktop Table ───────────────────────────────────────────── */}
              <div className="hidden md:block overflow-x-auto border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-none">
                <table className="w-full min-w-[800px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
                      <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500 w-[35%]">
                        Kegiatan
                      </th>
                      <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                        Waktu
                      </th>
                      <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                        Lokasi
                      </th>
                      <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                        Status
                      </th>
                      <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500 text-right">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivities.map((activity, idx) => (
                      <tr
                        key={activity.id}
                        className={`border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/30 transition-colors ${
                          idx % 2 === 1
                            ? "bg-zinc-50/30 dark:bg-zinc-950/30"
                            : ""
                        }`}
                      >
                        {/* Banner + Title */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-14 h-10 rounded-none overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-100 dark:bg-zinc-900">
                              {activity.banner_url ? (
                                <Image
                                  src={activity.banner_url}
                                  alt={activity.title}
                                  width={56}
                                  height={56}
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <HugeiconsIcon
                                    icon={Calendar03Icon}
                                    size={18}
                                    className="text-zinc-400"
                                  />
                                </div>
                              )}
                            </div>
                            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2 max-w-[200px]">
                              {activity.title}
                            </span>
                          </div>
                        </td>
                        {/* Waktu */}
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                              <HugeiconsIcon
                                icon={Calendar03Icon}
                                size={12}
                                className="text-[#1c69d4] shrink-0"
                              />
                              <span className="font-mono text-[11px]">
                                {formatDate(activity.start_date)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                              <HugeiconsIcon
                                icon={Clock01Icon}
                                size={12}
                                className="text-zinc-400 shrink-0"
                              />
                              <span className="font-mono text-[10px]">
                                {new Date(
                                  activity.start_date,
                                ).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                –{" "}
                                {new Date(activity.end_date).toLocaleTimeString(
                                  "id-ID",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}{" "}
                                WIB
                              </span>
                            </div>
                          </div>
                        </td>
                        {/* Lokasi */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                            <HugeiconsIcon
                              icon={Location01Icon}
                              size={12}
                              className="text-zinc-400 shrink-0"
                            />
                            <span className="line-clamp-1 max-w-[150px]">
                              {activity.location || "—"}
                            </span>
                          </div>
                        </td>
                        {/* Status */}
                        <td className="p-4">
                          {getActivityStatusBadge(activity)}
                        </td>
                        {/* Aksi */}
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditForm(activity)}
                              className="h-8 w-8 rounded-none border border-zinc-200 dark:border-zinc-800 hover:border-[#1c69d4] hover:text-[#1c69d4] transition-colors"
                              title="Edit"
                            >
                              <HugeiconsIcon icon={Edit02Icon} size={14} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeletingActivity(activity)}
                              className="h-8 w-8 rounded-none border border-zinc-200 dark:border-zinc-800 hover:border-[#e22718] hover:text-[#e22718] transition-colors"
                              title="Hapus"
                            >
                              <HugeiconsIcon icon={Delete01Icon} size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile Cards ─────────────────────────────────────────────── */}
              <div className="flex flex-col gap-3 md:hidden">
                {filteredActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-none overflow-hidden"
                  >
                    {activity.banner_url && (
                      <div className="relative w-full h-32 bg-zinc-100 dark:bg-zinc-900">
                        <Image
                          src={activity.banner_url}
                          alt={activity.title}
                          width={800}
                          height={600}
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 leading-tight">
                          {activity.title}
                        </h3>
                        {getActivityStatusBadge(activity)}
                      </div>
                      <div className="space-y-1.5 text-xs text-zinc-500">
                        <div className="flex items-center gap-2">
                          <HugeiconsIcon
                            icon={Calendar03Icon}
                            size={12}
                            className="text-[#1c69d4] shrink-0"
                          />
                          <span className="font-mono">
                            {formatDate(activity.start_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <HugeiconsIcon
                            icon={Clock01Icon}
                            size={12}
                            className="text-zinc-400 shrink-0"
                          />
                          <span className="font-mono text-[10px]">
                            {new Date(activity.start_date).toLocaleTimeString(
                              "id-ID",
                              { hour: "2-digit", minute: "2-digit" },
                            )}{" "}
                            –{" "}
                            {new Date(activity.end_date).toLocaleTimeString(
                              "id-ID",
                              { hour: "2-digit", minute: "2-digit" },
                            )}{" "}
                            WIB
                          </span>
                        </div>
                        {activity.location && (
                          <div className="flex items-center gap-2">
                            <HugeiconsIcon
                              icon={Location01Icon}
                              size={12}
                              className="text-zinc-400 shrink-0"
                            />
                            <span>{activity.location}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditForm(activity)}
                          className="flex-1 rounded-none border-zinc-200 dark:border-zinc-800 font-mono text-[10px] uppercase h-8"
                        >
                          <HugeiconsIcon
                            icon={Edit02Icon}
                            size={12}
                            className="mr-1.5"
                          />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletingActivity(activity)}
                          className="flex-1 rounded-none border-zinc-200 dark:border-zinc-800 font-mono text-[10px] uppercase h-8 hover:border-[#e22718] hover:text-[#e22718]"
                        >
                          <HugeiconsIcon
                            icon={Delete01Icon}
                            size={12}
                            className="mr-1.5"
                          />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB: REKAP ABSENSI
          ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "absensi" && (
        <>
          {filteredSummary.length === 0 ? (
            <div className="border border-dashed border-zinc-200 dark:border-zinc-800 p-16 text-center rounded-none">
              <HugeiconsIcon
                icon={UserGroupIcon}
                size={36}
                className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3"
              />
              <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                {search
                  ? "Tidak ada Caang yang cocok."
                  : "Belum ada Caang terverifikasi yang terdaftar."}
              </p>
            </div>
          ) : (
            <>
              {/* ── Desktop Attendance Table ─────────────────────────────────── */}
              <div className="hidden md:block overflow-x-auto border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-none">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
                      <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500 min-w-[220px] sticky left-0 bg-zinc-50/70 dark:bg-zinc-900/50 z-10 border-r border-zinc-200 dark:border-zinc-800">
                        Caang
                      </th>
                      {initialActivitiesForSummary.map((act) => (
                        <th
                          key={act.id}
                          className="p-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500 min-w-[100px] text-center border-r border-zinc-100 dark:border-zinc-900"
                        >
                          <div className="max-w-[90px] mx-auto">
                            <span className="line-clamp-2 text-[9px] leading-tight block">
                              {act.title}
                            </span>
                            <span className="text-zinc-400 text-[8px] mt-0.5 block">
                              {formatDate(act.start_date)}
                            </span>
                          </div>
                        </th>
                      ))}
                      <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500 text-center min-w-[60px]">
                        Hadir
                      </th>
                      <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500 text-center min-w-[60px]">
                        Izin
                      </th>
                      <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500 text-center min-w-[60px]">
                        Sakit
                      </th>
                      <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500 text-center min-w-[60px]">
                        Alfa
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSummary.map((item, idx) => (
                      <tr
                        key={item.profileId}
                        className={`border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 ${
                          idx % 2 === 1
                            ? "bg-zinc-50/30 dark:bg-zinc-950/30"
                            : ""
                        }`}
                      >
                        {/* Caang Info */}
                        <td className="p-3 sticky left-0 z-10 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                          <div className="flex items-center gap-2.5 min-w-[200px]">
                            <div className="relative w-9 h-9 rounded-none overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-100 dark:bg-zinc-900">
                              {item.photoUrl ? (
                                <Image
                                  src={item.photoUrl}
                                  alt={item.fullName}
                                  width={56}
                                  height={56}
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold text-xs">
                                  {item.fullName[0]?.toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate max-w-[150px]">
                                {item.fullName}
                              </p>
                              <p className="font-mono text-[9px] text-zinc-500 uppercase">
                                {item.nim}
                              </p>
                              <p className="text-[9px] text-zinc-400 truncate max-w-[150px]">
                                {item.studyProgramName}
                              </p>
                            </div>
                          </div>
                        </td>
                        {/* Per-Activity Status Cells */}
                        {initialActivitiesForSummary.map((act) => {
                          const status = item.attendances[
                            act.id
                          ] as StatusAbsensi | null;
                          const cfg = status ? STATUS_CONFIG[status] : null;
                          const isOpen =
                            overrideCell?.profileId === item.profileId &&
                            overrideCell?.activityId === act.id;
                          return (
                            <td
                              key={act.id}
                              className="p-2 text-center border-r border-zinc-100 dark:border-zinc-900 relative"
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
                                className={`font-mono text-[9px] uppercase tracking-wider px-2 py-1 rounded-none border transition-colors w-full ${
                                  cfg
                                    ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800"
                                } hover:opacity-80`}
                                title="Klik untuk ubah status"
                              >
                                {cfg ? cfg.label : "Alfa"}
                              </button>
                              {/* Status Dropdown */}
                              {isOpen && (
                                <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-none min-w-[90px]">
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
                                      className={`w-full text-left px-3 py-2 font-mono text-[9px] uppercase tracking-wider hover:opacity-80 transition-colors ${STATUS_CONFIG[s].color} ${STATUS_CONFIG[s].bg}`}
                                    >
                                      {STATUS_CONFIG[s].label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </td>
                          );
                        })}
                        {/* Totals */}
                        <td className="p-3 text-center font-mono text-xs font-bold text-[#10b981]">
                          {item.totals.hadir}
                        </td>
                        <td className="p-3 text-center font-mono text-xs font-bold text-amber-500">
                          {item.totals.izin}
                        </td>
                        <td className="p-3 text-center font-mono text-xs font-bold text-[#1c69d4]">
                          {item.totals.sakit}
                        </td>
                        <td className="p-3 text-center font-mono text-xs font-bold text-[#e22718]">
                          {item.totals.alfa}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile Attendance Cards ───────────────────────────────────── */}
              <div className="flex flex-col gap-3 md:hidden">
                {filteredSummary.map((item) => (
                  <div
                    key={item.profileId}
                    className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-none overflow-hidden"
                  >
                    {/* Caang Header */}
                    <div className="flex items-center gap-3 p-4 border-b border-zinc-100 dark:border-zinc-900">
                      <div className="relative w-10 h-10 rounded-none border border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                        {item.photoUrl ? (
                          <Image
                            src={item.photoUrl}
                            alt={item.fullName}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-sm text-zinc-500">
                            {item.fullName[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                          {item.fullName}
                        </p>
                        <p className="font-mono text-[10px] text-zinc-500 uppercase">
                          {item.nim} · {item.studyProgramName}
                        </p>
                      </div>
                    </div>
                    {/* Summary Counters */}
                    <div className="grid grid-cols-4 divide-x divide-zinc-100 dark:divide-zinc-900 text-center p-0">
                      {(
                        ["hadir", "izin", "sakit", "alfa"] as StatusAbsensi[]
                      ).map((s) => (
                        <div key={s} className="py-3">
                          <p
                            className={`font-bold text-lg ${STATUS_CONFIG[s].color}`}
                          >
                            {item.totals[s]}
                          </p>
                          <p className="font-mono text-[9px] uppercase tracking-wider text-zinc-500 mt-0.5">
                            {STATUS_CONFIG[s].label}
                          </p>
                        </div>
                      ))}
                    </div>
                    {/* Per-Activity Detail */}
                    {initialActivitiesForSummary.length > 0 && (
                      <div className="border-t border-zinc-100 dark:border-zinc-900 p-3 space-y-1.5">
                        {initialActivitiesForSummary.map((act) => {
                          const status = item.attendances[
                            act.id
                          ] as StatusAbsensi | null;
                          const cfg = status
                            ? STATUS_CONFIG[status]
                            : STATUS_CONFIG.alfa;
                          return (
                            <div
                              key={act.id}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-1 flex-1">
                                {act.title}
                              </span>
                              <span
                                className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded-none border ${cfg.bg} ${cfg.color} ${cfg.border}`}
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
          MODAL: FORM TAMBAH / EDIT KEGIATAN
          ════════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) setIsFormOpen(false);
        }}
      >
        <DialogContent className="max-w-xl rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-900">
            <DialogTitle className="font-mono text-sm uppercase tracking-widest text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <HugeiconsIcon
                icon={editingActivity ? Edit02Icon : Add01Icon}
                size={16}
                className="text-[#1c69d4]"
              />
              {editingActivity ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}
            </DialogTitle>
            <DialogDescription className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
              {editingActivity
                ? `ID: ${editingActivity.id.slice(0, 8)}...`
                : "Target audiens: CAANG (otomatis)"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit}>
            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Judul */}
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  Judul <span className="text-[#e22718]">*</span>
                </Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Nama kegiatan..."
                  className="rounded-none h-9 font-mono text-xs border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-[#1c69d4]"
                  required
                />
              </div>

              {/* Deskripsi */}
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  Deskripsi
                </Label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Deskripsi kegiatan (opsional)..."
                  rows={3}
                  className="w-full rounded-none border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 placeholder:text-xs focus:outline-none focus:border-[#1c69d4] font-sans"
                />
              </div>

              {/* Waktu Mulai & Selesai */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Waktu Mulai <span className="text-[#e22718]">*</span>
                  </Label>
                  <input
                    type="datetime-local"
                    value={form.start_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, start_date: e.target.value }))
                    }
                    className="w-full h-9 rounded-none border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 text-xs font-mono text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-[#1c69d4] dark:scheme-dark"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Waktu Berakhir <span className="text-[#e22718]">*</span>
                  </Label>
                  <input
                    type="datetime-local"
                    value={form.end_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, end_date: e.target.value }))
                    }
                    className="w-full h-9 rounded-none border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 text-xs font-mono text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-[#1c69d4] dark:scheme-dark"
                    required
                  />
                </div>
              </div>

              {/* Lokasi */}
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  Lokasi
                </Label>
                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  placeholder="Gedung / ruangan / link online..."
                  className="rounded-none h-9 font-mono text-xs border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-[#1c69d4]"
                />
              </div>

              {/* Banner Upload */}
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  Banner Kegiatan
                </Label>
                {bannerPreview && (
                  <div className="relative w-full h-36 border border-zinc-200 dark:border-zinc-800 overflow-hidden rounded-none mb-2">
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
                      className="absolute top-2 right-2 w-6 h-6 bg-zinc-900/70 text-white flex items-center justify-center hover:bg-zinc-900"
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
                  className="w-full h-9 border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 font-mono text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 hover:border-[#1c69d4] hover:text-[#1c69d4] transition-colors rounded-none"
                >
                  <HugeiconsIcon icon={Upload01Icon} size={14} />
                  {bannerPreview ? "Ganti Banner" : "Upload Banner (Maks. 5MB)"}
                </button>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-900">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
                className="rounded-none border border-zinc-200 dark:border-zinc-800 font-mono text-xs uppercase tracking-wider h-9 px-4"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-none bg-[#1c69d4] hover:bg-[#0066b1] text-white font-mono text-xs uppercase tracking-wider h-9 px-6 disabled:opacity-50 shadow-[0_0_8px_rgba(28,105,212,0.2)]"
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
        <DialogContent className="max-w-sm rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#e22718]" />
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-900">
            <DialogTitle className="font-mono text-sm uppercase tracking-widest text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <HugeiconsIcon
                icon={Delete01Icon}
                size={16}
                className="text-[#e22718]"
              />
              Hapus Kegiatan
            </DialogTitle>
            <DialogDescription className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
              Kegiatan akan dipindahkan ke Trash
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Apakah Anda yakin ingin menghapus kegiatan{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                &quot;{deletingActivity?.title}&quot;
              </span>
              ?
            </p>
            <p className="text-xs text-zinc-400 mt-2 font-mono">
              Kegiatan dapat dipulihkan dari halaman Trash.
            </p>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-900">
            <Button
              variant="ghost"
              onClick={() => setDeletingActivity(null)}
              disabled={isDeleting}
              className="rounded-none border border-zinc-200 dark:border-zinc-800 font-mono text-xs uppercase tracking-wider h-9 px-4"
            >
              Batal
            </Button>
            <Button
              onClick={handleSoftDelete}
              disabled={isDeleting}
              className="rounded-none bg-[#e22718] hover:bg-[#c81e12] text-white font-mono text-xs uppercase tracking-wider h-9 px-4 disabled:opacity-50 shadow-[0_0_8px_rgba(226,39,24,0.15)]"
            >
              {isDeleting ? "Menghapus..." : "Pindahkan ke Trash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overlay to close attendance dropdown */}
      {overrideCell && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOverrideCell(null)}
        />
      )}

      {isPending && (
        <div className="fixed bottom-4 right-4 z-50 bg-zinc-900 text-white font-mono text-xs px-3 py-2 rounded-none border border-zinc-700">
          Memperbarui...
        </div>
      )}
    </div>
  );
}
