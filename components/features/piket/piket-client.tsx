"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Upload01Icon,
  Delete02Icon,
  CheckmarkCircle01Icon,
  Image01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { submitPiketReport } from "@/lib/actions/piket";

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

const INDO_DAYS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

export function PiketClient({
  profile,
  schedules,
  myAssignments,
  logs,
}: PiketClientProps) {
  const router = useRouter();

  // Selected schedule tab for viewing members
  const [selectedDayTab, setSelectedDayTab] = useState<string>("Senin");

  // Reporting states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [photoBefore, setPhotoBefore] = useState<File | null>(null);
  const [photoAfter, setPhotoAfter] = useState<File | null>(null);
  const [photoBeforePreview, setPhotoBeforePreview] = useState<string | null>(
    null,
  );
  const [photoAfterPreview, setPhotoAfterPreview] = useState<string | null>(
    null,
  );

  // File Input Refs
  const fileBeforeRef = useRef<HTMLInputElement>(null);
  const fileAfterRef = useRef<HTMLInputElement>(null);

  // Image Preview Modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Determine user's active schedule for today
  const daysMap = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ] as const;
  const todayDayName = daysMap[new Date().getDay()];

  // Check if today is a scheduled day for the user
  const todayAssignment = myAssignments.find((a) => a.day === todayDayName);
  const isScheduledToday = !!todayAssignment;

  // Handle file drops & selections
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "before" | "after",
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (
        !file.type.startsWith("image/jpeg") &&
        !file.type.startsWith("image/jpg")
      ) {
        toast.error(
          "Harap unggah berkas bertipe JPEG/JPG agar metadata EXIF terbaca.",
        );
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
      if (
        !file.type.startsWith("image/jpeg") &&
        !file.type.startsWith("image/jpg")
      ) {
        toast.error(
          "Harap unggah berkas bertipe JPEG/JPG agar metadata EXIF terbaca.",
        );
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
      toast.error(
        "Mohon isi catatan dan unggah kedua foto (sebelum & sesudah).",
      );
      return;
    }

    setIsSubmitting(true);
    const loadToast = toast.loading(
      "Memvalidasi EXIF & mengirim laporan piket...",
    );

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
    <div className="space-y-6 w-full max-w-4xl mx-auto px-2 sm:px-4 lg:px-6">
      {/* Header Panel - Mobile First & Precision Blueprint Style */}
      <div className="relative border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-xs overflow-hidden">
        {/* Tricolor Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-[#1e3a8a] via-[#3b82f6] to-[#f97316]" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-[#0a192f] dark:text-slate-100 font-display flex items-center gap-2.5">
              <HugeiconsIcon
                icon={Calendar03Icon}
                size={24}
                className="text-[#1e3a8a] dark:text-blue-400 shrink-0"
              />
              Laporan Piket Harian
            </h1>
            <p className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
              Dokumentasi &amp; Verifikasi Kebersihan Laboratorium Robotik PNP
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-[#ffedd5] dark:bg-orange-950/60 text-[#c2410c] dark:text-orange-300 border border-orange-200 dark:border-orange-900/60 px-3 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-wider font-semibold">
              HARI INI: {todayDayName.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Grid: Mobile First (1 col on mobile, 3 cols on md+) */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {/* Left Column: User Status & Schedule Viewer */}
        <div className="md:col-span-1 space-y-4 sm:space-y-6">
          {/* Card: Active User Status */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl border-l-4 border-l-[#1e3a8a] dark:border-l-blue-500 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display font-medium text-[#0a192f] dark:text-slate-100">
                Status Piket Anda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">
                  JADWAL ANDA:
                </span>
                {myAssignments.length > 0 ? (
                  <div className="flex gap-1 flex-wrap justify-end">
                    {myAssignments.map((a) => (
                      <Badge
                        key={a.schedule_id}
                        className="bg-blue-50 dark:bg-blue-950/60 text-[#1e3a8a] dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 text-[10px] rounded-full px-2"
                      >
                        {a.day}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60 text-[10px] rounded-full"
                  >
                    TIDAK ADA
                  </Badge>
                )}
              </div>
              <div className="pt-1">
                {isScheduledToday ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
                    <span>Anda bertugas piket hari ini!</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
                    Anda tidak dijadwalkan piket hari ini. Form lapor tidak
                    dapat digunakan.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card: Daily Calendar Schedule View */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-display font-medium flex items-center gap-2 text-[#0a192f] dark:text-slate-100">
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  size={18}
                  className="text-[#1e3a8a] dark:text-blue-400"
                />
                Jadwal Petugas Lab
              </CardTitle>
              <CardDescription className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Pilih hari untuk melihat daftar petugas piket.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-1.5">
                {INDO_DAYS.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDayTab(day)}
                    className={`py-1.5 rounded-lg font-mono text-xs font-semibold border transition-all cursor-pointer ${
                      selectedDayTab === day
                        ? "bg-[#1e3a8a] dark:bg-blue-600 text-white border-[#1e3a8a] dark:border-blue-600 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>

              <div className="space-y-2 min-h-[140px] pt-1">
                {schedules
                  .filter((s) => s.day === selectedDayTab)
                  .flatMap((s) => s.members).length === 0 ? (
                  <p className="text-xs font-mono text-slate-400 dark:text-slate-500 text-center py-6">
                    Tidak ada petugas terjadwal.
                  </p>
                ) : (
                  schedules
                    .filter((s) => s.day === selectedDayTab)
                    .flatMap((s) => s.members)
                    .map((member) => (
                      <div
                        key={member.profile_id}
                        className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                          member.profile_id === profile.id
                            ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-[#1e3a8a] dark:text-blue-300 font-semibold"
                            : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <span className="font-display font-medium truncate max-w-[130px]">
                          {member.name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                          {member.nim || "-"}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Lapor Piket Form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <CardTitle className="text-base font-display font-medium text-[#0a192f] dark:text-slate-100">
                Formulir Laporan Kebersihan
              </CardTitle>
              <CardDescription className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Unggah dokumentasi piket Anda. Sistem memverifikasi metadata
                EXIF secara otomatis.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitReport}>
              <CardContent className="space-y-4 pt-4">
                {/* Warning EXIF Alert */}
                <div className="p-3 bg-[#ffedd5] dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 rounded-lg flex items-start gap-2.5 text-xs text-[#c2410c] dark:text-orange-300 font-mono">
                  <span className="font-bold shrink-0 mt-0.5">⚠️ PENTING:</span>
                  <p className="leading-relaxed font-body">
                    Unggah foto asli bertipe JPG/JPEG langsung dari kamera HP
                    Anda. Sistem akan mengonfirmasi metadata EXIF tanggal
                    pengambilan foto. Tangkapan layar / unduhan WA akan ditolak.
                  </p>
                </div>

                {/* Upload Columns (Mobile First: 1 col on mobile, 2 cols on sm+) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Photo Before */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wider">
                      Foto Sebelum (Before)
                    </Label>
                    <div
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, "before")}
                      onClick={() =>
                        isScheduledToday && fileBeforeRef.current?.click()
                      }
                      className={`aspect-video rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex flex-col items-center justify-center p-3 text-center cursor-pointer relative overflow-hidden group ${
                        !isScheduledToday
                          ? "opacity-50 cursor-not-allowed pointer-events-none"
                          : ""
                      }`}
                    >
                      {photoBeforePreview ? (
                        <>
                          <Image
                            src={photoBeforePreview}
                            alt="Before preview"
                            fill
                            sizes="300px"
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removePhoto("before");
                              }}
                              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-all shadow-md cursor-pointer"
                            >
                              <HugeiconsIcon icon={Delete02Icon} size={18} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-center text-[#1e3a8a] dark:text-blue-400">
                            <HugeiconsIcon icon={Upload01Icon} size={24} />
                          </div>
                          <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 font-display">
                            Klik / seret foto di sini
                          </p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                            JPEG/JPG (Max 5MB)
                          </p>
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
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wider">
                      Foto Sesudah (After)
                    </Label>
                    <div
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, "after")}
                      onClick={() =>
                        isScheduledToday && fileAfterRef.current?.click()
                      }
                      className={`aspect-video rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex flex-col items-center justify-center p-3 text-center cursor-pointer relative overflow-hidden group ${
                        !isScheduledToday
                          ? "opacity-50 cursor-not-allowed pointer-events-none"
                          : ""
                      }`}
                    >
                      {photoAfterPreview ? (
                        <>
                          <Image
                            src={photoAfterPreview}
                            alt="After preview"
                            fill
                            sizes="300px"
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removePhoto("after");
                              }}
                              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-all shadow-md cursor-pointer"
                            >
                              <HugeiconsIcon icon={Delete02Icon} size={18} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-center text-[#1e3a8a] dark:text-blue-400">
                            <HugeiconsIcon icon={Upload01Icon} size={24} />
                          </div>
                          <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 font-display">
                            Klik / seret foto di sini
                          </p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                            JPEG/JPG (Max 5MB)
                          </p>
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
                  <Label
                    htmlFor="notes"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wider"
                  >
                    Catatan / Rincian Laporan Kebersihan
                  </Label>
                  <Textarea
                    id="notes"
                    disabled={!isScheduledToday || isSubmitting}
                    placeholder="Contoh: Menyapu area lantai utama lab, membersihkan debu meja PC 1-10..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-lg focus:border-[#f97316] text-xs py-2.5 min-h-[80px] text-[#0a192f] dark:text-slate-100 placeholder:text-slate-400 font-body"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={!isScheduledToday || isSubmitting}
                    className="w-full bg-[#1e3a8a] hover:bg-[#1e40af] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-medium text-xs rounded-lg py-2.5 shadow-xs uppercase font-mono tracking-wider cursor-pointer"
                  >
                    {isSubmitting
                      ? "Memproses Verifikasi..."
                      : "Kirim Laporan Piket"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      </div>

      {/* Section: Log History */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <CardTitle className="text-base font-display font-medium text-[#0a192f] dark:text-slate-100">
            Riwayat Log Piket Lab
          </CardTitle>
          <CardDescription className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Daftar lengkap laporan piket kebersihan laboratorium.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">
              Belum ada riwayat piket yang tercatat.
            </div>
          ) : (
            <>
              {/* Mobile View: Cards */}
              <div className="block md:hidden space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-xl space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-display font-medium text-sm text-[#0a192f] dark:text-slate-100 block">
                          {log.reporter_name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                          {log.reporter_nim || "-"}
                        </span>
                      </div>
                      {log.is_verified ? (
                        <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 text-[10px] rounded-full">
                          TERVERIFIKASI
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 text-[10px] rounded-full">
                          PENDING
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                          TANGGAL &amp; HARI
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {new Date(log.duty_date).toLocaleDateString("id-ID", {
                            dateStyle: "medium",
                          })}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          ({log.schedule_day})
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                          DOKUMENTASI
                        </span>
                        {log.proof_image_url ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const supabaseUrl =
                                process.env.NEXT_PUBLIC_SUPABASE_URL ||
                                "http://localhost:54321";
                              const publicUrl = `${supabaseUrl}/storage/v1/object/sign/piket-proofs/${log.proof_image_url}`;
                              setPreviewImageUrl(publicUrl);
                            }}
                            className="border-slate-200 dark:border-slate-700 text-[#1e3a8a] dark:text-blue-400 font-mono text-[10px] uppercase h-7 px-2"
                          >
                            <HugeiconsIcon
                              icon={Image01Icon}
                              size={12}
                              className="mr-1"
                            />
                            Foto
                          </Button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>
                    </div>

                    {log.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-body border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                        {log.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 font-mono text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      <th className="p-3">Tanggal Tugas</th>
                      <th className="p-3">Petugas</th>
                      <th className="p-3">Hari</th>
                      <th className="p-3">Verifikasi</th>
                      <th className="p-3">Foto Bukti</th>
                      <th className="p-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                          {new Date(log.duty_date).toLocaleDateString("id-ID", {
                            dateStyle: "medium",
                          })}
                        </td>
                        <td className="p-3">
                          <span className="font-display font-medium text-[#0a192f] dark:text-slate-100 block">
                            {log.reporter_name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                            {log.reporter_nim || "-"}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                          {log.schedule_day}
                        </td>
                        <td className="p-3">
                          {log.is_verified ? (
                            <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 text-[10px] rounded-full">
                              TERVERIFIKASI
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 text-[10px] rounded-full">
                              PENDING
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
                          {log.proof_image_url ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const supabaseUrl =
                                  process.env.NEXT_PUBLIC_SUPABASE_URL ||
                                  "http://localhost:54321";
                                const publicUrl = `${supabaseUrl}/storage/v1/object/sign/piket-proofs/${log.proof_image_url}`;
                                setPreviewImageUrl(publicUrl);
                              }}
                              className="border-slate-200 dark:border-slate-700 text-[#1e3a8a] dark:text-blue-400 font-mono text-[11px] uppercase h-8 px-2.5"
                            >
                              <HugeiconsIcon
                                icon={Image01Icon}
                                size={14}
                                className="mr-1"
                              />
                              Lihat Foto
                            </Button>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>
                        <td
                          className="p-3 text-slate-600 dark:text-slate-400 max-w-[200px] truncate"
                          title={log.notes || ""}
                        >
                          {log.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog
        open={!!previewImageUrl}
        onOpenChange={(open) => !open && setPreviewImageUrl(null)}
      >
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center">
          <DialogHeader>
            <DialogTitle className="text-base font-display font-medium text-[#0a192f] dark:text-slate-100">
              Foto Bukti Piket Lab
            </DialogTitle>
          </DialogHeader>
          <div className="my-4 aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-800 relative">
            {previewImageUrl && (
              <Image
                src={previewImageUrl}
                alt="Foto bukti piket"
                fill
                sizes="(max-width: 500px) 100vw, 500px"
                className="object-cover"
              />
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setPreviewImageUrl(null)}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a192f] dark:text-slate-100 rounded-lg py-2.5 font-mono text-xs uppercase"
            >
              Tutup Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
