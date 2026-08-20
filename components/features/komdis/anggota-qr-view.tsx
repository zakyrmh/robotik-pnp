"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { encryptToken } from "@/lib/utils/crypto";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  QrCodeIcon,
  RefreshIcon,
  File01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { submitLeaveRequest } from "@/lib/actions/attendance";
import { compressAndConvertToWebp } from "@/lib/utils/image-compressor";

interface AnggotaQrViewProps {
  activityId: string;
  activityTitle: string;
  startDate?: string;
  endDate?: string;
  checkinOpenAt?: string | null;
  checkinCloseAt?: string | null;
  profileId: string;
  profileName: string;
  nim: string;
}

interface AttendanceRecord {
  status: string;
  check_in_at: string | null;
  verified_at: string | null;
  notes: string | null;
  approval_status: string | null;
}

function formatCheckInTime(dateStr: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return (
    d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) +
    " WIB, " +
    d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  );
}

export function AnggotaQrView({
  activityId,
  activityTitle,
  startDate,
  endDate,
  checkinOpenAt,
  checkinCloseAt,
  profileId,
  profileName,
  nim,
}: AnggotaQrViewProps) {
  const [qrToken, setQrToken] = useState(() =>
    encryptToken({
      profile_id: profileId,
      activity_id: activityId,
      generated_at: Date.now(),
    }),
  );
  const [countdown, setCountdown] = useState(300); // 5 menit TTL
  const [isLeaveFormOpen, setIsLeaveFormOpen] = useState(false);
  const [leaveStatus, setLeaveStatus] = useState<"izin" | "sakit">("izin");
  const [leaveNotes, setLeaveNotes] = useState("");
  const [leaveFile, setLeaveFile] = useState<File | null>(null);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [attendanceRecord, setAttendanceRecord] =
    useState<AttendanceRecord | null>(null);
  const [fetchingAttendance, setFetchingAttendance] = useState(true);

  const now = new Date();

  // Window QR: checkinOpenAt s/d checkinCloseAt (fallback: 2 jam sebelum start s/d end)
  const openTime = checkinOpenAt
    ? new Date(checkinOpenAt)
    : startDate
      ? new Date(new Date(startDate).getTime() - 2 * 60 * 60 * 1000)
      : null;
  const closeTime = checkinCloseAt
    ? new Date(checkinCloseAt)
    : endDate
      ? new Date(endDate)
      : null;

  const isQrWindowActive =
    !openTime || !closeTime ? true : now >= openTime && now <= closeTime;

  // Grace Period Izin/Sakit: 24 jam setelah closeTime
  const isLeaveGracePeriodActive = !closeTime
    ? true
    : now <= new Date(closeTime.getTime() + 24 * 60 * 60 * 1000);

  // Optimasi Supabase Free Plan: Polling hemat kuota (Adaptive Polling)
  // - Hanya polling saat tab/layar aktif (document.visibilityState === "visible")
  // - Interval 4 detik, maksimal 30x percobaan (2 menit), lalu jeda otomatis
  useEffect(() => {
    if (attendanceRecord) return; // Jika sudah presensi, tidak perlu query lagi

    const supabase = createClient();
    let isMounted = true;
    let pollTimeout: NodeJS.Timeout | null = null;
    let attemptsCount = 0;
    const MAX_POLL_ATTEMPTS = 30; // Max 2 menit polling per sesi aktif

    async function checkAttendance() {
      if (!isMounted || document.visibilityState !== "visible") return;

      try {
        const { data } = await supabase
          .from("attendances")
          .select("status, check_in_at, verified_at, notes, approval_status")
          .eq("activity_id", activityId)
          .eq("profile_id", profileId)
          .maybeSingle();

        if (!isMounted) return;

        if (data) {
          setAttendanceRecord(data);
          setFetchingAttendance(false);
          return;
        }

        setFetchingAttendance(false);
        attemptsCount++;

        // Lanjutkan polling jika belum melebihi batas percobaan dan tab masih aktif
        if (
          attemptsCount < MAX_POLL_ATTEMPTS &&
          document.visibilityState === "visible"
        ) {
          pollTimeout = setTimeout(checkAttendance, 4000);
        }
      } catch (err) {
        console.error("Gagal memeriksa presensi:", err);
        if (isMounted) setFetchingAttendance(false);
      }
    }

    checkAttendance();

    // Re-check & reset polling saat tab/layar smartphone diaktifkan kembali oleh user
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !attendanceRecord) {
        attemptsCount = 0; // Reset hitungan saat user kembali aktif di tab ini
        if (pollTimeout) clearTimeout(pollTimeout);
        checkAttendance();
      } else if (document.visibilityState === "hidden" && pollTimeout) {
        clearTimeout(pollTimeout); // Hentikan query saat tab tidak dilihat
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      if (pollTimeout) clearTimeout(pollTimeout);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activityId, profileId, attendanceRecord]);

  const generateNewQR = useCallback(() => {
    const token = encryptToken({
      profile_id: profileId,
      activity_id: activityId,
      generated_at: Date.now(),
    });
    setQrToken(token);
    setCountdown(300);
  }, [activityId, profileId]);

  const handleSubmitLeave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!leaveNotes.trim()) {
      toast.error("Alasan perizinan wajib diisi.");
      return;
    }
    setIsSubmittingLeave(true);
    try {
      const formData = new FormData();
      formData.append("activity_id", activityId);
      formData.append("status", leaveStatus);
      formData.append("notes", leaveNotes.trim());

      if (leaveFile) {
        // Konversi ke format WebP & kompres ukuran gambar secara client-side
        const processedFile = await compressAndConvertToWebp(leaveFile);
        formData.append("file", processedFile);
      }

      const res = await submitLeaveRequest(formData);
      if (res.success) {
        toast.success(
          res.message || "Pengajuan izin berhasil dikirim ke Komdis.",
        );
        setIsLeaveFormOpen(false);
        setLeaveNotes("");
        setLeaveFile(null);

        // Fetch status presensi/perizinan terbaru
        const supabase = createClient();
        const { data } = await supabase
          .from("attendances")
          .select("status, check_in_at, verified_at, notes, approval_status")
          .eq("activity_id", activityId)
          .eq("profile_id", profileId)
          .single();
        if (data) setAttendanceRecord(data);
      } else {
        toast.error(res.message || "Gagal mengirim pengajuan izin.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  useEffect(() => {
    if (!isQrWindowActive || attendanceRecord) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          generateNewQR();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [generateNewQR, isQrWindowActive, attendanceRecord]);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    qrToken,
  )}`;

  // Configuration for Attendance Status UI Card
  const getStatusCardConfig = (st: string) => {
    switch (st) {
      case "hadir":
        return {
          label: "HADIR TEPAT WAKTU",
          badgeBg: "bg-emerald-500 text-white dark:bg-emerald-600",
          cardBg:
            "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50",
          textColor: "text-emerald-700 dark:text-emerald-300",
          icon: CheckmarkCircle01Icon,
          iconBg:
            "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400",
        };
      case "telat":
        return {
          label: "HADIR (TERLAMBAT)",
          badgeBg: "bg-amber-500 text-white dark:bg-amber-600",
          cardBg:
            "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50",
          textColor: "text-amber-700 dark:text-amber-300",
          icon: Clock01Icon,
          iconBg:
            "bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400",
        };
      case "izin":
        return {
          label: "IZIN (DISPENSASI)",
          badgeBg: "bg-blue-500 text-white dark:bg-blue-600",
          cardBg:
            "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50",
          textColor: "text-blue-700 dark:text-blue-300",
          icon: File01Icon,
          iconBg:
            "bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-400",
        };
      case "sakit":
        return {
          label: "SAKIT",
          badgeBg: "bg-indigo-500 text-white dark:bg-indigo-600",
          cardBg:
            "bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50",
          textColor: "text-indigo-700 dark:text-indigo-300",
          icon: File01Icon,
          iconBg:
            "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-400",
        };
      default:
        return {
          label: "ALFA (TIDAK HADIR)",
          badgeBg: "bg-red-500 text-white dark:bg-red-600",
          cardBg:
            "bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-900/50",
          textColor: "text-red-700 dark:text-red-300",
          icon: Cancel01Icon,
          iconBg:
            "bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-400",
        };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-md mx-auto w-full">
      {/* Header Info - Light/Dark Mode & Precision Blueprint */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center p-4 sm:p-6 shadow-xs">
        <CardHeader className="p-0 space-y-1">
          <div className="flex items-center justify-center gap-2 font-mono text-xs text-[#1e3a8a] dark:text-blue-400 uppercase tracking-widest font-semibold">
            <HugeiconsIcon icon={QrCodeIcon} size={18} />
            <span>
              {attendanceRecord
                ? "STATUS PRESENSI TERVERIFIKASI"
                : "DYNAMIC QR CODE PRESENSI"}
            </span>
          </div>
          <CardTitle className="text-lg sm:text-xl font-display font-medium text-[#0a192f] dark:text-slate-100">
            {activityTitle}
          </CardTitle>
          <div className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-2">
            NIM: {nim} &bull;{" "}
            <span className="text-[#0a192f] dark:text-slate-200 font-semibold uppercase">
              {profileName}
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* JIKA SUDAH DISCAN / DATA PRESENSI TERSEDIA -> TAMPILKAN STATUS CARD */}
      {attendanceRecord ? (
        (() => {
          const cfg = getStatusCardConfig(attendanceRecord.status);
          const Icon = cfg.icon;
          return (
            <Card
              className={`border rounded-xl p-6 text-center shadow-soft space-y-4 ${cfg.cardBg}`}
            >
              <div
                className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${cfg.iconBg}`}
              >
                <HugeiconsIcon icon={Icon} size={28} />
              </div>

              <div className="space-y-1">
                <Badge
                  className={`font-mono text-xs uppercase tracking-wider px-3.5 py-1 rounded-full font-bold ${cfg.badgeBg}`}
                >
                  {cfg.label}
                </Badge>
                <h3 className={`text-sm font-semibold mt-2 ${cfg.textColor}`}>
                  Presensi Berhasil Dicatat
                </h3>
              </div>

              <div className="border-t border-b border-border/60 py-3 space-y-2 text-xs font-mono text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground uppercase text-[10px]">
                    Waktu Check-In:
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatCheckInTime(
                      attendanceRecord.check_in_at ||
                        attendanceRecord.verified_at,
                    )}
                  </span>
                </div>
                {attendanceRecord.notes && (
                  <div className="flex items-start justify-between gap-2 text-left pt-1">
                    <span className="text-muted-foreground uppercase text-[10px] shrink-0">
                      Catatan:
                    </span>
                    <span className="text-foreground italic">
                      {attendanceRecord.notes}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-micro font-mono uppercase tracking-wider text-muted-foreground leading-relaxed">
                Data presensi Anda telah tersimpan secara otomatis &amp;
                terverifikasi oleh Panitia / Komdis.
              </p>
            </Card>
          );
        })()
      ) : isQrWindowActive ? (
        /* JIKA BELUM DISCAN & QR WINDOW AKTIF -> TAMPILKAN QR CODE */
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 text-center shadow-xs space-y-4">
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 mx-auto bg-white p-3 border-2 border-[#1e3a8a] dark:border-blue-500 rounded-lg shadow-sm">
            {fetchingAttendance ? (
              <div className="h-full flex flex-col items-center justify-center font-mono text-xs text-slate-400 gap-2">
                <HugeiconsIcon
                  icon={RefreshIcon}
                  size={20}
                  className="animate-spin"
                />
                <span>MEMERIKSA STATUS...</span>
              </div>
            ) : qrToken ? (
              <Image
                src={qrImageUrl}
                alt="Dynamic QR Code"
                fill
                sizes="250px"
                className="object-contain p-2"
                priority
              />
            ) : (
              <div className="h-full flex items-center justify-center font-mono text-xs text-slate-400">
                MEMUAT QR CODE...
              </div>
            )}
          </div>

          {/* Countdown Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider text-[#1e3a8a] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 py-2.5 px-4 rounded-lg border border-blue-200 dark:border-blue-900/60 font-semibold">
              <HugeiconsIcon
                icon={RefreshIcon}
                size={14}
                className="animate-spin"
              />
              <span>KEDALUWARSA DALAM: {countdown} DETIK</span>
            </div>
            <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Tunjukkan QR Code ini kepada panitia Komdis di lokasi
            </p>
          </div>

          <Button
            type="button"
            onClick={generateNewQR}
            className="w-full bg-[#1e3a8a] hover:bg-[#1e40af] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-mono text-xs uppercase tracking-wider rounded-lg cursor-pointer py-2.5 shadow-xs"
          >
            REFRESH QR CODE SEKARANG
          </Button>
        </Card>
      ) : (
        /* JIKA QR WINDOW DITUTUP & BELUM PRESENSI */
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center font-mono font-bold text-lg">
            !
          </div>
          <div className="font-mono text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300 font-semibold">
            PRESENSI QR DITUTUP
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
            Sesi pemindaian QR Code untuk kegiatan ini telah berakhir pada{" "}
            <strong className="font-mono">
              {closeTime ? closeTime.toLocaleString("id-ID") : "kegiatan usai"}
            </strong>
            .
          </p>
        </Card>
      )}

      {/* Leave Request Alternative (Hanya tampil jika belum presensi) */}
      {!attendanceRecord && isLeaveGracePeriodActive && (
        <div className="text-center pt-2 space-y-1">
          <button
            onClick={() => setIsLeaveFormOpen(!isLeaveFormOpen)}
            className="font-mono text-xs uppercase tracking-widest text-[#f97316] dark:text-orange-400 hover:text-[#ea580c] dark:hover:text-orange-300 transition-colors cursor-pointer font-semibold"
          >
            AJUKAN SURAT IZIN ATAU SAKIT
          </button>
          <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Tenggat izin/sakit: Maksimal 24 jam setelah kegiatan selesai
          </p>
        </div>
      )}

      {!attendanceRecord && !isLeaveGracePeriodActive && (
        <div className="text-center pt-2 font-mono text-micro uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Batas pengajuan izin/sakit (24 jam setelah kegiatan selesai) telah
          berakhir.
        </div>
      )}

      {/* Form Pengajuan Surat Izin / Sakit */}
      {!attendanceRecord && isLeaveGracePeriodActive && isLeaveFormOpen && (
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-2 font-mono text-xs text-[#f97316] dark:text-orange-400 uppercase tracking-widest font-semibold flex items-center gap-2">
            <HugeiconsIcon icon={File01Icon} size={16} />
            <span>FORM PENGAJUAN SURAT IZIN / SAKIT</span>
          </div>

          <p className="font-body text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Pengajuan perizinan akan diverifikasi oleh Komdis. Jika diterima,
            Anda dikenakan sanksi <strong>5 Poin</strong>. Jika ditolak,
            dikenakan sanksi <strong>10 Poin</strong>.
          </p>

          <form
            onSubmit={handleSubmitLeave}
            className="space-y-3 font-mono text-xs"
          >
            <div>
              <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 font-semibold">
                JENIS PERIZINAN:
              </label>
              <select
                value={leaveStatus}
                onChange={(e) =>
                  setLeaveStatus(e.target.value as "izin" | "sakit")
                }
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-2.5 text-xs font-mono text-[#0a192f] dark:text-slate-100 focus:outline-hidden focus:border-[#f97316] rounded-lg"
              >
                <option value="izin">
                  Izin (Ada Kepentingan Resmi / Akademik)
                </option>
                <option value="sakit">
                  Sakit (Kondisi Kesehatan / Rekomendasi Dokter)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 font-semibold">
                ALASAN PERIZINAN:
              </label>
              <textarea
                required
                value={leaveNotes}
                onChange={(e) => setLeaveNotes(e.target.value)}
                placeholder="Contoh: Sakit demam tinggi dengan rekomendasi istirahat dokter..."
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3 text-xs font-body text-[#0a192f] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-[#f97316] rounded-lg h-20"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 font-semibold">
                FOTO BUKTI / SURAT (OPSIONAL):
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setLeaveFile(e.target.files?.[0] || null)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-2 text-xs font-mono text-[#0a192f] dark:text-slate-100 focus:outline-hidden rounded-lg file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#1e3a8a] file:text-white dark:file:bg-blue-600"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmittingLeave}
              className="w-full bg-[#f97316] hover:bg-[#ea580c] dark:bg-orange-600 dark:hover:bg-orange-500 text-white font-mono text-xs uppercase tracking-wider rounded-lg font-semibold cursor-pointer py-2.5 shadow-xs flex items-center justify-center gap-2"
            >
              {isSubmittingLeave ? (
                <>
                  <HugeiconsIcon
                    icon={RefreshIcon}
                    className="animate-spin"
                    size={14}
                  />
                  <span>MENGIRIM PERIZINAN...</span>
                </>
              ) : (
                <span>KIRIM PERIZINAN KE KOMDIS</span>
              )}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
