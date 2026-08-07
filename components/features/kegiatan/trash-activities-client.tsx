"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Archive01Icon,
  Delete01Icon,
  ArrowLeft02Icon,
  Calendar03Icon,
  Clock01Icon,
  Location01Icon,
  ArrowReloadHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  hardDeleteActivity,
  restoreActivity,
  type ActivityItem,
} from "@/lib/actions/activities";

interface TrashActivitiesClientProps {
  initialDeletedActivities: ActivityItem[];
  targetAudience: "caang" | "anggota";
  backPath: string;
  userRole?: string;
}

function formatIndoDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB"
  );
}

export function TrashActivitiesClient({
  initialDeletedActivities,
  targetAudience,
  backPath,
}: TrashActivitiesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [deletedActivities] = useState<ActivityItem[]>(
    initialDeletedActivities,
  );
  const [hardDeleting, setHardDeleting] = useState<ActivityItem | null>(null);
  const [isHardDeleting, setIsHardDeleting] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleRestore = async (activityId: string) => {
    setRestoringId(activityId);
    const toastId = toast.loading("Memulihkan kegiatan dari tempat sampah...");
    try {
      const res = await restoreActivity(activityId);
      toast.dismiss(toastId);
      if (res.success) {
        toast.success(res.message);
        startTransition(() => router.refresh());
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.dismiss(toastId);
      toast.error("Terjadi kesalahan koneksi saat memulihkan kegiatan.");
    } finally {
      setRestoringId(null);
    }
  };

  const handleHardDelete = async () => {
    if (!hardDeleting) return;
    setIsHardDeleting(true);
    const toastId = toast.loading("Menghapus kegiatan secara permanen...");
    try {
      const res = await hardDeleteActivity(hardDeleting.id);
      toast.dismiss(toastId);
      if (res.success) {
        toast.success(res.message);
        setHardDeleting(null);
        startTransition(() => router.refresh());
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.dismiss(toastId);
      toast.error("Terjadi kesalahan koneksi saat menghapus permanen.");
    } finally {
      setIsHardDeleting(false);
    }
  };

  const audienceLabel =
    targetAudience === "anggota" ? "Kegiatan Anggota" : "Kegiatan Caang";

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
      {/* ── Header Banner — Precision Blueprint Style ─────────────────────── */}
      <div className="relative border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-xs overflow-hidden">
        {/* Top Accent Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-[#1e3a8a] via-[#3b82f6] to-[#f97316]" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-[#0a192f] dark:text-slate-100 font-display flex items-center gap-2.5">
              <HugeiconsIcon
                icon={Archive01Icon}
                size={24}
                className="text-[#1e3a8a] dark:text-blue-400 shrink-0"
              />
              Tempat Sampah — {audienceLabel}
            </h1>
            <p className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
              {deletedActivities.length} Kegiatan Terhapus · Pulihkan atau Hapus
              Permanen
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => router.push(backPath)}
              className="w-full sm:w-auto rounded-lg border border-slate-200 dark:border-slate-700 text-[#0a192f] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-mono text-[11px] uppercase tracking-wider px-4 py-2.5 h-10 shadow-xs"
            >
              <HugeiconsIcon
                icon={ArrowLeft02Icon}
                size={16}
                className="mr-2"
              />
              Kembali ke Agenda
            </Button>
          </div>
        </div>
      </div>

      {/* ── Content Area ─────────────────────────────────────────────────── */}
      {deletedActivities.length === 0 ? (
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center rounded-xl shadow-xs">
          <HugeiconsIcon
            icon={Archive01Icon}
            size={42}
            className="mx-auto text-slate-300 dark:text-slate-700 mb-3"
          />
          <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Tempat sampah kosong. Tidak ada agenda {audienceLabel.toLowerCase()}{" "}
            yang dihapus.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
            <table className="w-full min-w-[800px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="p-4 w-24 text-center font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Banner
                  </th>
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Nama Kegiatan
                  </th>
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Tanggal &amp; Waktu
                  </th>
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Dihapus Pada
                  </th>
                  <th className="p-4 w-52 text-center font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {deletedActivities.map((activity) => (
                  <tr
                    key={activity.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-4 align-middle text-center">
                      <div className="relative h-11 w-16 mx-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center opacity-60">
                        {activity.banner_url ? (
                          <Image
                            src={activity.banner_url}
                            alt={activity.title}
                            fill
                            sizes="64px"
                            className="object-cover grayscale"
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
                        className="font-display font-medium text-[#0a192f] dark:text-slate-100 text-sm truncate max-w-[260px]"
                        title={activity.title}
                      >
                        {activity.title}
                      </div>
                      <Badge className="mt-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-mono text-[10px] uppercase font-semibold">
                        AUDIENCE: {activity.target_audience}
                      </Badge>
                    </td>

                    <td className="p-4 align-middle">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                          <HugeiconsIcon
                            icon={Calendar03Icon}
                            size={13}
                            className="text-slate-400 shrink-0"
                          />
                          <span>
                            {new Date(activity.start_date).toLocaleDateString(
                              "id-ID",
                              {
                                weekday: "short",
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          <HugeiconsIcon
                            icon={Clock01Icon}
                            size={13}
                            className="text-slate-400 shrink-0"
                          />
                          <span>
                            {new Date(activity.start_date).toLocaleTimeString(
                              "id-ID",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}{" "}
                            WIB
                          </span>
                        </div>
                        {activity.location && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <HugeiconsIcon
                              icon={Location01Icon}
                              size={13}
                              className="text-slate-400 shrink-0"
                            />
                            <span className="truncate max-w-[150px]">
                              {activity.location}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-4 align-middle font-mono text-xs text-slate-500 dark:text-slate-400">
                      {activity.deleted_at
                        ? formatIndoDateTime(activity.deleted_at)
                        : "—"}
                    </td>

                    <td className="p-4 align-middle text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore(activity.id)}
                          disabled={restoringId === activity.id}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 h-8 px-3 font-mono text-[11px] uppercase tracking-wider"
                        >
                          <HugeiconsIcon
                            icon={ArrowReloadHorizontalIcon}
                            size={14}
                            className="mr-1.5"
                          />
                          {restoringId === activity.id ? "..." : "Pulihkan"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setHardDeleting(activity)}
                          className="rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 h-8 px-3 font-mono text-[11px] uppercase tracking-wider"
                        >
                          <HugeiconsIcon
                            icon={Delete01Icon}
                            size={14}
                            className="mr-1.5"
                          />
                          Hapus Permanen
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Layout Cards */}
          <div className="block md:hidden space-y-3">
            {deletedActivities.map((activity) => (
              <div
                key={activity.id}
                className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-xl space-y-3 shadow-xs opacity-90"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                      DIHAPUS PADA:{" "}
                      {activity.deleted_at
                        ? formatIndoDateTime(activity.deleted_at)
                        : "—"}
                    </span>
                    <span className="text-sm font-display font-medium text-[#0a192f] dark:text-slate-100 truncate block">
                      {activity.title}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <HugeiconsIcon
                      icon={Calendar03Icon}
                      size={13}
                      className="text-slate-400 shrink-0"
                    />
                    <span>
                      {new Date(activity.start_date).toLocaleDateString(
                        "id-ID",
                        {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>
                  {activity.location && (
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon
                        icon={Location01Icon}
                        size={13}
                        className="text-slate-400 shrink-0"
                      />
                      <span>{activity.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestore(activity.id)}
                    disabled={restoringId === activity.id}
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 h-9 font-mono text-[11px] uppercase tracking-wider"
                  >
                    <HugeiconsIcon
                      icon={ArrowReloadHorizontalIcon}
                      size={14}
                      className="mr-1.5"
                    />
                    {restoringId === activity.id ? "Memulihkan..." : "Pulihkan"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setHardDeleting(activity)}
                    className="flex-1 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 h-9 font-mono text-[11px] uppercase tracking-wider"
                  >
                    <HugeiconsIcon
                      icon={Delete01Icon}
                      size={14}
                      className="mr-1.5"
                    />
                    Hapus Permanen
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Modal Dialog: Konfirmasi Hard Delete ─────────────────────────── */}
      <Dialog
        open={!!hardDeleting}
        onOpenChange={(open) => {
          if (!open && !isHardDeleting) setHardDeleting(null);
        }}
      >
        <DialogContent className="max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 overflow-hidden shadow-blueprint">
          <div className="h-[3px] bg-red-600" />
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="font-display text-base font-medium text-[#0a192f] dark:text-slate-100 flex items-center gap-2">
              <HugeiconsIcon
                icon={Delete01Icon}
                size={18}
                className="text-red-600 shrink-0"
              />
              Hapus Kegiatan Permanen
            </DialogTitle>
            <DialogDescription className="font-mono text-[11px] uppercase tracking-wider text-red-600 font-semibold">
              ⚠ Peringatan: Tindakan ini tidak dapat dibatalkan
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 space-y-2">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus kegiatan{" "}
              <span className="font-bold text-[#0a192f] dark:text-slate-100">
                &quot;{hardDeleting?.title}&quot;
              </span>{" "}
              secara permanen?
            </p>
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              Seluruh data kegiatan dan riwayat presensi terkait akan dihapus
              secara permanen dari database.
            </p>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setHardDeleting(null)}
              disabled={isHardDeleting}
              className="rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs uppercase tracking-wider h-9 px-4"
            >
              Batal
            </Button>
            <Button
              onClick={handleHardDelete}
              disabled={isHardDeleting}
              className="rounded-lg bg-red-600 hover:bg-red-700 text-white font-mono text-xs uppercase tracking-wider h-9 px-4 disabled:opacity-50"
            >
              {isHardDeleting ? "Menghapus..." : "Hapus Permanen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isPending && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#0a192f] text-white font-mono text-xs px-4 py-2 rounded-lg border border-slate-700 shadow-lg">
          Memperbarui data...
        </div>
      )}
    </div>
  );
}
