"use client";

import { useState, useEffect, useRef, useTransition } from "react";
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
import {
  Edit02Icon,
  Calendar01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";

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

const fieldLabelClass = "text-sm font-medium text-foreground";

const fieldControlClass =
  "h-9 rounded-md border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20";

const datetimeControlClass =
  "h-9 rounded-md border-border bg-background text-sm font-mono text-foreground focus-visible:border-primary focus-visible:ring-primary/20 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none";

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

  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
  const checkinOpenInputRef = useRef<HTMLInputElement>(null);
  const checkinCloseInputRef = useRef<HTMLInputElement>(null);

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
      <DialogContent className="gap-0 overflow-hidden rounded-lg border border-border bg-card p-0 font-sans shadow-soft sm:max-w-lg">
        <DialogHeader className="gap-2 border-b border-border px-6 pt-5 pb-4">
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-micro font-semibold uppercase tracking-wide text-accent-foreground">
            <HugeiconsIcon icon={Edit02Icon} />
            <span>Edit Kegiatan Komdis</span>
          </div>
          <DialogTitle className="font-display text-lg font-semibold tracking-tight text-foreground">
            Ubah Detail Kegiatan
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
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
                className="min-h-17.5 rounded-md border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-komdis-start" className={fieldLabelClass}>
                  Waktu Mulai <span className="text-destructive">*</span>
                </Label>
                <div className="relative flex items-center w-full">
                  <Input
                    ref={startInputRef}
                    id="edit-komdis-start"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (!checkinOpenAt) setCheckinOpenAt(e.target.value);
                    }}
                    className={`${datetimeControlClass} pr-9`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        startInputRef.current?.showPicker();
                      } catch {
                        startInputRef.current?.focus();
                      }
                    }}
                    className="absolute right-2 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
                    tabIndex={-1}
                    title="Buka Kalender"
                    aria-label="Buka Kalender"
                  >
                    <HugeiconsIcon icon={Calendar01Icon} size={16} />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-komdis-end" className={fieldLabelClass}>
                  Waktu Selesai <span className="text-destructive">*</span>
                </Label>
                <div className="relative flex items-center w-full">
                  <Input
                    ref={endInputRef}
                    id="edit-komdis-end"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      if (!checkinCloseAt) setCheckinCloseAt(e.target.value);
                    }}
                    className={`${datetimeControlClass} pr-9`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        endInputRef.current?.showPicker();
                      } catch {
                        endInputRef.current?.focus();
                      }
                    }}
                    className="absolute right-2 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
                    tabIndex={-1}
                    title="Buka Kalender"
                    aria-label="Buka Kalender"
                  >
                    <HugeiconsIcon icon={Calendar01Icon} size={16} />
                  </button>
                </div>
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
                <div className="relative flex items-center w-full">
                  <Input
                    ref={checkinOpenInputRef}
                    id="edit-komdis-checkin-open"
                    type="datetime-local"
                    value={checkinOpenAt}
                    onChange={(e) => setCheckinOpenAt(e.target.value)}
                    className={`${datetimeControlClass} pr-9`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        checkinOpenInputRef.current?.showPicker();
                      } catch {
                        checkinOpenInputRef.current?.focus();
                      }
                    }}
                    className="absolute right-2 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
                    tabIndex={-1}
                    title="Buka Kalender"
                    aria-label="Buka Kalender"
                  >
                    <HugeiconsIcon icon={Calendar01Icon} size={16} />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="edit-komdis-checkin-close"
                  className={fieldLabelClass}
                >
                  Tutup Absensi
                </Label>
                <div className="relative flex items-center w-full">
                  <Input
                    ref={checkinCloseInputRef}
                    id="edit-komdis-checkin-close"
                    type="datetime-local"
                    value={checkinCloseAt}
                    onChange={(e) => setCheckinCloseAt(e.target.value)}
                    className={`${datetimeControlClass} pr-9`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        checkinCloseInputRef.current?.showPicker();
                      } catch {
                        checkinCloseInputRef.current?.focus();
                      }
                    }}
                    className="absolute right-2 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
                    tabIndex={-1}
                    title="Buka Kalender"
                    aria-label="Buka Kalender"
                  >
                    <HugeiconsIcon icon={Calendar01Icon} size={16} />
                  </button>
                </div>
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

          <DialogFooter className="gap-2 border-t border-border bg-surface px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="h-9 rounded-md border-primary px-4 text-sm font-medium text-primary hover:bg-primary-soft"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
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
