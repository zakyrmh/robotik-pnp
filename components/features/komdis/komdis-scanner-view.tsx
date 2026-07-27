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
              message: res.message || "Presensi Berhasil Recorded",
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
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header Info */}
      <Card className="bg-surface-card-dark border-hairline-dark rounded-none text-center p-6 shadow-none">
        <CardHeader className="p-0 space-y-1">
          <div className="flex items-center justify-center gap-2 font-mono text-xs text-cyber-blue uppercase tracking-widest">
            <HugeiconsIcon icon={QrCodeIcon} size={18} />
            <span>MODUL PEMINDAL PRESIENSI KOMDIS</span>
          </div>
          <CardTitle className="text-xl font-bold uppercase text-white font-sans">
            {activityTitle}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Live Feedback Toast */}
      {scanResult && (
        <div
          className={`p-4 border font-mono text-xs uppercase tracking-wider flex items-center justify-between ${
            scanResult.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-crimson-red/10 text-crimson-red border-crimson-red/30"
          }`}
        >
          <div className="flex items-center gap-2">
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
            className="text-gray-400 hover:text-white cursor-pointer"
          >
            [ X ]
          </button>
        </div>
      )}

      {/* Camera Scanner Box */}
      <Card className="bg-surface-card-dark border-hairline-dark rounded-none p-4 shadow-none">
        <div className="text-center mb-3 font-mono text-[10px] text-gray-400 uppercase tracking-widest">
          ARAHKAN KAMERA HP KE DYNAMIC QR CODE PESERTA
        </div>
        <div
          id="reader"
          className="w-full bg-canvas-dark border border-hairline-dark overflow-hidden rounded-none text-white font-mono"
        />
      </Card>

      {/* Action Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          type="button"
          onClick={() => setIsManualOpen(true)}
          className="bg-cyber-blue hover:bg-cyber-blue/90 text-white font-mono text-xs uppercase tracking-wider rounded-none cursor-pointer py-3"
        >
          <HugeiconsIcon icon={UserCheck01Icon} size={16} className="mr-2" />[
          OVERRIDE MANUAL ]
        </Button>

        <Button
          type="button"
          disabled={isPending}
          onClick={handleBatchAlfa}
          className="bg-crimson-red hover:bg-crimson-red/90 text-white font-mono text-xs uppercase tracking-wider rounded-none cursor-pointer py-3"
        >
          <HugeiconsIcon icon={UserGroupIcon} size={16} className="mr-2" />[
          BATCH MARK ALFA ]
        </Button>
      </div>

      {/* Modal Manual Override */}
      {isManualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-surface-card-dark border border-hairline-dark p-6 max-w-md w-full space-y-4">
            <div className="border-b border-hairline-dark pb-3 flex justify-between items-center">
              <span className="font-mono text-xs text-cyber-blue uppercase tracking-widest">
                PRESENSI MANUAL OVERRIDE
              </span>
              <button
                onClick={() => setIsManualOpen(false)}
                className="text-gray-400 hover:text-white font-mono text-xs cursor-pointer"
              >
                [ TUTUP X ]
              </button>
            </div>

            <form
              onSubmit={handleManualSubmit}
              className="space-y-4 font-mono text-xs"
            >
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                  PROFILE ID / UUID ANGGOTA:
                </label>
                <input
                  type="text"
                  required
                  value={manualProfileId}
                  onChange={(e) => setManualProfileId(e.target.value)}
                  placeholder="00000000-0000-0000-0000-000000000000"
                  className="w-full bg-canvas-dark border border-hairline-dark p-2.5 text-xs text-white focus:outline-hidden focus:border-cyber-blue rounded-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">
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
                  className="w-full bg-canvas-dark border border-hairline-dark p-2.5 text-xs text-white focus:outline-hidden focus:border-cyber-blue rounded-none"
                >
                  <option value="hadir">HADIR (0 POIN)</option>
                  <option value="telat">TELAT (SANKSI SESUAI JAM)</option>
                  <option value="izin">IZIN (5 POIN)</option>
                  <option value="sakit">SAKIT (5 POIN)</option>
                  <option value="alfa">ALFA (15 POIN)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                  POIN SANKSI YANG DITETAPKAN:
                </label>
                <input
                  type="number"
                  min={0}
                  value={manualPoints}
                  onChange={(e) => setManualPoints(Number(e.target.value))}
                  className="w-full bg-canvas-dark border border-hairline-dark p-2.5 text-xs text-amber-400 font-bold focus:outline-hidden focus:border-cyber-blue rounded-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                  CATATAN / ALASAN OVERRIDE:
                </label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Contoh: HP anggota rusak / terlambat > 1 jam dengan kabar"
                  className="w-full bg-canvas-dark border border-hairline-dark p-2.5 text-xs text-white focus:outline-hidden focus:border-cyber-blue rounded-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-hairline-dark">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsManualOpen(false)}
                  className="flex-1 bg-canvas-dark border-hairline-dark text-gray-400 font-mono text-xs rounded-none cursor-pointer"
                >
                  BATAL
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-cyber-blue hover:bg-cyber-blue/90 text-white font-mono text-xs uppercase tracking-wider rounded-none cursor-pointer"
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
