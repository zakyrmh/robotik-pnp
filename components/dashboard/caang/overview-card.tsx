import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ShieldCheck, Bell, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OverviewCard() {
  return (
    <Card className="h-full border-none shadow-lg bg-linear-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Overview
        </CardTitle>
        <CardDescription>
          Ringkasan aktivitas dan informasi akun Anda hari ini.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {/* Kegiatan Hari Ini */}
        <div className="flex flex-col space-y-2 p-4 rounded-xl bg-white dark:bg-slate-900 border shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CalendarDays className="w-4 h-4" />
            <span className="text-sm font-medium">Kegiatan Hari Ini</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-sm font-medium">Tidak ada jadwal kegiatan</p>
            <p className="text-xs text-muted-foreground">
              Istirahat yang cukup!
            </p>
          </div>
        </div>

        {/* Status Akun */}
        <div className="flex flex-col space-y-2 p-4 rounded-xl bg-white dark:bg-slate-900 border shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-sm font-medium">Status Akun</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200"
            >
              Aktif
            </Badge>
            <span className="text-xs text-muted-foreground">
              Calon Anggota (Caang)
            </span>
          </div>
        </div>

        {/* Pengumuman Baru */}
        <div className="col-span-2 flex flex-col space-y-3 p-4 rounded-xl bg-white dark:bg-slate-900 border shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bell className="w-4 h-4" />
              <span className="text-sm font-medium">Pengumuman Baru</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-primary"
            >
              Lihat Semua
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Selamat Datang di Robotik!
                </p>
                <p className="text-xs text-muted-foreground">
                  Silahkan lengkapi data pendaftaran Anda.
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-slate-300 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none text-muted-foreground">
                  Jadwal Interview
                </p>
                <p className="text-xs text-muted-foreground">
                  Akan diumumkan setelah verifikasi berkas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Aktivitas Terbaru */}
        <div className="col-span-2 flex flex-col space-y-3 p-4 rounded-xl bg-white dark:bg-slate-900 border shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">Aktivitas Terbaru</span>
          </div>
          <div className="relative pl-4 border-l border-slate-200 dark:border-slate-800 space-y-4">
            <div className="relative text-sm">
              <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-white dark:ring-slate-950" />
              <p className="font-medium text-foreground">
                Melakukan Pembayaran
              </p>
              <p className="text-xs text-muted-foreground">2 jam yang lalu</p>
            </div>
            <div className="relative text-sm">
              <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-slate-800 ring-4 ring-white dark:ring-slate-950" />
              <p className="font-medium text-foreground">
                Upload Berkas Dokumen
              </p>
              <p className="text-xs text-muted-foreground">5 jam yang lalu</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
