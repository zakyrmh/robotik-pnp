"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { updateInternshipPeriod, type InternshipPeriod } from "@/app/actions/or-settings.action";

function formatDateTimeLocal(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const tzOffset = d.getTimezoneOffset() * 60000; //offset in milliseconds
  return (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
}

export function SetupMagangForm({ initialData }: { initialData: InternshipPeriod }) {
  const [isOpen, setIsOpen] = useState(initialData.is_open);
  const [startDate, setStartDate] = useState(formatDateTimeLocal(initialData.start_date));
  const [endDate, setEndDate] = useState(formatDateTimeLocal(initialData.end_date));
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOpen && (!startDate || !endDate)) {
      toast.error("Tanggal mulai dan selesai wajib diisi saat pendaftaran dibuka.");
      return;
    }

    setIsPending(true);
    
    // Convert back to UTC ISO String
    const startIso = startDate ? new Date(startDate).toISOString() : null;
    const endIso = endDate ? new Date(endDate).toISOString() : null;

    const res = await updateInternshipPeriod({
      is_open: isOpen,
      start_date: startIso,
      end_date: endIso
    });

    setIsPending(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Pengaturan jadwal magang berhasil disimpan");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Jadwal Pendaftaran Magang</CardTitle>
          <CardDescription>
            Pendaftaran akan otomatis beralih antara status Buka dan Tutup berdasarkan rentang waktu yang diatur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base text-card-foreground">Buka Modul Magang (Master Switch)</Label>
              <p className="text-sm text-muted-foreground">
                Jika toggle ini dimatikan (Off), halaman caang akan terkunci terlepas dari periode tanggal yang telah diset.
              </p>
            </div>
            <Switch
              checked={isOpen}
              onCheckedChange={setIsOpen}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="start_date">Waktu Pembukaan Pendaftaran</Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required={isOpen}
                disabled={!isOpen}
              />
              <p className="text-xs text-muted-foreground mt-1">Halaman form akan terbuka otomatis pada waktu ini.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Waktu Penutupan Pendaftaran</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required={isOpen}
                disabled={!isOpen}
              />
              <p className="text-xs text-muted-foreground mt-1">Pendaftar telat akan ditolak otomatis oleh sistem.</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-4 border-t bg-muted/40">
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Simpan Peraturan Jadwal
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
