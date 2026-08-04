"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import {
  scanAttendanceQRByAdmin,
  recordManualAttendance,
  batchMarkAlfa,
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
} from "@hugeicons/core-free-icons";

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

  const [isPending, startTransition] = useTransition();

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<{ token: string; time: number } | null>(null);

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
              toast.success(res.message || "Presensi Berhasil Dicatat");
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          type="button"
          onClick={() => setIsManualOpen(true)}
          className="bg-[#1e3a8a] hover:bg-[#1e40af] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-medium text-xs rounded-lg cursor-pointer py-3 shadow-xs"
        >
          <HugeiconsIcon icon={UserCheck01Icon} size={16} className="mr-2" />
          OVERRIDE MANUAL
        </Button>

        <Button
          type="button"
          disabled={isPending}
          onClick={handleBatchAlfa}
          className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 text-white font-medium text-xs rounded-lg cursor-pointer py-3 shadow-xs"
        >
          <HugeiconsIcon icon={UserGroupIcon} size={16} className="mr-2" />
          BATCH MARK ALFA
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
                  onChange={(e) =>
                    setManualStatus(
                      e.target.value as
                        | "hadir"
                        | "telat"
                        | "izin"
                        | "sakit"
                        | "alfa",
                    )
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-2.5 text-xs text-[#0a192f] dark:text-slate-100 focus:outline-hidden focus:border-[#f97316] rounded-lg"
                >
                  <option value="hadir">HADIR (0 POIN)</option>
                  <option value="telat">TELAT (SANKSI SESUAI JAM)</option>
                  <option value="izin">IZIN (5 POIN)</option>
                  <option value="sakit">SAKIT (5 POIN)</option>
                  <option value="alfa">ALFA (15 POIN)</option>
                </select>
              </div>

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
                  placeholder="Contoh: HP anggota rusak / terlambat > 1 jam..."
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
    </div>
  );
}
