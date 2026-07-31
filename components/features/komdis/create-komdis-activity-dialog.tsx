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
      <DialogContent className="max-w-lg rounded-none bg-surface-card-dark border border-hairline-dark p-6 font-sans text-white">
        <DialogHeader className="border-b border-hairline-dark pb-3">
          <div className="flex items-center gap-2 text-cyber-blue font-mono text-xs uppercase tracking-widest">
            <HugeiconsIcon icon={CalendarAdd01Icon} size={16} />
            <span>AKSI ADMIN KOMISI DISIPLIN</span>
          </div>
          <DialogTitle className="text-lg font-bold uppercase tracking-tight text-white mt-1">
            Buat Kegiatan Formal Komdis
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-gray-400">
            Target Audience otomatis diset ke &apos;anggota&apos; sesuai SOP
            Komdis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {/* Title */}
          <div className="space-y-1">
            <Label className="font-mono text-[10px] uppercase text-gray-300 tracking-wider">
              Judul Kegiatan <span className="text-crimson-red">*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Evaluasi Rutin / Workshop Robotik..."
              className="bg-canvas-dark border-hairline-dark text-white h-9 rounded-none font-sans text-xs focus:border-cyber-blue"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label className="font-mono text-[10px] uppercase text-gray-300 tracking-wider">
              Deskripsi Kegiatan (Opsional)
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rincian mengenai agenda dan peralatan yang wajib dibawa..."
              className="bg-canvas-dark border-hairline-dark text-white rounded-none font-sans text-xs min-h-[70px] focus:border-cyber-blue"
            />
          </div>

          {/* Start Date & End Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="font-mono text-[10px] uppercase text-gray-300 tracking-wider">
                Tanggal &amp; Waktu Mulai{" "}
                <span className="text-crimson-red">*</span>
              </Label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (!checkinOpenAt) setCheckinOpenAt(e.target.value);
                }}
                className="bg-canvas-dark border-hairline-dark text-white h-9 rounded-none font-mono text-xs focus:border-cyber-blue"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="font-mono text-[10px] uppercase text-gray-300 tracking-wider">
                Tanggal &amp; Waktu Selesai{" "}
                <span className="text-crimson-red">*</span>
              </Label>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (!checkinCloseAt) setCheckinCloseAt(e.target.value);
                }}
                className="bg-canvas-dark border-hairline-dark text-white h-9 rounded-none font-mono text-xs focus:border-cyber-blue"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <Label className="font-mono text-[10px] uppercase text-gray-300 tracking-wider">
              Lokasi Pelaksanaan <span className="text-crimson-red">*</span>
            </Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Contoh: Gedung PKM Lantai 2 / Lab Robotik..."
              className="bg-canvas-dark border-hairline-dark text-white h-9 rounded-none font-sans text-xs focus:border-cyber-blue"
              required
            />
          </div>

          {/* Attendance Open & Close */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="font-mono text-[10px] uppercase text-gray-300 tracking-wider">
                Buka Absensi <span className="text-crimson-red">*</span>
              </Label>
              <Input
                type="datetime-local"
                value={checkinOpenAt}
                onChange={(e) => setCheckinOpenAt(e.target.value)}
                className="bg-canvas-dark border-hairline-dark text-white h-9 rounded-none font-mono text-xs focus:border-cyber-blue"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="font-mono text-[10px] uppercase text-gray-300 tracking-wider">
                Tutup Absensi <span className="text-crimson-red">*</span>
              </Label>
              <Input
                type="datetime-local"
                value={checkinCloseAt}
                onChange={(e) => setCheckinCloseAt(e.target.value)}
                className="bg-canvas-dark border-hairline-dark text-white h-9 rounded-none font-mono text-xs focus:border-cyber-blue"
                required
              />
            </div>
          </div>

          {/* Late Tolerance */}
          <div className="space-y-1">
            <Label className="font-mono text-[10px] uppercase text-gray-300 tracking-wider">
              Toleransi Keterlambatan (Menit)
            </Label>
            <Input
              type="number"
              min={0}
              max={60}
              value={lateTolerance}
              onChange={(e) => setLateTolerance(Number(e.target.value))}
              className="bg-canvas-dark border-hairline-dark text-white h-9 rounded-none font-mono text-xs focus:border-cyber-blue"
            />
            <p className="text-[10px] text-gray-500 font-mono">
              Standar Komdis: 15 Menit. Scan QR setelah batas ini dianggap
              Telat.
            </p>
          </div>

          <DialogFooter className="gap-2 pt-3 border-t border-hairline-dark">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="bg-canvas-dark border-hairline-dark text-gray-300 font-mono text-xs rounded-none cursor-pointer"
            >
              BATAL
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-cyber-blue hover:bg-cyber-blue/90 text-white font-mono text-xs uppercase tracking-wider rounded-none cursor-pointer"
            >
              {isPending ? (
                <>
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    size={14}
                    className="animate-spin mr-1.5"
                  />
                  MEMPROSES...
                </>
              ) : (
                "SIMPAN KEGIATAN KOMDIS"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
