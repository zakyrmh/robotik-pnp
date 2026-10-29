"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import type { Html5Qrcode as Html5QrcodeType } from "html5-qrcode";
import {
  getMemberByQrTokenAction,
  submitFaceVerificationAction,
  logEventViolationAction,
} from "@/lib/actions/event-admin";
import type {
  EventTeamMember,
  EventRegistration,
} from "@/types/event-registration";
import {
  QrCode,
  Camera,
  CameraOff,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  UserCheck,
  UserX,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function FaceVerificationScanner() {
  const [qrTokenInput, setQrTokenInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [memberData, setMemberData] = useState<
    (EventTeamMember & { registration: EventRegistration }) | null
  >(null);

  // Scanner state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeType | null>(null);
  const lastScannedRef = useRef<{ token: string; time: number } | null>(null);

  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Violation modal state
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [violationType, setViolationType] = useState("joki");
  const [warningNumber, setWarningNumber] = useState(1);
  const [violationDesc, setViolationDesc] = useState("");

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn("Gagal menghentikan scanner kamera:", err);
      }
      scannerRef.current = null;
    }
    const el = document.getElementById("mrc-qr-reader");
    if (el) el.innerHTML = "";
    setIsCameraActive(false);
  }, []);

  const handleScanLookup = useCallback(
    async (token: string) => {
      const cleanToken = token.trim();
      if (!cleanToken) return;

      setIsLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      setMemberData(null);

      const res = await getMemberByQrTokenAction(cleanToken);
      setIsLoading(false);

      if (res.success) {
        setMemberData(res.data);
        // shortcut: auto-stop camera on successful scan to save device battery & focus user on verification
        void stopCamera();
      } else {
        setErrorMsg(res.error || "Anggota tidak ditemukan.");
      }
    },
    [stopCamera],
  );

  const startCamera = async () => {
    setCameraError(null);
    setErrorMsg(null);
    setIsStartingCamera(true);
    setIsCameraActive(true);

    // Pastikan DOM sudah me-render container viewfinder sebelum scanner mengukur lebar/tinggi elemen
    await new Promise((resolve) => setTimeout(resolve, 80));

    await stopCamera();
    setIsCameraActive(true);

    const element = document.getElementById("mrc-qr-reader");
    if (!element) {
      setIsStartingCamera(false);
      setIsCameraActive(false);
      setCameraError("Wadah viewfinder kamera tidak ditemukan.");
      return;
    }

    try {
      // Lazy load html5-qrcode hanya di client side saat tombol diklik (zero server bundle overhead)
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("mrc-qr-reader");
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      const onScanSuccess = (decodedText: string) => {
        const now = Date.now();
        if (
          lastScannedRef.current &&
          lastScannedRef.current.token === decodedText &&
          now - lastScannedRef.current.time < 3000
        ) {
          return;
        }
        lastScannedRef.current = { token: decodedText, time: now };
        setQrTokenInput(decodedText);
        handleScanLookup(decodedText);
      };

      try {
        // Coba kamera belakang (environment) terlebih dahulu
        await scanner.start(
          { facingMode: "environment" },
          config,
          onScanSuccess,
          () => {},
        );
      } catch (envErr) {
        console.warn(
          "Kamera belakang tidak tersedia, mencoba fallback kamera depan/default:",
          envErr,
        );
        // Fallback jika perangkat laptop/PC tidak punya 'environment' camera
        await scanner.start(
          { facingMode: "user" },
          config,
          onScanSuccess,
          () => {},
        );
      }

      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera scanner start error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("NotAllowedError") ||
        msg.includes("Permission") ||
        msg.includes("denied")
      ) {
        setCameraError(
          "Izin kamera ditolak. Harap izinkan akses kamera di peramban Anda.",
        );
      } else if (msg.includes("NotReadableError") || msg.includes("in use")) {
        setCameraError(
          "Kamera sedang dipakai oleh aplikasi lain. Tutup aplikasi lain lalu coba lagi.",
        );
      } else if (
        msg.includes("NotFoundError") ||
        msg.includes("requested device")
      ) {
        setCameraError("Kamera tidak terdeteksi pada perangkat ini.");
      } else {
        setCameraError(msg || "Gagal mengakses kamera.");
      }
      setIsCameraActive(false);
    } finally {
      setIsStartingCamera(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch (e) {
          console.warn("Cleanup scanner error:", e);
        }
      }
    };
  }, []);

  const handleVerifyResult = async (result: "verified" | "mismatch") => {
    if (!memberData) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await submitFaceVerificationAction(
      memberData.id,
      result,
      notes,
    );
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(
        `Verifikasi wajah berhasil dicatat sebagai: ${result.toUpperCase()}`,
      );
      setMemberData({ ...memberData, verification_status: result });
    } else {
      setErrorMsg(res.error || "Gagal mencatat verifikasi.");
    }
  };

  const handleLogViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberData) return;

    setIsSubmitting(true);
    const res = await logEventViolationAction(
      memberData.registration.id,
      violationType,
      warningNumber,
      violationDesc,
    );
    setIsSubmitting(false);

    if (res.success) {
      setShowViolationModal(false);
      setSuccessMsg(
        `Pelanggaran "${violationType}" berhasil dicatat untuk tim ${memberData.registration.team_name}.`,
      );
    } else {
      setErrorMsg(res.error || "Gagal mencatat pelanggaran.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Scanner & Manual Input */}
      <div className="bg-card p-5 sm:p-6 rounded-lg border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
            <QrCode className="size-5 text-primary" aria-hidden="true" /> Scan /
            Cari QR Kokarde Peserta
          </h2>
          <button
            type="button"
            disabled={isStartingCamera}
            onClick={isCameraActive ? stopCamera : startCamera}
            className={cn(
              "inline-flex min-h-[44px] items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
              isCameraActive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary-hover",
            )}
          >
            {isStartingCamera ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />{" "}
                Menyiapkan Kamera...
              </>
            ) : isCameraActive ? (
              <>
                <CameraOff className="size-4" aria-hidden="true" /> Matikan
                Kamera
              </>
            ) : (
              <>
                <Camera className="size-4" aria-hidden="true" /> Buka Kamera
              </>
            )}
          </button>
        </div>

        {/* Viewfinder Kamera */}
        <div
          className={cn(
            "relative overflow-hidden rounded-lg border border-border bg-black/5 dark:bg-black/40 transition-all",
            isCameraActive || isStartingCamera ? "min-h-[280px] p-2" : "hidden",
          )}
        >
          <div
            id="mrc-qr-reader"
            className="w-full overflow-hidden rounded-md [&_video]:w-full [&_video]:object-cover [&_video]:rounded-md"
          />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Arahkan kamera ke QR code yang tercetak di kokarde atau e-ticket
            peserta.
          </p>
        </div>

        {cameraError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {cameraError}
          </div>
        )}

        {/* Input manual sebagai alternatif */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">
            Atau masukkan Token QR secara manual:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Paste member_qr_token (UUID)..."
              value={qrTokenInput}
              onChange={(e) => setQrTokenInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleScanLookup(qrTokenInput);
              }}
              className="flex-1 min-h-[44px] px-3 py-2 border border-input bg-background rounded-md text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={() => handleScanLookup(qrTokenInput)}
              disabled={isLoading}
              className="inline-flex min-h-[44px] items-center justify-center px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                "Cek QR"
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs text-destructive font-medium">{errorMsg}</p>
        )}
        {successMsg && (
          <p className="text-xs text-success font-medium">{successMsg}</p>
        )}
      </div>

      {/* Member Display & Face Matching Card */}
      {memberData && (
        <div className="bg-card rounded-lg border border-border shadow-xs p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <span className="text-xs text-muted-foreground block">
                Kategori Lomba:
              </span>
              <h3 className="font-display font-semibold text-foreground text-lg">
                {memberData.registration.category?.name ||
                  "Minangkabau Robot Contest"}
              </h3>
              <p className="text-xs text-primary font-semibold">
                Tim: {memberData.registration.team_name} (
                {memberData.registration.institution})
              </p>
            </div>
            <span
              className={cn(
                "px-3 py-1 rounded-full text-micro font-bold uppercase tracking-wider border",
                memberData.verification_status === "verified"
                  ? "bg-success-soft text-success border-success/30"
                  : memberData.verification_status === "mismatch"
                    ? "bg-destructive/10 text-destructive border-destructive/30"
                    : "bg-warning-soft text-warning border-warning/30",
              )}
            >
              {memberData.verification_status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="text-center space-y-2">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">
                Pas Foto Terdaftar
              </span>
              <Image
                src={memberData.photo_url}
                alt={memberData.full_name}
                width={192}
                height={192}
                className="size-48 object-cover rounded-lg border border-border mx-auto shadow-xs bg-secondary"
              />
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-muted-foreground block">
                  Nama Anggota:
                </span>
                <p className="text-base font-bold text-foreground">
                  {memberData.full_name}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  Peran dalam Tim:
                </span>
                <p className="text-sm font-semibold text-foreground/90">
                  {memberData.role_in_team}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  Kode Pendaftaran Tim:
                </span>
                <p className="text-xs font-mono font-bold text-foreground">
                  {memberData.registration.registration_code}
                </p>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-medium text-foreground mb-1">
                  Catatan Panitia (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan hasil pencocokan fisik..."
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-border pt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleVerifyResult("verified")}
                disabled={isSubmitting}
                className="inline-flex min-h-[44px] items-center gap-1.5 px-4 py-2.5 bg-success hover:bg-success/90 text-white rounded-md text-xs font-semibold shadow-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <UserCheck className="size-4" aria-hidden="true" /> Peserta Asli
                (Cocok)
              </button>
              <button
                onClick={() => handleVerifyResult("mismatch")}
                disabled={isSubmitting}
                className="inline-flex min-h-[44px] items-center gap-1.5 px-4 py-2.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-md text-xs font-semibold shadow-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <UserX className="size-4" aria-hidden="true" /> Tidak Cocok
                (Penyusup/Joki)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setMemberData(null);
                  setQrTokenInput("");
                  startCamera();
                }}
                className="inline-flex min-h-[44px] items-center gap-1.5 px-3 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RotateCw className="size-4" aria-hidden="true" /> Scan Peserta
                Lain
              </button>
              <button
                onClick={() => setShowViolationModal(true)}
                className="inline-flex min-h-[44px] items-center gap-1.5 px-3 py-2 bg-warning-soft text-warning border border-warning/30 hover:bg-warning/20 rounded-md text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ShieldAlert
                  className="size-4 text-warning"
                  aria-hidden="true"
                />{" "}
                Catat Pelanggaran Tim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Violation Modal */}
      {showViolationModal && memberData && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg border border-border max-w-md w-full p-6 space-y-4 shadow-lg">
            <h3 className="text-base font-display font-bold text-foreground flex items-center gap-2">
              <AlertTriangle
                className="size-5 text-warning"
                aria-hidden="true"
              />{" "}
              Catat Pelanggaran Tim ({memberData.registration.team_name})
            </h3>

            <form onSubmit={handleLogViolation} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Jenis Pelanggaran *
                </label>
                <select
                  value={violationType}
                  onChange={(e) => setViolationType(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 border border-input bg-background rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="joki">
                    Indikasi Joki / Wajah Tidak Cocok
                  </option>
                  <option value="terlambat">
                    Keterlambatan Ulang / Briefing
                  </option>
                  <option value="pelanggaran_teknis">
                    Pelanggaran Spesifikasi Robot / Teknis
                  </option>
                  <option value="perilaku">Pelanggaran Etika & Perilaku</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Tingkat Peringatan (SP) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={3}
                  value={warningNumber}
                  onChange={(e) => setWarningNumber(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 py-2 border border-input bg-background rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Keterangan / Deskripsi Kronologi
                </label>
                <textarea
                  value={violationDesc}
                  onChange={(e) => setViolationDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  placeholder="Jelaskan detail ketidakcocokan wajah / dokumen..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowViolationModal(false)}
                  className="px-4 py-2 border border-input rounded-md text-foreground hover:bg-muted font-medium min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-md font-semibold min-h-[44px]"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Pelanggaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
