"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateKomdisActivity } from "@/lib/actions/komdis";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Edit02Icon, Loading03Icon } from "@hugeicons/core-free-icons";

interface ActivityItemData {
  id: string;
  title: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  location?: string | null;
  checkin_open_at?: string | null;
  checkin_close_at?: string | null;
  late_tolerance_minutes?: number | null;
}

interface EditKomdisActivityDialogProps {
  activity: ActivityItemData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const fieldLabelClass =
  "font-sans text-micro font-semibold uppercase tracking-wider text-slate-blue";

const fieldControlClass =
  "h-9 rounded-md border-blueprint-border bg-canvas-white text-dongker-ink font-sans text-sm placeholder:text-steel-gray/60 focus-visible:border-pnp-orange focus-visible:ring-2 focus-visible:ring-pnp-orange/20 dark:bg-card dark:border-border dark:text-foreground";

const datetimeControlClass =
  "h-9 rounded-md border-blueprint-border bg-canvas-white text-dongker-ink font-mono text-sm focus-visible:border-pnp-orange focus-visible:ring-2 focus-visible:ring-pnp-orange/20 dark:bg-card dark:border-border dark:text-foreground";

function toLocalDatetimeInput(dateStr?: string | null) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

export function EditKomdisActivityDialog({
  activity,
  isOpen,
  onClose,
  onSuccess,
}: EditKomdisActivityDialogProps) {
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [checkinOpenAt, setCheckinOpenAt] = useState("");
  const [checkinCloseAt, setCheckinCloseAt] = useState("");
  const [lateTolerance, setLateTolerance] = useState(15);

  useEffect(() => {
    if (activity) {
      const timer = setTimeout(() => {
        setTitle(activity.title || "");
        setDescription(activity.description || "");
        setStartDate(toLocalDatetimeInput(activity.start_date));
        setEndDate(toLocalDatetimeInput(activity.end_date));
        setLocation(activity.location || "");
        setCheckinOpenAt(
          toLocalDatetimeInput(activity.checkin_open_at || activity.start_date),
        );
        setCheckinCloseAt(
          toLocalDatetimeInput(activity.checkin_close_at || activity.end_date),
        );
        setLateTolerance(activity.late_tolerance_minutes || 15);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activity?.id) return;

    if (!title.trim()) {
      toast.error("Judul kegiatan wajib diisi.");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Waktu mulai dan selesai wajib diisi.");
      return;
    }
    if (!location.trim()) {
      toast.error("Lokasi kegiatan wajib diisi.");
      return;
    }

    const openTime = checkinOpenAt || startDate;
    const closeTime = checkinCloseAt || endDate;

    startTransition(async () => {
      try {
        const res = await updateKomdisActivity({
          activityId: activity.id,
          title: title.trim(),
          description: description.trim() || undefined,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          location: location.trim(),
          checkin_open_at: new Date(openTime).toISOString(),
          checkin_close_at: new Date(closeTime).toISOString(),
          late_tolerance_minutes: Number(lateTolerance) || 15,
        });

        if (res.success) {
          toast.success("Kegiatan Komdis berhasil diperbarui.");
          onSuccess();
          onClose();
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(msg);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-0 overflow-hidden rounded-xl border border-blueprint-border bg-canvas-white p-0 font-sans shadow-blueprint sm:max-w-lg dark:border-border dark:bg-card">
        <div
          aria-hidden
          className="h-1 bg-linear-to-r from-dongker-surface via-dongker-hover to-pnp-orange"
        />

        <DialogHeader className="gap-2 border-b border-blueprint-border px-6 pt-5 pb-4 dark:border-border">
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-pnp-orange/30 bg-orange-wash px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-orange-deep dark:bg-pnp-orange/15 dark:text-pnp-orange">
            <HugeiconsIcon icon={Edit02Icon} />
            <span>Edit Kegiatan Komdis</span>
          </div>
          <DialogTitle className="font-display text-lg font-medium tracking-tight text-dongker-ink dark:text-foreground">
            Ubah Detail Kegiatan
          </DialogTitle>
          <DialogDescription className="text-sm text-steel-gray dark:text-muted-foreground">
            Perbarui parameter kegiatan formal Komisi Disiplin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex flex-col gap-4 px-6 py-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-komdis-title" className={fieldLabelClass}>
                Judul Kegiatan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-komdis-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul kegiatan..."
                className={fieldControlClass}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="edit-komdis-description"
                className={fieldLabelClass}
              >
                Deskripsi Kegiatan (Opsional)
              </Label>
              <Textarea
                id="edit-komdis-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Rincian mengenai agenda..."
                className="min-h-17.5 rounded-md border-blueprint-border bg-canvas-white text-dongker-ink font-sans text-sm placeholder:text-steel-gray/60 focus-visible:border-pnp-orange focus-visible:ring-2 focus-visible:ring-pnp-orange/20 dark:bg-card dark:border-border dark:text-foreground"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-komdis-start" className={fieldLabelClass}>
                  Waktu Mulai <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-komdis-start"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (!checkinOpenAt) setCheckinOpenAt(e.target.value);
                  }}
                  className={datetimeControlClass}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-komdis-end" className={fieldLabelClass}>
                  Waktu Selesai <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-komdis-end"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (!checkinCloseAt) setCheckinCloseAt(e.target.value);
                  }}
                  className={datetimeControlClass}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-komdis-location" className={fieldLabelClass}>
                Lokasi Pelaksanaan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-komdis-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Lokasi kegiatan..."
                className={fieldControlClass}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="edit-komdis-checkin-open"
                  className={fieldLabelClass}
                >
                  Buka Absensi
                </Label>
                <Input
                  id="edit-komdis-checkin-open"
                  type="datetime-local"
                  value={checkinOpenAt}
                  onChange={(e) => setCheckinOpenAt(e.target.value)}
                  className={datetimeControlClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="edit-komdis-checkin-close"
                  className={fieldLabelClass}
                >
                  Tutup Absensi
                </Label>
                <Input
                  id="edit-komdis-checkin-close"
                  type="datetime-local"
                  value={checkinCloseAt}
                  onChange={(e) => setCheckinCloseAt(e.target.value)}
                  className={datetimeControlClass}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="edit-komdis-tolerance"
                className={fieldLabelClass}
              >
                Toleransi Keterlambatan (Menit)
              </Label>
              <Input
                id="edit-komdis-tolerance"
                type="number"
                min={0}
                max={60}
                value={lateTolerance}
                onChange={(e) => setLateTolerance(Number(e.target.value))}
                className={datetimeControlClass}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-dashed border-blueprint-border bg-mist-gray/60 px-6 py-4 dark:border-border dark:bg-muted/30 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="h-9 rounded-md border-dongker-surface px-4 font-sans text-sm font-medium text-dongker-surface hover:bg-mist-gray dark:border-pnp-orange dark:text-pnp-orange dark:hover:bg-pnp-orange/10"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-9 rounded-md bg-dongker-surface px-4 font-sans text-sm font-medium text-white hover:bg-dongker-hover dark:bg-pnp-orange dark:hover:bg-orange-deep"
            >
              {isPending ? (
                <>
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    data-icon="inline-start"
                    className="animate-spin"
                  />
                  Memproses...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
