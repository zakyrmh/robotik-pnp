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
import { submitPiketReport } from "@/lib/actions/piket";
import {
  getPiketWeekInfo,
  isMemberOnInternship,
  MAX_PIKET_ATTEMPTS_PER_WEEK as MAX_WEEKLY_ATTEMPTS,
} from "@/lib/utils/piket-date";
import { getPublicR2Url } from "@/lib/storage/r2";
import { processPiketImage } from "@/lib/utils/image-processing";
import {
  getPiketLogStatus,
  type PiketProfile,
  type PiketSchedule,
  type PiketAssignment,
  type PiketLog,
  type PiketFine,
} from "./types";
import { PiketLogStatusBadge } from "./piket-status-badge";
import { PiketPhotoPreviewDialog } from "./piket-photo-preview-dialog";

export interface PiketReportClientProps {
  profile: PiketProfile;
  availablePeriods: string[];
  schedules: PiketSchedule[];
  myAssignments: PiketAssignment[];
  myLogs: PiketLog[];
  myFines: PiketFine[];
}

const PEKAN_NUMBERS = [1, 2, 3, 4] as const;

export function PiketReportClient({
  profile,
  availablePeriods,
  schedules,
  myAssignments,
  myLogs,
  myFines,
}: PiketReportClientProps) {
  const router = useRouter();

  // Get current ISO cross-month week info
  const weekInfo = getPiketWeekInfo(new Date());

  // Active period state
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    availablePeriods[0] || "2026/2027",
  );

  // Selected schedule tab for viewing members (default to current week)
  const [selectedWeekTab, setSelectedWeekTab] = useState<number>(
    weekInfo.weekNumber,
  );

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

  // Image Preview Modal State
  const [previewModal, setPreviewModal] = useState<{
    beforeUrl: string | null;
    afterUrl: string | null;
    reporterName: string;
    dutyDate: string;
    activeTab: "before" | "after";
  } | null>(null);

  // Filter schedules and user assignments by selected period
  const periodSchedules = schedules.filter(
    (s) => !s.academic_period || s.academic_period === selectedPeriod,
  );

  const periodAssignments = myAssignments.filter(
    (a) => !a.academic_period || a.academic_period === selectedPeriod,
  );

  const periodLogs = myLogs.filter(
    (l) => !l.academic_period || l.academic_period === selectedPeriod,
  );

  // Check if current week is a scheduled week for the user in the selected period
  const currentWeekAssignment = periodAssignments.find(
    (a) => a.week_number === weekInfo.weekNumber,
  );
  const isScheduledThisWeek = !!currentWeekAssignment;

  // Check if current logged-in user is currently on internship
  const currentUserIsOnInternship = isMemberOnInternship(
    profile,
    weekInfo.startIsoDate,
  );

  const formatRp = (n: number) => `Rp${Number(n).toLocaleString("id-ID")}`;

  const myUnpaidFines = myFines.filter((f) => f.status !== "lunas");

  // Percobaan upload milik sendiri pada pekan berjalan (ditolak ikut dihitung)
  const myWeekAttempts = periodLogs.filter(
    (l) =>
      l.reporter_id === profile.id &&
      l.duty_date >= weekInfo.startIsoDate &&
      l.duty_date <= weekInfo.endIsoDate,
  ).length;
  const myAttemptsLeft = Math.max(0, MAX_WEEKLY_ATTEMPTS - myWeekAttempts);

  // Handle file drops & selections with automatic compression & HEIC support
  const storeProcessedPhoto = (
    type: "before" | "after",
    processedFile: File,
    previewUrl: string,
  ) => {
    if (type === "before") {
      setPhotoBefore(processedFile);
      setPhotoBeforePreview(previewUrl);
    } else {
      setPhotoAfter(processedFile);
      setPhotoAfterPreview(previewUrl);
    }
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "before" | "after",
  ) => {
    if (e.target.files && e.target.files[0]) {
      const rawFile = e.target.files[0];
      const loadToast = toast.loading("Memproses & mengompresi foto...");

      try {
        const {
          file: processedFile,
          previewUrl,
          wasHeic,
        } = await processPiketImage(rawFile);
        toast.dismiss(loadToast);
        toast.success(
          wasHeic
            ? "Foto HEIC berhasil dikonversi ke JPG & dikompresi."
            : "Foto berhasil diproses & dikompresi.",
        );

        storeProcessedPhoto(type, processedFile, previewUrl);
      } catch (err: unknown) {
        toast.dismiss(loadToast);
        const errMsg = err instanceof Error ? err.message : String(err);
        toast.error(errMsg);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, type: "before" | "after") => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const rawFile = e.dataTransfer.files[0];
      const loadToast = toast.loading("Memproses & mengompresi foto...");

      try {
        const {
          file: processedFile,
          previewUrl,
          wasHeic,
        } = await processPiketImage(rawFile);
        toast.dismiss(loadToast);
        toast.success(
          wasHeic
            ? "Foto HEIC berhasil dikonversi ke JPG & dikompresi."
            : "Foto berhasil diproses & dikompresi.",
        );

        storeProcessedPhoto(type, processedFile, previewUrl);
      } catch (err: unknown) {
        toast.dismiss(loadToast);
        const errMsg = err instanceof Error ? err.message : String(err);
        toast.error(errMsg);
      }
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

    if (!currentWeekAssignment) {
      toast.error(
        `Anda tidak memiliki jadwal piket di Pekan ${weekInfo.weekNumber} pada Periode ${selectedPeriod}.`,
      );
      return;
    }

    if (!photoBefore || !photoAfter || !notes.trim()) {
      toast.error(
        "Mohon isi catatan dan unggah kedua foto (sebelum & sesudah).",
      );
      return;
    }

    setIsSubmitting(true);
    const loadToast = toast.loading("Mengunggah laporan piket ke R2...");

    const formData = new FormData();
    formData.append("schedule_id", currentWeekAssignment.schedule_id);
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
              Piket Kebersihan Kesekretariatan &amp; Workshop
            </h1>
            <p className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
              Dokumentasi Kebersihan Ruang Kesekretariatan dan Ruang Workshop
              DPH UKM Robotik PNP
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[#ffedd5] dark:bg-orange-950/60 text-[#c2410c] dark:text-orange-300 border border-orange-200 dark:border-orange-900/60 px-3 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-wider font-semibold">
              SAAT INI: PEKAN {weekInfo.weekNumber} (
              {weekInfo.dateRangeFormatted})
            </Badge>
          </div>
        </div>
      </div>

      {/* Period Selection Dropdown Bar */}
      {availablePeriods.length > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-xs">
          <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Periode DPH Akademik:
          </span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-medium text-[#0a192f] dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#1e3a8a] cursor-pointer"
          >
            {availablePeriods.map((p) => (
              <option key={p} value={p}>
                Periode DPH {p}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Grid: Mobile First (1 col on mobile, 3 cols on md+) */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {/* Left Column: User Status & Schedule Viewer */}
        <div className="md:col-span-1 space-y-4 sm:space-y-6">
          {/* Card: Active User Status */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl border-l-4 border-l-[#1e3a8a] dark:border-l-blue-500 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display font-medium text-[#0a192f] dark:text-slate-100">
                Status Piket DPH Anda ({selectedPeriod})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">
                  JADWAL PEKANAN:
                </span>
                {periodAssignments.length > 0 ? (
                  <div className="flex gap-1 flex-wrap justify-end">
                    {periodAssignments.map((a) => (
                      <Badge
                        key={a.schedule_id}
                        className="bg-blue-50 dark:bg-blue-950/60 text-[#1e3a8a] dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 text-[10px] rounded-full px-2"
                      >
                        Pekan {a.week_number}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60 text-[10px] rounded-full"
                  >
                    BELUM TERDAFTAR
                  </Badge>
                )}
              </div>
              {currentUserIsOnInternship && (
                <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/60 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-indigo-700 dark:text-indigo-300 font-mono text-[11px] uppercase">
                    <Badge className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded-sm">
                      MAGANG / PKL
                    </Badge>
                    <span>Bebas Piket & Denda</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 font-body text-[11px] leading-relaxed">
                    Anda sedang melaksanakan Magang Luar / PKL, sehingga secara
                    otomatis tidak wajib melapor dan tidak mendapatkan denda.
                    Namun, Anda tetap diperbolehkan mengirim laporan piket
                    secara opsional.
                  </p>
                </div>
              )}

              <div className="pt-1">
                {isScheduledThisWeek ? (
                  <div className="flex items-start gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      size={16}
                      className="shrink-0 mt-0.5"
                    />
                    <span>
                      Anda bertugas piket di Pekan {weekInfo.weekNumber} ini!
                      (Bebas pilih hari Senin–Minggu).
                      {currentUserIsOnInternship &&
                        " (Opsional karena sedang Magang/PKL)"}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
                    Anda tidak bertugas piket di Pekan {weekInfo.weekNumber}{" "}
                    ini. Form lapor tidak dapat digunakan.
                  </p>
                )}
              </div>

              {isScheduledThisWeek && (
                <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-2">
                  <span className="text-slate-500 dark:text-slate-400">
                    KESEMPATAN UPLOAD:
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] rounded-full font-semibold"
                  >
                    SISA {myAttemptsLeft} DARI {MAX_WEEKLY_ATTEMPTS}
                  </Badge>
                </div>
              )}

              {periodLogs
                .filter(
                  (l) =>
                    l.reporter_id === profile.id &&
                    getPiketLogStatus(l) === "rejected" &&
                    l.duty_date >= weekInfo.startIsoDate &&
                    l.duty_date <= weekInfo.endIsoDate,
                )
                .slice(0, 1)
                .map((l) => (
                  <div
                    key={l.id}
                    className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs"
                  >
                    <p className="font-semibold text-red-700 dark:text-red-300 font-mono text-[11px] uppercase">
                      Laporan ditolak Kestari
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 font-body mt-1">
                      {l.rejection_reason}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 font-body mt-1">
                      Silakan unggah ulang sebagai laporan baru
                      {myAttemptsLeft > 0
                        ? ` (sisa ${myAttemptsLeft}x).`
                        : " — kesempatan habis, hubungi Kestari."}
                    </p>
                  </div>
                ))}

              {myUnpaidFines.length > 0 && (
                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs space-y-1">
                  <p className="font-semibold text-red-700 dark:text-red-300 font-mono text-[11px] uppercase">
                    Denda piket belum lunas ({myUnpaidFines.length})
                  </p>
                  {myUnpaidFines.map((f) => (
                    <div
                      key={f.id}
                      className="flex justify-between items-center text-slate-700 dark:text-slate-300 font-mono text-[11px]"
                    >
                      <span>
                        Pekan {f.week_number} • {formatRp(f.amount)}
                      </span>
                      <Badge className="bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 text-[10px] rounded-full">
                        BELUM LUNAS
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Monthly Week Schedule View */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-display font-medium flex items-center gap-2 text-[#0a192f] dark:text-slate-100">
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  size={18}
                  className="text-[#1e3a8a] dark:text-blue-400"
                />
                Daftar Petugas Piket DPH
              </CardTitle>
              <CardDescription className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Petugas piket per pekan (Periode {selectedPeriod}).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-4 gap-1">
                {PEKAN_NUMBERS.map((w) => (
                  <button
                    key={w}
                    onClick={() => setSelectedWeekTab(w)}
                    className={`py-1.5 rounded-lg font-mono text-[11px] font-semibold border transition-all cursor-pointer text-center ${
                      selectedWeekTab === w
                        ? "bg-[#1e3a8a] dark:bg-blue-600 text-white border-[#1e3a8a] dark:border-blue-600 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    Pekan {w}
                  </button>
                ))}
              </div>

              <div className="space-y-2 min-h-[140px] pt-1">
                {periodSchedules
                  .filter((s) => s.week_number === selectedWeekTab)
                  .flatMap((s) => s.members).length === 0 ? (
                  <p className="text-xs font-mono text-slate-400 dark:text-slate-500 text-center py-6">
                    Belum ada petugas pada Pekan {selectedWeekTab}.
                  </p>
                ) : (
                  periodSchedules
                    .filter((s) => s.week_number === selectedWeekTab)
                    .flatMap((s) =>
                      s.members.map((member) => ({ schedule: s, member })),
                    )
                    .map(({ schedule, member }) => {
                      const hasValidLog = periodLogs.some(
                        (l) =>
                          l.schedule_id === schedule.id &&
                          l.reporter_id === member.profile_id &&
                          getPiketLogStatus(l) !== "rejected",
                      );
                      const memberIsInterning = isMemberOnInternship(
                        member,
                        weekInfo.startIsoDate,
                      );

                      return (
                        <div
                          key={member.member_id}
                          className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                            member.profile_id === profile.id
                              ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-[#1e3a8a] dark:text-blue-300 font-semibold"
                              : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          <div className="truncate max-w-[140px]">
                            <div className="flex items-center gap-1">
                              <span className="font-display font-medium truncate">
                                {member.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                {member.nim || "-"}
                              </span>
                              {memberIsInterning && (
                                <Badge className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[9px] px-1 py-0 rounded-xs">
                                  MAGANG / PKL
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {hasValidLog ? (
                              <HugeiconsIcon
                                icon={CheckmarkCircle01Icon}
                                size={15}
                                className="text-emerald-600 dark:text-emerald-400"
                              />
                            ) : memberIsInterning ? (
                              <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[9px] rounded-full">
                                BEBAS PIKET
                              </Badge>
                            ) : (
                              <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                                BELUM LAPOR
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
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
                Unggah dokumentasi piket Anda pada pekan penugasan aktif (
                {weekInfo.dateRangeFormatted}).
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitReport}>
              <CardContent className="space-y-4 pt-4">
                {/* Warning Photo Alert */}
                <div className="p-3 bg-[#ffedd5] dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 rounded-lg flex items-start gap-2.5 text-xs text-[#c2410c] dark:text-orange-300 font-mono">
                  <span className="font-bold shrink-0 mt-0.5">⚠️ PENTING:</span>
                  <p className="leading-relaxed font-body">
                    Unggah dua foto berbeda (kondisi sebelum & sesudah
                    dibersihkan) langsung dari kamera HP Anda. Pengguna iPhone
                    (HEIC/HEIF) otomatis dikonversi ke JPG di perangkat sebelum
                    diunggah. Pastikan foto diambil pada pekan tugas yang sedang
                    berjalan ({weekInfo.dateRangeFormatted}). Foto akan ditolak
                    jika kedua foto identik, pernah dipakai pada laporan
                    sebelumnya, atau berupa tangkapan layar/daur ulang. Foto
                    otomatis disimpan ke Cloudflare R2.
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
                        isScheduledThisWeek && fileBeforeRef.current?.click()
                      }
                      className={`aspect-video rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex flex-col items-center justify-center p-3 text-center cursor-pointer relative overflow-hidden group ${
                        !isScheduledThisWeek
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
                            JPG, PNG, HEIC iPhone (Otomatis Dikompresi)
                          </p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileBeforeRef}
                      type="file"
                      accept="image/*,.heic,.heif,.jpg,.jpeg,.png"
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
                        isScheduledThisWeek && fileAfterRef.current?.click()
                      }
                      className={`aspect-video rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex flex-col items-center justify-center p-3 text-center cursor-pointer relative overflow-hidden group ${
                        !isScheduledThisWeek
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
                            JPG, PNG, HEIC iPhone (Otomatis Dikompresi)
                          </p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileAfterRef}
                      type="file"
                      accept="image/*,.heic,.heif,.jpg,.jpeg,.png"
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
                    disabled={!isScheduledThisWeek || isSubmitting}
                    placeholder="Contoh: Menyapu dan mengepel lantai ruang kesekretariatan & workshop, membersihkan meja kerja..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-lg focus:border-[#f97316] text-xs py-2.5 min-h-[80px] text-[#0a192f] dark:text-slate-100 placeholder:text-slate-400 font-body"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={!isScheduledThisWeek || isSubmitting}
                    className="w-full bg-[#1e3a8a] hover:bg-[#1e40af] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-medium text-xs rounded-lg py-2.5 shadow-xs uppercase font-mono tracking-wider cursor-pointer"
                  >
                    {isSubmitting
                      ? "Memproses Verifikasi & Upload R2..."
                      : "Kirim Laporan Piket Kebersihan"}
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
            Riwayat Log Piket Kebersihan ({selectedPeriod})
          </CardTitle>
          <CardDescription className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Daftar lengkap laporan piket kebersihan ruang kesekretariatan &amp;
            workshop DPH.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {periodLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">
              Belum ada riwayat piket yang tercatat untuk periode{" "}
              {selectedPeriod}.
            </div>
          ) : (
            <>
              {/* Mobile View: Cards */}
              <div className="block md:hidden space-y-3">
                {periodLogs.map((log) => {
                  const status = getPiketLogStatus(log);
                  return (
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
                        <PiketLogStatusBadge status={status} />
                      </div>

                      {status === "rejected" && log.rejection_reason && (
                        <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs">
                          <p className="font-semibold text-red-700 dark:text-red-300 font-mono text-[10px] uppercase">
                            Alasan penolakan
                          </p>
                          <p className="text-slate-600 dark:text-slate-300 font-body mt-0.5">
                            {log.rejection_reason}
                          </p>
                        </div>
                      )}

                      {status === "approved" && log.verifier_name && (
                        <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          Disetujui oleh: {log.verifier_name}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                            TANGGAL TUGAS
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {new Date(log.duty_date).toLocaleDateString(
                              "id-ID",
                              {
                                dateStyle: "medium",
                              },
                            )}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                            ({log.schedule_day})
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                            DOKUMENTASI
                          </span>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {log.proof_image_before_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPreviewModal({
                                    beforeUrl: getPublicR2Url(
                                      log.proof_image_before_url,
                                    ),
                                    afterUrl: getPublicR2Url(
                                      log.proof_image_url,
                                    ),
                                    reporterName: log.reporter_name,
                                    dutyDate: log.duty_date,
                                    activeTab: "before",
                                  });
                                }}
                                className="border-slate-200 dark:border-slate-700 text-[#1e3a8a] dark:text-blue-400 font-mono text-[10px] uppercase h-7 px-2"
                              >
                                <HugeiconsIcon
                                  icon={Image01Icon}
                                  size={12}
                                  className="mr-1"
                                />
                                Sebelum
                              </Button>
                            )}
                            {log.proof_image_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPreviewModal({
                                    beforeUrl: getPublicR2Url(
                                      log.proof_image_before_url,
                                    ),
                                    afterUrl: getPublicR2Url(
                                      log.proof_image_url,
                                    ),
                                    reporterName: log.reporter_name,
                                    dutyDate: log.duty_date,
                                    activeTab: "after",
                                  });
                                }}
                                className="border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] uppercase h-7 px-2"
                              >
                                <HugeiconsIcon
                                  icon={Image01Icon}
                                  size={12}
                                  className="mr-1"
                                />
                                Sesudah
                              </Button>
                            )}
                            {!log.proof_image_before_url &&
                              !log.proof_image_url && (
                                <span className="text-slate-400 font-mono text-[10px]">
                                  -
                                </span>
                              )}
                          </div>
                        </div>
                      </div>

                      {log.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-body border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                          {log.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 font-mono text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      <th className="p-3">Tanggal Tugas</th>
                      <th className="p-3">Petugas</th>
                      <th className="p-3">Jadwal Pekan</th>
                      <th className="p-3">Verifikasi</th>
                      <th className="p-3">Foto Bukti</th>
                      <th className="p-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {periodLogs.map((log) => {
                      const status = getPiketLogStatus(log);
                      return (
                        <tr
                          key={log.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                            {new Date(log.duty_date).toLocaleDateString(
                              "id-ID",
                              {
                                dateStyle: "medium",
                              },
                            )}
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
                            <PiketLogStatusBadge status={status} />
                            {status === "rejected" && log.rejection_reason && (
                              <span
                                className="text-[10px] text-red-600 dark:text-red-400 block max-w-[180px] truncate mt-1"
                                title={log.rejection_reason}
                              >
                                {log.rejection_reason}
                              </span>
                            )}
                            {status === "approved" && log.verifier_name && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                                oleh {log.verifier_name}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {log.proof_image_before_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setPreviewModal({
                                      beforeUrl: getPublicR2Url(
                                        log.proof_image_before_url,
                                      ),
                                      afterUrl: getPublicR2Url(
                                        log.proof_image_url,
                                      ),
                                      reporterName: log.reporter_name,
                                      dutyDate: log.duty_date,
                                      activeTab: "before",
                                    });
                                  }}
                                  className="border-slate-200 dark:border-slate-700 text-[#1e3a8a] dark:text-blue-400 font-mono text-[10px] uppercase h-7 px-2"
                                >
                                  <HugeiconsIcon
                                    icon={Image01Icon}
                                    size={12}
                                    className="mr-1"
                                  />
                                  Sebelum
                                </Button>
                              )}
                              {log.proof_image_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setPreviewModal({
                                      beforeUrl: getPublicR2Url(
                                        log.proof_image_before_url,
                                      ),
                                      afterUrl: getPublicR2Url(
                                        log.proof_image_url,
                                      ),
                                      reporterName: log.reporter_name,
                                      dutyDate: log.duty_date,
                                      activeTab: "after",
                                    });
                                  }}
                                  className="border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] uppercase h-7 px-2"
                                >
                                  <HugeiconsIcon
                                    icon={Image01Icon}
                                    size={12}
                                    className="mr-1"
                                  />
                                  Sesudah
                                </Button>
                              )}
                              {!log.proof_image_before_url &&
                                !log.proof_image_url && (
                                  <span className="text-slate-400 font-mono">
                                    -
                                  </span>
                                )}
                            </div>
                          </td>
                          <td
                            className="p-3 text-slate-600 dark:text-slate-400 max-w-[220px] truncate"
                            title={log.notes || ""}
                          >
                            {log.notes || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section: Denda Administratif */}
      {myFines.length > 0 && (
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-base font-display font-medium text-[#0a192f] dark:text-slate-100">
              Denda Administratif Piket ({selectedPeriod})
            </CardTitle>
            <CardDescription className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Daftar denda piket atas nama Anda. Segera selesaikan ke admin
              Kestari.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {myFines.filter(
              (f) => !f.academic_period || f.academic_period === selectedPeriod,
            ).length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">
                Tidak ada denda piket pada periode {selectedPeriod}.
              </div>
            ) : (
              <div className="space-y-2.5">
                {myFines
                  .filter(
                    (f) =>
                      !f.academic_period ||
                      f.academic_period === selectedPeriod,
                  )
                  .map((fine) => (
                    <div
                      key={fine.id}
                      className="border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <span className="font-display font-medium text-sm text-[#0a192f] dark:text-slate-100 block truncate">
                          {fine.member_name}
                          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 ml-2">
                            {fine.member_nim || "-"}
                          </span>
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          Pekan {fine.week_number} • {formatRp(fine.amount)}
                          {fine.notes ? ` • ${fine.notes}` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {fine.status === "lunas" ? (
                          <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 text-[10px] rounded-full">
                            LUNAS
                          </Badge>
                        ) : (
                          <Badge className="bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 text-[10px] rounded-full">
                            BELUM LUNAS
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Image Preview Dialog */}
      <PiketPhotoPreviewDialog
        open={!!previewModal}
        beforeUrl={previewModal?.beforeUrl ?? null}
        afterUrl={previewModal?.afterUrl ?? null}
        reporterName={previewModal?.reporterName || "Anggota"}
        dutyDate={
          previewModal?.dutyDate
            ? new Date(previewModal.dutyDate).toLocaleDateString("id-ID", {
                dateStyle: "medium",
              })
            : ""
        }
        activeTab={previewModal?.activeTab ?? "before"}
        onTabChange={(tab) =>
          setPreviewModal((prev) => (prev ? { ...prev, activeTab: tab } : null))
        }
        onClose={() => setPreviewModal(null)}
      />
    </div>
  );
}
