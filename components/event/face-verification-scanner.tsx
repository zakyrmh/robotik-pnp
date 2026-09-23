"use client";

import { useState } from "react";
import Image from "next/image";
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
  AlertTriangle,
  ShieldAlert,
  Loader2,
  UserCheck,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function FaceVerificationScanner() {
  const [qrTokenInput, setQrTokenInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [memberData, setMemberData] = useState<
    (EventTeamMember & { registration: EventRegistration }) | null
  >(null);

  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Violation modal state
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [violationType, setViolationType] = useState("joki");
  const [warningNumber, setWarningNumber] = useState(1);
  const [violationDesc, setViolationDesc] = useState("");

  const handleScanLookup = async (token: string) => {
    if (!token.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setMemberData(null);

    const res = await getMemberByQrTokenAction(token.trim());
    setIsLoading(false);

    if (res.success) {
      setMemberData(res.data);
    } else {
      setErrorMsg(res.error || "Anggota tidak ditemukan.");
    }
  };

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
      {/* Search/Scan QR Input */}
      <div className="bg-card p-5 sm:p-6 rounded-lg border border-border shadow-xs space-y-4">
        <h2 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
          <QrCode className="size-5 text-primary" aria-hidden="true" /> Scan /
          Input Token QR Kokarde Anggota
        </h2>
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
            className="inline-flex min-h-[44px] items-center justify-center px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              "Cek QR"
            )}
          </button>
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

          {/* Action Buttons (Min 44px Touch Targets) */}
          <div className="border-t border-border pt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleVerifyResult("verified")}
                disabled={isSubmitting}
                className="inline-flex min-h-[44px] items-center gap-1.5 px-4 py-2.5 bg-success hover:bg-success/90 text-white rounded-md text-xs font-semibold shadow-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <UserCheck className="size-4" aria-hidden="true" /> Wajah Cocok
                (Verified)
              </button>
              <button
                onClick={() => handleVerifyResult("mismatch")}
                disabled={isSubmitting}
                className="inline-flex min-h-[44px] items-center gap-1.5 px-4 py-2.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-md text-xs font-semibold shadow-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <UserX className="size-4" aria-hidden="true" /> Wajah Beda
                (Mismatch)
              </button>
            </div>

            <button
              onClick={() => setShowViolationModal(true)}
              className="inline-flex min-h-[44px] items-center gap-1.5 px-3 py-2 bg-warning-soft text-warning border border-warning/30 hover:bg-warning/20 rounded-md text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ShieldAlert className="size-4 text-warning" aria-hidden="true" />{" "}
              Catat Pelanggaran Tim
            </button>
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
                  placeholder="Tuliskan alasan / bukti singkat..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowViolationModal(false)}
                  className="inline-flex min-h-[44px] items-center px-4 py-2 font-semibold text-muted-foreground hover:bg-secondary rounded-md transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-[44px] items-center px-4 py-2 bg-warning text-warning-foreground font-semibold rounded-md hover:bg-warning/90 transition-colors"
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
