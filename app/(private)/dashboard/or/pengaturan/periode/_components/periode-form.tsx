"use client";

import { useState, useTransition } from "react";
import { Save, Loader2, PlayCircle, StopCircle, Tag } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  updateRegistrationPeriod,
  type RegistrationPeriod,
} from "@/app/actions/or-settings.action";

interface Props {
  initialData: RegistrationPeriod | null;
}

export function PeriodeForm({ initialData }: Props) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<RegistrationPeriod>({
    is_open: initialData?.is_open ?? false,
    period_label: initialData?.period_label ?? "",
    start_date: initialData?.start_date
      ? new Date(initialData.start_date).toISOString().slice(0, 16)
      : "",
    end_date: initialData?.end_date
      ? new Date(initialData.end_date).toISOString().slice(0, 16)
      : "",
  });

  const handleChange = (
    field: keyof RegistrationPeriod,
    value: string | boolean,
  ) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!data.period_label?.trim()) {
      toast.error("Kode periode OR wajib diisi (contoh: OR-20).");
      return;
    }

    if (data.is_open) {
      if (!data.start_date || !data.end_date) {
        toast.error(
          "Tanggal mulai dan selesai wajib diisi jika pendaftaran dibuka.",
        );
        return;
      }
      if (new Date(data.start_date) >= new Date(data.end_date)) {
        toast.error("Waktu selesai harus lebih besar dari waktu mulai.");
        return;
      }
    }

    startTransition(async () => {
      const result = await updateRegistrationPeriod({
        is_open: data.is_open,
        period_label: data.period_label?.trim() || "",
        start_date: data.start_date
          ? new Date(data.start_date).toISOString()
          : null,
        end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Pengaturan periode berhasil disimpan.");
      }
    });
  };

  return (
    <Card className="max-w-2xl lg:max-w-full">
      <CardHeader>
        <CardTitle>Pengaturan Pendaftaran</CardTitle>
        <CardDescription>
          Jika status pendaftaran terbuka, tautan register di halaman utama akan
          aktif.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Kode periode OR */}
        <div className="space-y-2">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Tag className="size-4" />
            Periode Open Recruitment
          </Label>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
            Masukkan kode periode rekrutmen saat ini, misalnya{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">OR-20</code>{" "}
            untuk Open Recruitment ke-20.
          </p>
          <Input
            type="text"
            placeholder="Contoh: OR-20"
            value={data.period_label || ""}
            onChange={(e) => handleChange("period_label", e.target.value.toUpperCase())}
            className="max-w-xs font-mono uppercase tracking-wider"
          />
        </div>

        {/* Toggle buka/tutup */}
        <div className="rounded-xl border p-5 flex items-center justify-between bg-muted/20">
          <div className="space-y-1">
            <Label className="text-base font-semibold">
              Status Pendaftaran
            </Label>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              {data.is_open
                ? "Pendaftaran DIBUKA. Pendaftar baru dapat membuat akun dan mengisi dokumen."
                : "Pendaftaran DITUTUP. Akses form pendaftaran diblokir bagi calon anggota baru."}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Switch
              checked={data.is_open}
              onCheckedChange={(val) => handleChange("is_open", val)}
              className="data-[state=checked]:bg-emerald-500"
            />
            <StatusBadge isOpen={data.is_open} />
          </div>
        </div>

        {/* Input tanggal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Tanggal & Waktu Buka</Label>
            <Input
              type="datetime-local"
              value={data.start_date || ""}
              onChange={(e) => handleChange("start_date", e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Format 24 jam. Kapan formulir aktif.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Tanggal & Waktu Tutup</Label>
            <Input
              type="datetime-local"
              value={data.end_date || ""}
              onChange={(e) => handleChange("end_date", e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Kapan akses otomatis terputus.
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end border-t pt-4">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 size-4" /> Simpan Pengaturan
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function StatusBadge({ isOpen }: { isOpen: boolean }) {
  if (isOpen) {
    return (
      <span className="flex items-center gap-1 bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-medium">
        <PlayCircle className="size-3" /> Dibuka
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 bg-zinc-500/15 text-zinc-600 border border-zinc-500/30 text-[10px] px-2 py-0.5 rounded-full font-medium">
      <StopCircle className="size-3" /> Ditutup
    </span>
  );
}
