"use client";

import { useState, useTransition } from "react";
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
import { createKomdisActivity } from "@/lib/actions/komdis";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { CalendarAdd01Icon, Loading03Icon } from "@hugeicons/core-free-icons";

interface CreateKomdisActivityDialogProps {
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

export function CreateKomdisActivityDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreateKomdisActivityDialogProps) {
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [checkinOpenAt, setCheckinOpenAt] = useState("");
  const [checkinCloseAt, setCheckinCloseAt] = useState("");
  const [lateTolerance, setLateTolerance] = useState(15);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
    if (!checkinOpenAt || !checkinCloseAt) {
      toast.error("Waktu buka dan tutup absensi wajib diisi.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createKomdisActivity({
          title: title.trim(),
          description: description.trim() || undefined,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          location: location.trim(),
          checkin_open_at: new Date(checkinOpenAt).toISOString(),
          checkin_close_at: new Date(checkinCloseAt).toISOString(),
          late_tolerance_minutes: Number(lateTolerance) || 15,
        });

        if (res.success) {
          toast.success("Kegiatan Komdis berhasil dibuat.");
          setTitle("");
          setDescription("");
          setStartDate("");
          setEndDate("");
          setLocation("");
          setCheckinOpenAt("");
          setCheckinCloseAt("");
          setLateTolerance(15);
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
            <HugeiconsIcon icon={CalendarAdd01Icon} />
            <span>Aksi Admin Komisi Disiplin</span>
          </div>
          <DialogTitle className="font-display text-lg font-medium tracking-tight text-dongker-ink dark:text-foreground">
            Buat Kegiatan Formal Komdis
          </DialogTitle>
          <DialogDescription className="text-sm text-steel-gray dark:text-muted-foreground">
            Target audience otomatis diset ke &apos;anggota&apos; sesuai SOP
            Komdis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex flex-col gap-4 px-6 py-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-komdis-title" className={fieldLabelClass}>
                Judul Kegiatan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-komdis-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Evaluasi Rutin / Workshop Robotik..."
                className={fieldControlClass}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="create-komdis-description"
                className={fieldLabelClass}
              >
                Deskripsi Kegiatan (Opsional)
              </Label>
              <Textarea
                id="create-komdis-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Rincian mengenai agenda dan peralatan yang wajib dibawa..."
                className="min-h-17.5 rounded-md border-blueprint-border bg-canvas-white text-dongker-ink font-sans text-sm placeholder:text-steel-gray/60 focus-visible:border-pnp-orange focus-visible:ring-2 focus-visible:ring-pnp-orange/20 dark:bg-card dark:border-border dark:text-foreground"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="create-komdis-start"
                  className={fieldLabelClass}
                >
                  Tanggal &amp; Waktu Mulai{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="create-komdis-start"
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
                <Label htmlFor="create-komdis-end" className={fieldLabelClass}>
                  Tanggal &amp; Waktu Selesai{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="create-komdis-end"
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
              <Label
                htmlFor="create-komdis-location"
                className={fieldLabelClass}
              >
                Lokasi Pelaksanaan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-komdis-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Gedung PKM Lantai 2 / Lab Robotik..."
                className={fieldControlClass}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="create-komdis-checkin-open"
                  className={fieldLabelClass}
                >
                  Buka Absensi <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="create-komdis-checkin-open"
                  type="datetime-local"
                  value={checkinOpenAt}
                  onChange={(e) => setCheckinOpenAt(e.target.value)}
                  className={datetimeControlClass}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="create-komdis-checkin-close"
                  className={fieldLabelClass}
                >
                  Tutup Absensi <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="create-komdis-checkin-close"
                  type="datetime-local"
                  value={checkinCloseAt}
                  onChange={(e) => setCheckinCloseAt(e.target.value)}
                  className={datetimeControlClass}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="create-komdis-tolerance"
                className={fieldLabelClass}
              >
                Toleransi Keterlambatan (Menit)
              </Label>
              <Input
                id="create-komdis-tolerance"
                type="number"
                min={0}
                max={60}
                value={lateTolerance}
                onChange={(e) => setLateTolerance(Number(e.target.value))}
                className={datetimeControlClass}
              />
              <p className="font-mono text-micro text-steel-gray dark:text-muted-foreground">
                Standar Komdis: 15 menit. Scan QR setelah batas ini dianggap
                telat.
              </p>
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
                "Simpan Kegiatan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
