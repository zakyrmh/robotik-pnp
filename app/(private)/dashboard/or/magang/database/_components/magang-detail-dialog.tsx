"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  FileText,
  CheckCircle2,
  User,
  BookOpen,
  MapPin,
  Briefcase,
} from "lucide-react";
import { getMagangApplicationDetail } from "@/app/actions/magang-admin.action";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";

interface MagangDetailDialogProps {
  userId: string | null;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MagangDetailDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: MagangDetailDialogProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (open && userId) {
      if (isMounted) {
        setTimeout(() => {
          if (!isMounted) return;
          setIsLoading(true);
          setError(null);
        }, 0);
      }
      getMagangApplicationDetail(userId)
        .then((res) => {
          if (!isMounted) return;
          if (res.error) setError(res.error);
          else setData(res.data);
        })
        .catch(() => {
          if (isMounted) setError("Terjadi kesalahan sistem.");
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      setTimeout(() => {
        if (isMounted) setData(null);
      }, 0);
    }
    return () => {
      isMounted = false;
    };
  }, [open, userId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b bg-muted/20">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Detail Formulir Magang
          </DialogTitle>
          <DialogDescription>
            Bukti Rekam Pendaftaran milik{" "}
            <span className="font-semibold text-foreground">{userName}</span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[75vh] w-full">
          <div className="p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                <p>Mengambil data dari server...</p>
              </div>
            ) : error ? (
              <div className="text-center py-20 text-red-500">
                <p>{error}</p>
              </div>
            ) : !data ? (
              <div className="text-center py-20 text-muted-foreground">
                <p>Data tidak ditemukan.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* WAKTU & STATUS */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/40 p-4 rounded-xl border border-muted">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Status Validasi
                    </p>
                    {data.status === "pending" && (
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200 shadow-none hover:bg-orange-100">
                        Menunggu Verifikasi
                      </Badge>
                    )}
                    {data.status === "approved" && (
                      <Badge className="bg-green-500 hover:bg-green-600">
                        Terverifikasi Publik
                      </Badge>
                    )}
                    {data.status === "rejected" && (
                      <Badge variant="destructive">Pendaftaran Ditolak</Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Metode Pendaftaran
                    </p>
                    {data.is_manual_registration ? (
                      <span className="flex items-center text-sm font-medium text-blue-700">
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Oleh Admin
                      </span>
                    ) : (
                      <span className="flex items-center text-sm font-medium text-slate-700">
                        <User className="w-4 h-4 mr-1.5" /> Mandiri (Caang)
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Waktu Submit Form
                    </p>
                    <p className="text-sm font-medium">
                      {format(
                        new Date(data.created_at),
                        "dd MMMM yyyy, HH:mm",
                        { locale: id },
                      )}
                    </p>
                  </div>
                </div>

                {/* STEP 1: MINAT & KEMAMPUAN */}
                <section>
                  <h3 className="text-base font-semibold flex items-center gap-2 mb-4 text-primary">
                    <BookOpen className="h-5 w-5" />
                    Profil Minat & Kemampuan
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border rounded-xl p-5 shadow-sm">
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        Bidang yang Diminati:
                      </p>
                      <div className="flex flex-wrap gap-2">
                         <Badge variant="secondary" className="capitalize text-sm px-3 py-1 bg-blue-100 text-blue-800">
                           {data.minat || "Tidak Diset"}
                         </Badge>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground mb-1">
                        Alasan Minat:
                      </p>
                      <div className="p-3 bg-muted/40 rounded-lg text-sm border whitespace-pre-wrap leading-relaxed">
                        {data.alasan_minat || (
                          <span className="italic text-muted-foreground">
                            Tidak Mengisi
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground mb-1">
                        Deskripsi Skill & Pengalaman:
                      </p>
                      <div className="p-3 bg-muted/40 rounded-lg text-sm border whitespace-pre-wrap leading-relaxed">
                        {data.skill || (
                          <span className="italic text-muted-foreground">
                            Tidak Mengisi
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <Separator />

                {/* STEP 2: MAGANG DIVISI */}
                <section>
                  <h3 className="text-base font-semibold flex items-center gap-2 mb-4 text-orange-600">
                    <MapPin className="h-5 w-5" />
                    Pilihan & Alasan Magang Divisi
                  </h3>
                  <div className="space-y-4">
                    {/* Pilihan 1 */}
                    <div className="border rounded-xl p-5 bg-card shadow-sm border-l-4 border-l-orange-500">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">
                            Pilihan 1
                          </p>
                          <p className="text-lg font-semibold">
                            {data.divisi_1?.name}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={data.yakin_divisi_1 === "Yakin" ? "bg-green-50 text-green-800 border-green-200" : "bg-orange-50 text-orange-800"}
                        >
                          Tingkat Keyakinan: {data.yakin_divisi_1 || "?"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Alasan Memilih:
                      </p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {data.alasan_divisi_1 || <span className="italic text-muted-foreground">Kosong</span>}
                      </p>
                    </div>

                    {/* Pilihan 2 */}
                    {data.divisi_2_id && (
                    <div className="border border-muted rounded-xl p-5 bg-card shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                            Pilihan 2 (Alternatif)
                          </p>
                          <p className="text-base font-medium">
                            {data.divisi_2?.name}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={data.yakin_divisi_2 === "Yakin" ? "bg-green-50 text-green-800 border-green-200" : "bg-orange-50 text-orange-800"}
                        >
                          Tingkat Keyakinan: {data.yakin_divisi_2 || "?"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Alasan Memilih:
                      </p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {data.alasan_divisi_2 || <span className="italic text-muted-foreground">Kosong</span>}
                      </p>
                    </div>
                    )}
                  </div>
                </section>

                <Separator />

                {/* STEP 3: MAGANG DEPARTEMEN */}
                <section>
                  <h3 className="text-base font-semibold flex items-center gap-2 mb-4 text-blue-600">
                    <Briefcase className="h-5 w-5" />
                    Pilihan & Alasan Magang Departemen
                  </h3>
                  <div className="space-y-4">
                    {/* Pilihan 1 */}
                    <div className="border rounded-xl p-5 bg-card shadow-sm border-l-4 border-l-blue-500">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
                            Pilihan Utama
                          </p>
                          <p className="text-lg font-semibold">
                            {data.dept_1?.name}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={data.yakin_dept_1 === "Yakin" ? "bg-green-50 text-green-800 border-green-200" : "bg-blue-50 text-blue-800"}
                        >
                          Tingkat Keyakinan: {data.yakin_dept_1 || "?"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Alasan Bergabung:
                      </p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {data.alasan_dept_1 || <span className="italic text-muted-foreground">Kosong</span>}
                      </p>
                    </div>

                    {/* Pilihan 2 */}
                    {data.dept_2_id && (
                      <div className="border border-muted rounded-xl p-5 bg-card shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                              Pilihan Tambahan
                            </p>
                            <p className="text-base font-medium">
                              {data.dept_2?.name}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={data.yakin_dept_2 === "Yakin" ? "bg-green-50 text-green-800 border-green-200" : "bg-blue-50 text-blue-800"}
                          >
                            Tingkat Keyakinan: {data.yakin_dept_2 || "?"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Alasan Bergabung:
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {data.alasan_dept_2 || <span className="italic text-muted-foreground">Kosong</span>}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
