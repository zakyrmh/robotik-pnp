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

interface TrashClientProps {
  deletedActivities: ActivityItem[];
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) + " WIB";
}

export function TrashClient({ deletedActivities }: TrashClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [hardDeleting, setHardDeleting] = useState<ActivityItem | null>(null);
  const [isHardDeleting, setIsHardDeleting] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  const handleRestore = async (activityId: string) => {
    setRestoring(activityId);
    const toastId = toast.loading("Memulihkan kegiatan...");
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
      toast.error("Terjadi kesalahan koneksi.");
    } finally {
      setRestoring(null);
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
      toast.error("Terjadi kesalahan koneksi.");
    } finally {
      setIsHardDeleting(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-1 lg:px-4">
      {/* ── Header Banner ──────────────────────────────────────────────────── */}
      <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 rounded-none shadow-sm overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-50 font-sans flex items-center gap-2">
              <HugeiconsIcon icon={Archive01Icon} size={22} className="text-zinc-500" />
              Trash — Kegiatan Terhapus
            </h1>
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-500 mt-1">
              {deletedActivities.length} kegiatan dipindahkan ke Trash · Hapus permanen atau pulihkan
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/kegiatan-absensi-caang")}
            className="rounded-none border border-zinc-200 dark:border-zinc-800 font-mono text-xs uppercase tracking-wider px-4 py-2 h-9 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} size={16} className="mr-2" />
            Kembali
          </Button>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      {deletedActivities.length === 0 ? (
        <div className="border border-dashed border-zinc-200 dark:border-zinc-800 p-20 text-center rounded-none">
          <HugeiconsIcon icon={Archive01Icon} size={40} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            Trash kosong. Tidak ada kegiatan yang dihapus.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-none">
            <table className="w-full min-w-[750px] border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
                  <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500 w-[35%]">Kegiatan</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500">Waktu</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500">Dihapus Pada</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {deletedActivities.map((activity, idx) => (
                  <tr
                    key={activity.id}
                    className={`border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 ${
                      idx % 2 === 1 ? "bg-zinc-50/30 dark:bg-zinc-950/30" : ""
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-10 rounded-none overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-100 dark:bg-zinc-900 opacity-50">
                          {activity.banner_url ? (
                            <Image src={activity.banner_url} alt={activity.title} fill sizes="56px" className="object-cover grayscale" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <HugeiconsIcon icon={Calendar03Icon} size={18} className="text-zinc-400" />
                            </div>
                          )}
                        </div>
                        <span className="font-semibold text-sm text-zinc-500 dark:text-zinc-500 line-clamp-2 max-w-[200px]">
                          {activity.title}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                          <HugeiconsIcon icon={Calendar03Icon} size={12} className="text-zinc-400 shrink-0" />
                          <span className="font-mono text-[11px]">
                            {new Date(activity.start_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <HugeiconsIcon icon={Clock01Icon} size={12} className="text-zinc-300 shrink-0" />
                          <span className="font-mono text-[10px]">
                            {new Date(activity.start_date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                          </span>
                        </div>
                        {activity.location && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <HugeiconsIcon icon={Location01Icon} size={12} className="text-zinc-300 shrink-0" />
                            <span className="line-clamp-1 max-w-[130px]">{activity.location}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-[10px] text-zinc-400">
                        {activity.deleted_at ? formatDateTime(activity.deleted_at) : "—"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore(activity.id)}
                          disabled={restoring === activity.id}
                          className="rounded-none border border-zinc-200 dark:border-zinc-800 font-mono text-[10px] uppercase h-8 px-3 hover:border-[#10b981] hover:text-[#10b981] transition-colors"
                        >
                          <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={12} className="mr-1.5" />
                          {restoring === activity.id ? "..." : "Pulihkan"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setHardDeleting(activity)}
                          className="rounded-none border border-zinc-200 dark:border-zinc-800 font-mono text-[10px] uppercase h-8 px-3 hover:border-[#e22718] hover:text-[#e22718] transition-colors"
                        >
                          <HugeiconsIcon icon={Delete01Icon} size={12} className="mr-1.5" />
                          Hapus Permanen
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {deletedActivities.map((activity) => (
              <div key={activity.id} className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-none overflow-hidden opacity-80">
                <div className="p-4 space-y-3">
                  <div>
                    <p className="font-semibold text-sm text-zinc-500 dark:text-zinc-500">{activity.title}</p>
                    {activity.deleted_at && (
                      <p className="font-mono text-[9px] text-zinc-400 mt-1 uppercase">
                        Dihapus: {formatDateTime(activity.deleted_at)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={Calendar03Icon} size={12} className="text-zinc-300 shrink-0" />
                      <span className="font-mono text-[10px]">
                        {new Date(activity.start_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    {activity.location && (
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={Location01Icon} size={12} className="text-zinc-300 shrink-0" />
                        <span>{activity.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(activity.id)}
                      disabled={restoring === activity.id}
                      className="flex-1 rounded-none border-zinc-200 dark:border-zinc-800 font-mono text-[10px] uppercase h-8 hover:border-[#10b981] hover:text-[#10b981]"
                    >
                      <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={12} className="mr-1.5" />
                      Pulihkan
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setHardDeleting(activity)}
                      className="flex-1 rounded-none border border-zinc-200 dark:border-zinc-800 font-mono text-[10px] uppercase h-8 hover:border-[#e22718] hover:text-[#e22718]"
                    >
                      <HugeiconsIcon icon={Delete01Icon} size={12} className="mr-1.5" />
                      Hapus Permanen
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Modal: Konfirmasi Hard Delete ──────────────────────────────────── */}
      <Dialog open={!!hardDeleting} onOpenChange={(open) => { if (!open && !isHardDeleting) setHardDeleting(null); }}>
        <DialogContent className="max-w-sm rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#e22718]" />
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-900">
            <DialogTitle className="font-mono text-sm uppercase tracking-widest text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <HugeiconsIcon icon={Delete01Icon} size={16} className="text-[#e22718]" />
              Hapus Permanen
            </DialogTitle>
            <DialogDescription className="font-mono text-[10px] uppercase tracking-wider text-[#e22718]">
              ⚠ Tindakan ini tidak dapat dibatalkan
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Data kegiatan{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                &quot;{hardDeleting?.title}&quot;
              </span>{" "}
              beserta seluruh data absensi terkait akan dihapus secara permanen dari database.
            </p>
            <p className="text-xs text-[#e22718] mt-2 font-mono uppercase tracking-wider">
              Tindakan ini tidak dapat dipulihkan.
            </p>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-900">
            <Button
              variant="ghost"
              onClick={() => setHardDeleting(null)}
              disabled={isHardDeleting}
              className="rounded-none border border-zinc-200 dark:border-zinc-800 font-mono text-xs uppercase tracking-wider h-9 px-4"
            >
              Batal
            </Button>
            <Button
              onClick={handleHardDelete}
              disabled={isHardDeleting}
              className="rounded-none bg-[#e22718] hover:bg-[#c81e12] text-white font-mono text-xs uppercase tracking-wider h-9 px-4 disabled:opacity-50 shadow-[0_0_8px_rgba(226,39,24,0.2)]"
            >
              {isHardDeleting ? "Menghapus..." : "Hapus Permanen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isPending && (
        <div className="fixed bottom-4 right-4 z-50 bg-zinc-900 text-white font-mono text-xs px-3 py-2 rounded-none border border-zinc-700">
          Memperbarui...
        </div>
      )}
    </div>
  );
}
