"use client";

import { useState, useRef, useTransition } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createKomdisActivity } from "@/lib/actions/komdis";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CalendarAdd01Icon,
  Calendar01Icon,
  Cancel01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";

interface CreateKomdisActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const fieldLabelClass = "text-sm font-medium text-foreground";

const fieldControlClass =
  "h-9 rounded-md border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20";

const datetimeControlClass =
  "h-9 rounded-md border-border bg-background text-sm font-mono text-foreground focus-visible:border-primary focus-visible:ring-primary/20 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none";

export function CreateKomdisActivityDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreateKomdisActivityDialogProps) {
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
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="flex flex-col overflow-hidden border-t border-border bg-card font-sans shadow-soft data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-[calc(100dvh-1rem)] sm:mx-auto sm:max-w-lg sm:rounded-lg sm:border">
        <DrawerHeader className="flex shrink-0 flex-row items-start justify-between gap-3 border-b border-border px-5 py-4 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left sm:px-6 sm:pt-5 sm:pb-4">
          <div className="flex flex-col items-start text-left gap-1.5 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-micro font-semibold uppercase tracking-wide text-accent-foreground">
              <HugeiconsIcon icon={CalendarAdd01Icon} />
              <span>Aksi Admin Komisi Disiplin</span>
            </div>
            <DrawerTitle className="font-display text-lg font-semibold tracking-tight text-foreground text-left">
              Buat Kegiatan Formal Komdis
            </DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground text-left">
              Target audience otomatis diset ke &apos;anggota&apos; sesuai SOP
              Komdis.
            </DrawerDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            disabled={isPending}
            className="shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Tutup"
          >
            <HugeiconsIcon icon={Cancel01Icon} />
          </Button>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="create-komdis-title"
                  className={fieldLabelClass}
                >
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
                  className="min-h-17.5 rounded-md border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
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
                  <div className="relative flex items-center w-full">
                    <Input
                      ref={startInputRef}
                      id="create-komdis-start"
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
                  <Label
                    htmlFor="create-komdis-end"
                    className={fieldLabelClass}
                  >
                    Tanggal &amp; Waktu Selesai{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative flex items-center w-full">
                    <Input
                      ref={endInputRef}
                      id="create-komdis-end"
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
                  <div className="relative flex items-center w-full">
                    <Input
                      ref={checkinOpenInputRef}
                      id="create-komdis-checkin-open"
                      type="datetime-local"
                      value={checkinOpenAt}
                      onChange={(e) => setCheckinOpenAt(e.target.value)}
                      className={`${datetimeControlClass} pr-9`}
                      required
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
                    htmlFor="create-komdis-checkin-close"
                    className={fieldLabelClass}
                  >
                    Tutup Absensi <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative flex items-center w-full">
                    <Input
                      ref={checkinCloseInputRef}
                      id="create-komdis-checkin-close"
                      type="datetime-local"
                      value={checkinCloseAt}
                      onChange={(e) => setCheckinCloseAt(e.target.value)}
                      className={`${datetimeControlClass} pr-9`}
                      required
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
                <p className="text-sm text-muted-foreground">
                  Standar Komdis: 15 menit. Scan QR setelah batas ini dianggap
                  telat.
                </p>
              </div>
            </div>
          </div>

          <DrawerFooter className="shrink-0 gap-2 border-t border-border bg-surface px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
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
                "Simpan Kegiatan"
              )}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
