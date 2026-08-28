"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import {
  scanAttendanceQRByAdmin,
  recordManualAttendance,
  batchMarkAlfa,
  recordSelfAttendanceKomdis,
} from "@/lib/actions/komdis";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  QrCodeIcon,
  Loading03Icon,
  UserCheck01Icon,
  UserGroupIcon,
  Camera01Icon,
  RefreshIcon,
  Alert02Icon,
} from "@hugeicons/core-free-icons";
import Image from "next/image";

interface KomdisScannerViewProps {
  activityId: string;
  activityTitle: string;
}

export function KomdisScannerView({
  activityId,
  activityTitle,
}: KomdisScannerViewProps) {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualProfileId, setManualProfileId] = useState("");
  const [manualStatus, setManualStatus] = useState<
    "hadir" | "telat" | "izin" | "sakit" | "alfa"
  >("hadir");
  const [manualPoints, setManualPoints] = useState<number>(0);
  const [manualNotes, setManualNotes] = useState("");
  const [retryTrigger, setRetryTrigger] = useState(0);

  // State untuk popup penetapan sanksi keterlambatan (> 1 jam)
  const [latePenaltyTarget, setLatePenaltyTarget] = useState<{
    profileId: string;
    fullName: string;
    nim: string;
    avatarUrl: string | null;
    diffMinutes: number;
  } | null>(null);
  const [latePenaltyPoints, setLatePenaltyPoints] = useState<number>(3);
  const [latePenaltyNotes, setLatePenaltyNotes] = useState<string>("");

  const [isPending, startTransition] = useTransition();

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<{ token: string; time: number } | null>(null);
  const latePenaltyTargetRef = useRef(latePenaltyTarget);

  useEffect(() => {
    latePenaltyTargetRef.current = latePenaltyTarget;
  }, [latePenaltyTarget]);

  const stopCurrentScanner = async () => {
    if (scannerRef.current) {
      const instance = scannerRef.current;
      scannerRef.current = null;
      try {
        if (instance.isScanning) {
          await instance.stop();
        }
        await instance.clear();
      } catch (e) {
        console.warn("Failed to stop/clear scanner instance:", e);
      }
    }
    const readerElement = document.getElementById("reader");
    if (readerElement) {
      readerElement.innerHTML = "";
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initScanner() {
      await stopCurrentScanner();
      if (!isMounted) return;

      const readerElement = document.getElementById("reader");
      if (!readerElement) return;

      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      const onScanSuccess = (decodedText: string) => {
        // Abaikan scan jika popup sanksi keterlambatan sedang terbuka
        if (latePenaltyTargetRef.current) {
          return;
        }

        const now = Date.now();
        if (
          lastScannedRef.current &&
          lastScannedRef.current.token === decodedText &&
          now - lastScannedRef.current.time < 4000
        ) {
          return;
        }
        lastScannedRef.current = { token: decodedText, time: now };

        const toastId = toast.loading("Memproses QR Code...");
        startTransition(async () => {
          try {
            const res = await scanAttendanceQRByAdmin(activityId, decodedText);
            toast.dismiss(toastId);
            if (res.success) {
              if (res.isLateOverOneHour && res.member) {
                // Terlambat > 1 Jam: Munculkan modal popup penetapan sanksi SOP Komdis
                setLatePenaltyPoints(3);
                setLatePenaltyNotes(
                  `Terlambat ${res.diffMinutes} menit (Izin diterima - sanksi fisik + 3 poin)`,
                );
                setLatePenaltyTarget({
                  profileId: res.member.id,
                  fullName: res.member.fullName,
                  nim: res.member.nim,
                  avatarUrl: res.member.avatarUrl,
                  diffMinutes: res.diffMinutes || 60,
                });
                toast.warning(
                  `Peserta terlambat ${res.diffMinutes} menit (> 1 Jam). Silakan tetapkan poin sanksi.`,
                  { duration: 4000 },
                );
              } else {
                toast.success(res.message || "Presensi Berhasil Dicatat");
              }
            } else {
              toast.error(res.message || "Gagal memproses QR Code");
            }
          } catch (err: unknown) {
            toast.dismiss(toastId);
            const msg = err instanceof Error ? err.message : String(err);
            toast.error("Gagal memproses QR Code: " + msg);
          }
        });
      };

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      try {
        try {
          await html5QrCode.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            () => {},
          );
        } catch {
          await html5QrCode.start(
            { facingMode: "user" },
            config,
            onScanSuccess,
            () => {},
          );
        }
        if (isMounted) {
          setIsScanning(true);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error("Camera scanner start error:", err);
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes("NotAllowedError") ||
          msg.includes("Permission") ||
          msg.includes("denied")
        ) {
          setCameraError(
            "Izin kamera tidak diberikan. Harap periksa izin kamera di browser dan Pengaturan Privasi Kamera Windows.",
          );
        } else if (msg.includes("NotReadableError") || msg.includes("in use")) {
          setCameraError(
            "Kamera sedang digunakan oleh aplikasi lain (Zoom, Teams, atau Kamera Windows). Silakan tutup aplikasi tersebut lalu klik Coba Lagi.",
          );
        } else if (
          msg.includes("NotFoundError") ||
          msg.includes("requested device")
        ) {
          setCameraError("Kamera tidak terdeteksi pada perangkat ini.");
        } else {
          setCameraError(`Gagal mengaktifkan kamera (${msg}).`);
        }
      }
    }

    initScanner();

    return () => {
      isMounted = false;
      stopCurrentScanner();
    };
  }, [activityId, retryTrigger]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualProfileId.trim()) {
      toast.error("ID Profil / UUID Anggota wajib diisi.");
      return;
    }

    startTransition(async () => {
      try {
        await recordManualAttendance({
          activityId,
          profileId: manualProfileId.trim(),
          status: manualStatus,
          pointsAwarded: manualPoints,
          notes: manualNotes.trim() || undefined,
        });
        setIsManualOpen(false);
        setManualProfileId("");
        setManualNotes("");
        toast.success("Presensi manual berhasil dicatat.");
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Gagal mencatat presensi manual",
        );
      }
    });
  };

  const handleSaveLatePenalty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!latePenaltyTarget) return;

    startTransition(async () => {
      try {
        await recordManualAttendance({
          activityId,
          profileId: latePenaltyTarget.profileId,
          status: "telat",
          pointsAwarded: latePenaltyPoints,
          notes: latePenaltyNotes.trim() || undefined,
        });
        toast.success(
          `Sanksi (${latePenaltyPoints} PTS) berhasil disimpan untuk ${latePenaltyTarget.fullName}. Silakan lanjut scan.`,
        );
        setLatePenaltyTarget(null);
      } catch (err: unknown) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Gagal menyimpan sanksi keterlambatan",
        );
      }
    });
  };

  const handleBatchAlfa = () => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menandai SELURUH anggota yang belum hadir sebagai ALFA (+15 Poin Sanksi)?",
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await batchMarkAlfa(activityId);
        toast.success(
          `Berhasil memproses Penandaan Alfa Massal (${res.count} anggota).`,
        );
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Gagal memproses alfa massal",
        );
      }
    });
  };

  const handleSelfAttendance = () => {
    startTransition(async () => {
      try {
        const res = await recordSelfAttendanceKomdis(activityId);
        if (res.success) {
          toast.success(res.message);
        } else {
          toast.error(res.message);
        }
      } catch (err: unknown) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Gagal mencatat presensi mandiri",
        );
      }
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-xl mx-auto w-full">
      {/* Header Info - Light/Dark Mode & Precision Blueprint */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center p-4 sm:p-6 shadow-xs">
        <CardHeader className="p-0 space-y-1">
          <div className="flex items-center justify-center gap-2 font-mono text-xs text-[#1e3a8a] dark:text-blue-400 uppercase tracking-widest font-semibold">
            <HugeiconsIcon icon={QrCodeIcon} size={18} />
            <span>MODUL PEMINDAI PRESENSI KOMDIS</span>
          </div>
          <CardTitle className="text-lg sm:text-xl font-display font-medium text-[#0a192f] dark:text-slate-100">
            {activityTitle}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Camera Scanner Box */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-xs">
        <div className="text-center mb-3 font-mono text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5">
          <HugeiconsIcon icon={Camera01Icon} size={14} />
          <span>
            {isScanning
              ? "KAMERA AKTIF & PROSES PEMINDAIAN"
              : "ARAHKAN KAMERA HP KE DYNAMIC QR CODE PESERTA"}
          </span>
        </div>

        {cameraError ? (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg p-4 text-center space-y-3 font-mono text-xs text-amber-900 dark:text-amber-200">
            <p className="leading-relaxed">{cameraError}</p>
            <Button
              type="button"
              onClick={() => {
                setCameraError(null);
                setRetryTrigger((c) => c + 1);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs uppercase tracking-wider rounded-lg cursor-pointer py-2 px-4 shadow-xs"
            >
              <HugeiconsIcon icon={RefreshIcon} size={14} className="mr-1.5" />
              COBA LAGI / REFRESH KAMERA
            </Button>
          </div>
        ) : null}

        <div
          id="reader"
          className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden rounded-lg font-mono text-slate-900 dark:text-slate-100 ${
            cameraError ? "hidden" : "block"
          }`}
        />
      </Card>

      {/* Action Controls - Mobile First */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <Button
          type="button"
          disabled={isPending}
          onClick={handleSelfAttendance}
          className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-medium text-xs rounded-lg cursor-pointer py-3 shadow-xs"
        >
          <HugeiconsIcon icon={UserCheck01Icon} size={16} className="mr-1.5" />
          PRESENSI DIRI
        </Button>

        <Button
          type="button"
          onClick={() => setIsManualOpen(true)}
          className="bg-[#1e3a8a] hover:bg-[#1e40af] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-medium text-xs rounded-lg cursor-pointer py-3 shadow-xs"
        >
          <HugeiconsIcon icon={UserCheck01Icon} size={16} className="mr-1.5" />
          OVERRIDE MANUAL
        </Button>

        <Button
          type="button"
          disabled={isPending}
          onClick={handleBatchAlfa}
          className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 text-white font-medium text-xs rounded-lg cursor-pointer py-3 shadow-xs"
        >
          <HugeiconsIcon icon={UserGroupIcon} size={16} className="mr-1.5" />
          BATCH ALFA
        </Button>
      </div>

      {/* Modal Manual Override */}
      {isManualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center">
              <span className="font-mono text-xs text-[#1e3a8a] dark:text-blue-400 font-semibold uppercase tracking-widest">
                PRESENSI MANUAL OVERRIDE
              </span>
              <button
                onClick={() => setIsManualOpen(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-mono text-xs cursor-pointer"
              >
                [ TUTUP X ]
              </button>
            </div>

            <form
              onSubmit={handleManualSubmit}
              className="space-y-4 font-mono text-xs"
            >
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 font-semibold">
                  PROFILE ID / UUID ANGGOTA:
                </label>
                <input
                  type="text"
                  required
                  value={manualProfileId}
                  onChange={(e) => setManualProfileId(e.target.value)}
                  placeholder="00000000-0000-0000-0000-000000000000"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-2.5 text-xs text-[#0a192f] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-[#f97316] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 font-semibold">
                  STATUS PRESENSI:
                </label>
                <select
                  value={manualStatus}
                  onChange={(e) => {
                    const newStatus = e.target.value as
                      | "hadir"
                      | "telat"
                      | "izin"
                      | "sakit"
                      | "alfa";
                    setManualStatus(newStatus);
                    if (newStatus === "hadir") {
                      setManualPoints(0);
                      setManualNotes("");
                    } else if (newStatus === "telat") {
                      setManualPoints(0);
                      setManualNotes(
                        "Terlambat < 1 jam (Sanksi fisik di tempat)",
                      );
                    } else if (newStatus === "izin" || newStatus === "sakit") {
                      setManualPoints(5);
                    } else if (newStatus === "alfa") {
                      setManualPoints(15);
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-2.5 text-xs text-[#0a192f] dark:text-slate-100 focus:outline-hidden focus:border-[#f97316] rounded-lg"
                >
                  <option value="hadir">HADIR (0 POIN)</option>
                  <option value="telat">TELAT (SANKSI SESUAI JAM)</option>
                  <option value="izin">IZIN (5 POIN)</option>
                  <option value="sakit">SAKIT (5 POIN)</option>
                  <option value="alfa">ALFA (15 POIN)</option>
                </select>
              </div>

              {/* Preset Opsi Sanksi Keterlambatan (SOP Komdis) */}
              {manualStatus === "telat" && (
                <div className="space-y-1.5 p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                      ⚡ PRESET SANKSI KETERLAMBATAN
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setManualPoints(0);
                        setManualNotes(
                          "Terlambat < 1 jam (Sanksi fisik di tempat)",
                        );
                      }}
                      className={`text-left px-2.5 py-1.5 rounded-lg border font-mono text-[10px] sm:text-[11px] transition-all cursor-pointer flex items-center justify-between ${
                        manualPoints === 0
                          ? "bg-amber-100 dark:bg-amber-900/60 border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-100 font-bold shadow-2xs"
                          : "bg-white dark:bg-slate-900 border-amber-200/70 dark:border-amber-900/40 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/60"
                      }`}
                    >
                      <span>
                        🏃 <strong>Sanksi Fisik Saja</strong> (&lt; 1 Jam)
                      </span>
                      <span className="text-amber-700 dark:text-amber-300 font-bold shrink-0 ml-1">
                        0 PTS
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setManualPoints(3);
                        setManualNotes(
                          "Terlambat > 1 jam (Izin diterima - sanksi fisik + 3 poin)",
                        );
                      }}
                      className={`text-left px-2.5 py-1.5 rounded-lg border font-mono text-[10px] sm:text-[11px] transition-all cursor-pointer flex items-center justify-between ${
                        manualPoints === 3
                          ? "bg-amber-100 dark:bg-amber-900/60 border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-100 font-bold shadow-2xs"
                          : "bg-white dark:bg-slate-900 border-amber-200/70 dark:border-amber-900/40 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/60"
                      }`}
                    >
                      <span>
                        📋 <strong>Fisik + Poin (Izin Diterima)</strong>
                      </span>
                      <span className="text-amber-700 dark:text-amber-300 font-bold shrink-0 ml-1">
                        +3 PTS
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setManualPoints(5);
                        setManualNotes(
                          "Terlambat > 1 jam (Izin ditolak/tanpa izin - sanksi fisik + 5 poin)",
                        );
                      }}
                      className={`text-left px-2.5 py-1.5 rounded-lg border font-mono text-[10px] sm:text-[11px] transition-all cursor-pointer flex items-center justify-between ${
                        manualPoints === 5
                          ? "bg-amber-100 dark:bg-amber-900/60 border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-100 font-bold shadow-2xs"
                          : "bg-white dark:bg-slate-900 border-amber-200/70 dark:border-amber-900/40 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/60"
                      }`}
                    >
                      <span>
                        ⚠️ <strong>Fisik + Poin (Izin Ditolak)</strong>
                      </span>
                      <span className="text-red-600 dark:text-red-400 font-bold shrink-0 ml-1">
                        +5 PTS
                      </span>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 font-semibold">
                  POIN SANKSI YANG DITETAPKAN:
                </label>
                <input
                  type="number"
                  min={0}
                  value={manualPoints}
                  onChange={(e) => setManualPoints(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-2.5 text-xs text-[#f97316] dark:text-orange-400 font-bold focus:outline-hidden focus:border-[#f97316] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 font-semibold">
                  CATATAN / ALASAN OVERRIDE:
                </label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Contoh: Terlambat 1 jam 15 menit (Izin diterima)..."
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-2.5 text-xs text-[#0a192f] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-[#f97316] rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsManualOpen(false)}
                  className="flex-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs rounded-lg cursor-pointer"
                >
                  BATAL
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#1e40af] dark:hover:bg-blue-500 text-white font-mono text-xs uppercase tracking-wider rounded-lg cursor-pointer"
                >
                  {isPending ? (
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    "SIMPAN PRESENSI"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL POPUP PENETAPAN SANKSI KETERLAMBATAN (> 1 JAM) ── */}
      {latePenaltyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-500 dark:border-amber-500/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 rounded-xl text-amber-800 dark:text-amber-300 shrink-0">
                  <HugeiconsIcon icon={Alert02Icon} size={24} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Sanksi Keterlambatan (&gt; 1 Jam)
                  </h3>
                  <p className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-semibold">
                    Terlambat {latePenaltyTarget.diffMinutes} menit dari waktu
                    mulai kegiatan
                  </p>
                </div>
              </div>
            </div>

            {/* Info Anggota */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl">
              <div className="relative w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold font-mono text-xs overflow-hidden shrink-0">
                {latePenaltyTarget.avatarUrl ? (
                  <Image
                    src={latePenaltyTarget.avatarUrl}
                    alt={latePenaltyTarget.fullName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  latePenaltyTarget.fullName.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate font-display">
                  {latePenaltyTarget.fullName}
                </div>
                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  NIM: {latePenaltyTarget.nim || "-"}
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSaveLatePenalty}
              className="space-y-3.5 font-mono text-xs"
            >
              {/* Preset Pilihan Cepat SOP Komdis */}
              <div className="space-y-1.5 p-3 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 mb-1">
                  ⚡ PILIH SANKSI SOP KOMDIS:
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setLatePenaltyPoints(0);
                      setLatePenaltyNotes(
                        `Terlambat ${latePenaltyTarget.diffMinutes} menit (Sanksi fisik saja di tempat)`,
                      );
                    }}
                    className={`text-left px-2.5 py-2 rounded-lg border font-mono text-[11px] transition-all cursor-pointer flex items-center justify-between ${
                      latePenaltyPoints === 0
                        ? "bg-amber-100 dark:bg-amber-900/60 border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-100 font-bold shadow-2xs"
                        : "bg-white dark:bg-slate-900 border-amber-200/70 dark:border-amber-900/40 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/60"
                    }`}
                  >
                    <span>
                      🏃 <strong>Sanksi Fisik Saja</strong> (Dispensasi)
                    </span>
                    <span className="text-amber-700 dark:text-amber-300 font-bold shrink-0 ml-1">
                      0 PTS
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLatePenaltyPoints(3);
                      setLatePenaltyNotes(
                        `Terlambat ${latePenaltyTarget.diffMinutes} menit (Izin diterima - sanksi fisik + 3 poin)`,
                      );
                    }}
                    className={`text-left px-2.5 py-2 rounded-lg border font-mono text-[11px] transition-all cursor-pointer flex items-center justify-between ${
                      latePenaltyPoints === 3
                        ? "bg-amber-100 dark:bg-amber-900/60 border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-100 font-bold shadow-2xs"
                        : "bg-white dark:bg-slate-900 border-amber-200/70 dark:border-amber-900/40 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/60"
                    }`}
                  >
                    <span>
                      📋 <strong>Fisik + Poin (Izin Diterima)</strong>
                    </span>
                    <span className="text-amber-700 dark:text-amber-300 font-bold shrink-0 ml-1">
                      +3 PTS
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLatePenaltyPoints(5);
                      setLatePenaltyNotes(
                        `Terlambat ${latePenaltyTarget.diffMinutes} menit (Izin ditolak/tanpa izin - sanksi fisik + 5 poin)`,
                      );
                    }}
                    className={`text-left px-2.5 py-2 rounded-lg border font-mono text-[11px] transition-all cursor-pointer flex items-center justify-between ${
                      latePenaltyPoints === 5
                        ? "bg-amber-100 dark:bg-amber-900/60 border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-100 font-bold shadow-2xs"
                        : "bg-white dark:bg-slate-900 border-amber-200/70 dark:border-amber-900/40 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/60"
                    }`}
                  >
                    <span>
                      ⚠️ <strong>Fisik + Poin (Izin Ditolak/Tanpa Izin)</strong>
                    </span>
                    <span className="text-red-600 dark:text-red-400 font-bold shrink-0 ml-1">
                      +5 PTS
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 font-semibold">
                  POIN SANKSI DITERAPKAN:
                </label>
                <input
                  type="number"
                  min={0}
                  value={latePenaltyPoints}
                  onChange={(e) => setLatePenaltyPoints(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-2.5 text-xs text-amber-600 dark:text-orange-400 font-bold focus:outline-hidden focus:border-amber-500 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 font-semibold">
                  CATATAN SANKSI KETERLAMBATAN:
                </label>
                <input
                  type="text"
                  value={latePenaltyNotes}
                  onChange={(e) => setLatePenaltyNotes(e.target.value)}
                  placeholder="Keterangan sanksi..."
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-2.5 text-xs text-[#0a192f] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLatePenaltyTarget(null)}
                  className="flex-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs rounded-lg cursor-pointer"
                >
                  BATAL / LEWATI
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs uppercase tracking-wider rounded-lg cursor-pointer"
                >
                  {isPending ? (
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    "SIMPAN & LANJUT SCAN"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
