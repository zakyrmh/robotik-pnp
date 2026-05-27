"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { submitPiketReport } from "@/lib/actions/piket";

// Custom SVG Icons
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-indigo-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-rose-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-emerald-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const PhotoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

interface PiketClientProps {
  profile: {
    id: string;
    email: string;
    role: string;
    is_onboarded: boolean;
  };
  schedules: {
    id: string;
    day: string;
    members: {
      profile_id: string;
      nim: string;
      name: string;
    }[];
  }[];
  myAssignments: {
    schedule_id: string;
    day: string;
  }[];
  logs: {
    id: string;
    duty_date: string;
    notes: string | null;
    proof_image_url: string;
    is_verified: boolean;
    schedule_id: string;
    schedule_day: string;
    reporter_id: string;
    reporter_name: string;
    reporter_nim: string;
  }[];
}

const INDO_DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

export function PiketClient({ profile, schedules, myAssignments, logs }: PiketClientProps) {
  const router = useRouter();

  // Selected schedule tab for viewing members
  const [selectedDayTab, setSelectedDayTab] = useState<string>("Senin");

  // Reporting states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [photoBefore, setPhotoBefore] = useState<File | null>(null);
  const [photoAfter, setPhotoAfter] = useState<File | null>(null);
  const [photoBeforePreview, setPhotoBeforePreview] = useState<string | null>(null);
  const [photoAfterPreview, setPhotoAfterPreview] = useState<string | null>(null);

  // File Input Refs
  const fileBeforeRef = useRef<HTMLInputElement>(null);
  const fileAfterRef = useRef<HTMLInputElement>(null);

  // Image Preview Modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Determine user's active schedule for today
  const daysMap = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
  const todayDayName = daysMap[new Date().getDay()];

  // Check if today is a scheduled day for the user
  const todayAssignment = myAssignments.find((a) => a.day === todayDayName);
  const isScheduledToday = !!todayAssignment;

  // Handle file drops & selections
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/jpeg") && !file.type.startsWith("image/jpg")) {
        toast.error("Harap unggah berkas bertipe JPEG/JPG agar metadata EXIF terbaca.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "before") {
          setPhotoBefore(file);
          setPhotoBeforePreview(reader.result as string);
        } else {
          setPhotoAfter(file);
          setPhotoAfterPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, type: "before" | "after") => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith("image/jpeg") && !file.type.startsWith("image/jpg")) {
        toast.error("Harap unggah berkas bertipe JPEG/JPG agar metadata EXIF terbaca.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "before") {
          setPhotoBefore(file);
          setPhotoBeforePreview(reader.result as string);
        } else {
          setPhotoAfter(file);
          setPhotoAfterPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (type: "before" | "after") => {
    if (type === "before") {
      setPhotoBefore(null);
      setPhotoBeforePreview(null);
      if (fileBeforeRef.current) fileBeforeRef.current.value = "";
    } else {
      setPhotoAfter(null);
      setPhotoAfterPreview(null);
      if (fileAfterRef.current) fileAfterRef.current.value = "";
    }
  };

  // Submit report handler
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!todayAssignment) {
      toast.error("Anda tidak memiliki jadwal piket hari ini.");
      return;
    }

    if (!photoBefore || !photoAfter || !notes.trim()) {
      toast.error("Mohon isi catatan dan unggah kedua foto (sebelum & sesudah).");
      return;
    }

    setIsSubmitting(true);
    const loadToast = toast.loading("Memvalidasi EXIF & mengirim laporan piket...");

    const formData = new FormData();
    formData.append("schedule_id", todayAssignment.schedule_id);
    formData.append("notes", notes);
    formData.append("photo_before", photoBefore);
    formData.append("photo_after", photoAfter);

    try {
      const res = await submitPiketReport(formData);
      toast.dismiss(loadToast);

      if (res.success) {
        toast.success(res.message);
        setNotes("");
        setPhotoBefore(null);
        setPhotoBeforePreview(null);
        setPhotoAfter(null);
        setPhotoAfterPreview(null);
        router.refresh();
      } else {
        toast.error(res.message || "Gagal mengirim laporan.");
      }
    } catch (err: unknown) {
      toast.dismiss(loadToast);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Terjadi kesalahan sistem: " + errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Panel */}
      <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Laporan Piket Harian
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Laporkan piket kebersihan lab dengan mengunggah dokumentasi foto sebelum dan sesudah kegiatan.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column: Schedule Viewer & reporting status */}
        <div className="md:col-span-1 space-y-6">
          {/* Card: Active User Status */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-300">Status Hari Ini</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Hari ini:</span>
                <span className="font-semibold text-foreground">{todayDayName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Jadwal Anda:</span>
                {myAssignments.length > 0 ? (
                  <div className="flex gap-1 flex-wrap justify-end">
                    {myAssignments.map((a) => (
                      <Badge key={a.schedule_id} className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px]">
                        {a.day}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <Badge variant="outline" className="text-rose-400 border-rose-500/20 text-[10px]">
                    Tidak Ada
                  </Badge>
                )}
              </div>
              <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
                {isScheduledToday ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                    <CheckIcon />
                    <span>Anda terjadwal piket hari ini!</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Anda tidak dijadwalkan piket hari ini. Form lapor dinonaktifkan.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card: Daily Calendar Schedule View */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-300">
                <CalendarIcon />
                Kalender Piket
              </CardTitle>
              <CardDescription className="text-xs">
                Lihat daftar petugas kebersihan lab setiap harinya.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-3 gap-1 mb-4">
                {INDO_DAYS.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDayTab(day)}
                    className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      selectedDayTab === day
                        ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                        : "bg-transparent text-slate-400 border-transparent hover:bg-white/5"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>

              <div className="space-y-2 min-h-[150px]">
                {schedules.filter((s) => s.day === selectedDayTab).flatMap((s) => s.members).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Tidak ada petugas terjadwal.
                  </p>
                ) : (
                  schedules
                    .filter((s) => s.day === selectedDayTab)
                    .flatMap((s) => s.members)
                    .map((member) => (
                      <div
                        key={member.profile_id}
                        className={`p-2 rounded-xl border border-white/5 flex items-center justify-between text-xs transition-all ${
                          member.profile_id === profile.id
                            ? "bg-indigo-500/10 border-indigo-500/20"
                            : "bg-black/10"
                        }`}
                      >
                        <span className="font-medium text-foreground truncate max-w-[120px]">
                          {member.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {member.nim}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Form upload & Verification status */}
        <div className="md:col-span-2 space-y-6">
          {/* Lapor Piket Form */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Formulir Laporan Kebersihan</CardTitle>
              <CardDescription>
                Unggah dokumentasi piket Anda hari ini. Sistem akan memverifikasi metadata EXIF secara otomatis.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitReport}>
              <CardContent className="space-y-4">
                {/* Warning EXIF Alert */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-xs text-amber-400">
                  <span className="font-semibold select-none mt-0.5">⚠️ Penting:</span>
                  <p className="leading-relaxed">
                    Unggah foto asli bertipe JPG/JPEG langsung dari kamera HP Anda. Sistem akan memeriksa metadata EXIF tanggal pengambilan foto. Foto hasil tangkapan layar (screenshot), unduhan WA, atau hasil editing akan ditolak oleh sistem.
                  </p>
                </div>

                {/* Upload Columns */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Photo Before */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-300">Foto Sebelum (Before)</Label>
                    <div
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, "before")}
                      onClick={() => isScheduledToday && fileBeforeRef.current?.click()}
                      className={`aspect-video rounded-xl border border-dashed border-white/10 bg-white/5 hover:bg-white/[0.08] transition-all flex flex-col items-center justify-center p-3 text-center cursor-pointer relative overflow-hidden group ${
                        !isScheduledToday ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                      }`}
                    >
                      {photoBeforePreview ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photoBeforePreview} alt="Before preview" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removePhoto("before");
                              }}
                              className="p-2 bg-rose-500/80 hover:bg-rose-600 rounded-lg text-white transition-all shadow-lg"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-center"><UploadIcon /></div>
                          <p className="text-[10px] font-medium text-foreground">Klik / seret foto</p>
                          <p className="text-[8px] text-muted-foreground">JPEG/JPG max 5MB</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileBeforeRef}
                      type="file"
                      accept=".jpg,.jpeg"
                      onChange={(e) => handleFileChange(e, "before")}
                      className="hidden"
                    />
                  </div>

                  {/* Photo After */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-300">Foto Sesudah (After)</Label>
                    <div
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, "after")}
                      onClick={() => isScheduledToday && fileAfterRef.current?.click()}
                      className={`aspect-video rounded-xl border border-dashed border-white/10 bg-white/5 hover:bg-white/[0.08] transition-all flex flex-col items-center justify-center p-3 text-center cursor-pointer relative overflow-hidden group ${
                        !isScheduledToday ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                      }`}
                    >
                      {photoAfterPreview ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photoAfterPreview} alt="After preview" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removePhoto("after");
                              }}
                              className="p-2 bg-rose-500/80 hover:bg-rose-600 rounded-lg text-white transition-all shadow-lg"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-center"><UploadIcon /></div>
                          <p className="text-[10px] font-medium text-foreground">Klik / seret foto</p>
                          <p className="text-[8px] text-muted-foreground">JPEG/JPG max 5MB</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileAfterRef}
                      type="file"
                      accept=".jpg,.jpeg"
                      onChange={(e) => handleFileChange(e, "after")}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Notes Input */}
                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-xs font-semibold text-slate-300">Catatan / Laporan Kegiatan</Label>
                  <Textarea
                    id="notes"
                    disabled={!isScheduledToday || isSubmitting}
                    placeholder="Contoh: Menyapu area lantai utama lab, membersihkan debu meja PC 1-10, merapikan kabel kelistrikan."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-xl focus:border-indigo-500 text-xs py-3 h-20 text-white placeholder-slate-500"
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-black/10 border-t border-white/5 py-4">
                <Button
                  type="submit"
                  disabled={!isScheduledToday || isSubmitting}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-indigo-500/20 py-5 rounded-xl transition-all"
                >
                  {isSubmitting ? "Memproses Verifikasi..." : "Kirim Laporan Piket"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>

      {/* Section: Log History */}
      <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Riwayat Log Piket Lab</CardTitle>
          <CardDescription>Daftar lengkap laporan piket kebersihan laboratorium.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 overflow-x-auto">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Belum ada riwayat piket yang tercatat.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 text-muted-foreground font-medium text-xs">
                  <th className="px-4 py-3">Tanggal Tugas</th>
                  <th className="px-4 py-3">Petugas</th>
                  <th className="px-4 py-3">Hari</th>
                  <th className="px-4 py-3">Verifikasi</th>
                  <th className="px-4 py-3">Foto Bukti</th>
                  <th className="px-4 py-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-4 font-mono text-xs text-foreground">
                      {new Date(log.duty_date).toLocaleDateString([], {
                        dateStyle: "medium",
                      })}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{log.reporter_name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{log.reporter_nim}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground text-xs">
                      {log.schedule_day}
                    </td>
                    <td className="px-4 py-4">
                      {log.is_verified ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                          TERVERIFIKASI
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                          PENDING
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {log.proof_image_url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Supabase storage private bucket url bypass through a public wrapper if needed,
                            // or direct to supabase path since local environment might expose it.
                            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
                            const publicUrl = `${supabaseUrl}/storage/v1/object/sign/piket-proofs/${log.proof_image_url}`;
                            setPreviewImageUrl(publicUrl);
                          }}
                          className="border-white/5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg text-xs py-1 px-2.5 flex items-center gap-1"
                        >
                          <PhotoIcon />
                          Lihat Foto
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground max-w-[200px] truncate" title={log.notes || ""}>
                      {log.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImageUrl} onOpenChange={(open) => !open && setPreviewImageUrl(null)}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border border-white/10 rounded-2xl p-6 text-white text-center">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Foto Bukti Piket Lab</DialogTitle>
          </DialogHeader>
          <div className="my-4 aspect-video rounded-xl overflow-hidden bg-black/40 flex items-center justify-center border border-white/5 relative">
            {previewImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewImageUrl}
                alt="Foto bukti piket"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback for private signed URLs in local docker
                  const target = e.currentTarget;
                  target.src = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=500&q=80";
                  toast.error("Gagal memuat URL tanda tangan privat. Menampilkan fallback.");
                }}
              />
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setPreviewImageUrl(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-4"
            >
              Tutup Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
