"use client";

import { useEffect, useState, useTransition } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
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
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Loading03Icon,
  UserCheck01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

interface KomdisScannerViewProps {
  activityId: string;
  activityTitle: string;
}

export function KomdisScannerView({
  activityId,
  activityTitle,
}: KomdisScannerViewProps) {
  const [scanResult, setScanResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualProfileId, setManualProfileId] = useState("");
  const [manualStatus, setManualStatus] = useState<
    "hadir" | "telat" | "izin" | "sakit" | "alfa"
  >("hadir");
  const [manualPoints, setManualPoints] = useState<number>(0);
  const [manualNotes, setManualNotes] = useState("");

  const [isPending, startTransition] = useTransition();

  // HTML5 QR Code Scanner setup
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false,
    );

    scanner.render(
      async (decodedText) => {
        startTransition(async () => {
          const res = await scanAttendanceQRByAdmin(activityId, decodedText);
          if (res.success) {
            setScanResult({
              type: "success",
              message: res.message || "Presensi Berhasil Dicatat",
            });
          } else {
            setScanResult({
              type: "error",
              message: res.message || "Gagal memproses QR Code",
            });
          }
        });
      },
      () => {},
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [activityId]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualProfileId.trim()) {
      alert("ID Profil / UUID Anggota wajib diisi.");
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
        setScanResult({
          type: "success",
          message: "Presensi manual berhasil dicatat.",
        });
      } catch (err: unknown) {
        alert(
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
        setScanResult({
          type: "success",
          message: `Berhasil memproses Penandaan Alfa Massal (${res.count} anggota).`,
        });
      } catch (err: unknown) {
        alert(
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

      {/* Live Feedback Toast */}
      {scanResult && (
        <div
          className={`p-3.5 sm:p-4 border rounded-xl font-mono text-xs uppercase tracking-wider flex items-center justify-between shadow-xs ${
            scanResult.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60"
              : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900/60"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <HugeiconsIcon
              icon={
                scanResult.type === "success"
                  ? CheckmarkCircle01Icon
                  : Cancel01Icon
              }
              size={20}
            />
            <span>{scanResult.message}</span>
          </div>
          <button
            onClick={() => setScanResult(null)}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer font-bold"
          >
            [ X ]
          </button>
        </div>
      )}

      {/* Camera Scanner Box */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-xs">
        <div className="text-center mb-3 font-mono text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">
          ARAHKAN KAMERA HP KE DYNAMIC QR CODE PESERTA
        </div>
        <div
          id="reader"
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden rounded-lg font-mono text-slate-900 dark:text-slate-100"
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
