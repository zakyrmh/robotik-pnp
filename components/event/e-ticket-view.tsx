"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { EventRegistration } from "@/types/event-registration";
import { submitManualPaymentProofAction } from "@/lib/actions/event-registration";
import { getRemainingHoldMs, isRegistrationExpired } from "@/lib/event-quota";
import { RegistrationChangeRequestForm } from "@/components/event/registration-change-request-form";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Share2,
  Upload,
  ExternalLink,
  PencilLine,
  AlertTriangle,
} from "lucide-react";

/** Format sisa waktu milidetik menjadi `HH:MM:SS`. */
function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

interface ETicketClientViewProps {
  registration: EventRegistration;
  /** Apakah batch pendaftaran masih aktif (menentukan boleh ajukan perbaikan). */
  registrationOpen?: boolean;
  /** Ada permohonan perbaikan yang sedang menunggu tinjauan. */
  hasPendingChangeRequest?: boolean;
}

export function ETicketClientView({
  registration,
  registrationOpen = false,
  hasPendingChangeRequest = false,
}: ETicketClientViewProps) {
  const [proofUrl, setProofUrl] = useState(
    registration.manual_payment_proof_url || "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showChangeForm, setShowChangeForm] = useState(false);

  // Sisa waktu masa tahan slot (ms). 0 = kedaluwarsa / bukan status sementara.
  const [remainingHoldMs, setRemainingHoldMs] = useState(() =>
    getRemainingHoldMs(registration),
  );

  // Hitung mundur masa tahan slot, diperbarui tiap detik.
  useEffect(() => {
    const id = setInterval(() => {
      setRemainingHoldMs(getRemainingHoldMs(registration));
    }, 1000);
    return () => clearInterval(id);
  }, [registration]);

  const isHoldExpired =
    isRegistrationExpired(registration) || remainingHoldMs <= 0;

  const handleManualProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofUrl) return;

    setIsSubmitting(true);
    const res = await submitManualPaymentProofAction(
      registration.access_token,
      proofUrl,
    );
    setIsSubmitting(false);

    if (res.success) {
      setMessage("Bukti pembayaran berhasil diunggah.");
    } else {
      setMessage(res.error || "Gagal mengunggah bukti pembayaran.");
    }
  };

  const getStatusBadge = () => {
    switch (registration.payment_status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-success/15 text-success border border-success/30 rounded-full text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Lunas / Terverifikasi
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-warning/15 text-warning border border-warning/30 rounded-full text-xs font-semibold">
            <Clock className="w-4 h-4" /> Menunggu Pembayaran
          </span>
        );
      case "expired":
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-destructive/10 text-destructive border border-destructive/30 rounded-full text-xs font-semibold">
            <XCircle className="w-4 h-4" /> Dibatalkan / Gagal / Expired
          </span>
        );
      default:
        return null;
    }
  };

  const waShareText = encodeURIComponent(
    `Halo Admin Panitia MRC, saya perwakilan tim *${registration.team_name}* (${registration.registration_code}). Mohon konfirmasi status pendaftaran kami.`,
  );
  const waUrl = `https://wa.me/?text=${waShareText}`;

  return (
    <div className="bg-card rounded-lg border border-border shadow-soft overflow-hidden">
      {/* Header */}
      <div className="bg-primary p-6 text-primary-foreground text-center space-y-2">
        <span className="text-xs uppercase tracking-widest font-semibold text-primary-foreground/80">
          Official E-Ticket & Pass
        </span>
        <h1 className="text-balance">
          {registration.category?.name || "Minangkabau Robot Contest"}
        </h1>
        <p className="text-xs text-primary-foreground/80">
          {registration.institution}
        </p>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Status Badge & Registration Code */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted/40 border border-border rounded-lg">
          <div>
            <span className="text-xs text-muted-foreground font-medium block">
              Kode Pendaftaran:
            </span>
            <span className="text-xl font-bold font-mono text-foreground">
              {registration.registration_code}
            </span>
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {/* Tim details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground text-xs block">
              Nama Tim:
            </span>
            <span className="font-semibold text-foreground">
              {registration.team_name}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block">
              Pembimbing:
            </span>
            <span className="font-semibold text-foreground">
              {registration.advisor_name || "-"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block">
              Email Registrasi:
            </span>
            <span className="font-semibold text-foreground break-all">
              {registration.team_email}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block">
              WhatsApp:
            </span>
            <span className="font-semibold text-foreground">
              {registration.team_whatsapp}
            </span>
          </div>
        </div>

        {/* Member QR Kokarde Section */}
        {registration.members && registration.members.length > 0 && (
          <div className="space-y-4 border-t border-border pt-6">
            <h3 className="text-foreground">Kokarde & Foto Anggota</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {registration.members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 border border-border rounded-lg flex items-center gap-4 bg-muted/40"
                >
                  <Image
                    src={member.photo_url}
                    alt={`Pas foto ${member.full_name}`}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-cover rounded-md border border-border"
                  />
                  <div className="space-y-1 min-w-0">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-secondary text-secondary-foreground border border-border rounded-full">
                      {member.role_in_team}
                    </span>
                    <h4 className="font-bold text-foreground text-sm leading-tight">
                      {member.full_name}
                    </h4>
                    {/* QR Code image URL via quickchart for member_qr_token */}
                    <div className="pt-1 flex items-center gap-2">
                      <Image
                        src={`https://quickchart.io/qr?text=${member.member_qr_token}&size=60`}
                        alt={`QR kokarde ${member.full_name}`}
                        width={40}
                        height={40}
                        className="w-10 h-10 border border-border rounded"
                      />
                      <span className="text-[10px] text-muted-foreground">
                        QR Scan Lapangan
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Countdown & Kedaluwarsa Masa Tahan Slot */}
        {registration.payment_status === "pending" && (
          <div className="border-t border-border pt-6 space-y-3">
            {isHoldExpired ? (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-center space-y-2">
                <div className="inline-flex p-2 bg-destructive/15 text-destructive rounded-full">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-destructive">
                  Pendaftaran Kedaluwarsa
                </h3>
                <p className="text-xs text-destructive/90 max-w-md mx-auto">
                  Waktu pembayaran <strong>1 jam</strong> telah habis dan slot
                  pendaftaran Anda telah dilepas. Silakan{" "}
                  <strong>daftar ulang</strong> bila kuota masih tersedia.
                </p>
                <a
                  href="/mrc"
                  className="inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold rounded-md transition-colors"
                >
                  Daftar Ulang
                </a>
              </div>
            ) : (
              <div
                className={`p-3 rounded-lg text-center border ${
                  remainingHoldMs < 15 * 60 * 1000
                    ? "bg-destructive/10 border-destructive/30"
                    : "bg-primary/5 border-primary/20"
                }`}
                role="timer"
                aria-live="polite"
              >
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Sisa waktu pembayaran
                </p>
                <p
                  className={`font-mono text-2xl font-extrabold tracking-tight ${
                    remainingHoldMs < 15 * 60 * 1000
                      ? "text-destructive"
                      : "text-foreground"
                  }`}
                >
                  {formatCountdown(remainingHoldMs)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Fallback Manual Payment Proof Upload */}
        {registration.payment_status === "pending" && !isHoldExpired && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Upload className="w-4 h-4 text-accent-strong" /> Upload Bukti
              Pembayaran Manual (Fallback)
            </h3>
            <p className="text-xs text-muted-foreground">
              Jika pembayaran melalui Midtrans mengalami kendala, Anda dapat
              mengunggah link bukti transfer manual di bawah ini untuk
              diverifikasi oleh panitia.
            </p>

            <form
              onSubmit={handleManualProofSubmit}
              className="flex flex-col sm:flex-row gap-2"
            >
              <input
                type="url"
                required
                placeholder="https://drive.google.com/..."
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                aria-label="Link bukti pembayaran manual"
                className="flex-1 min-h-[44px] px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[44px] px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold rounded-md transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isSubmitting ? "Mengirim..." : "Simpan"}
              </button>
            </form>

            {message && (
              <p className="text-xs text-success font-medium" role="status">
                {message}
              </p>
            )}
          </div>
        )}

        {/* Perbaikan Data Pendaftaran */}
        <div className="border-t border-border pt-6 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <PencilLine className="size-4 text-primary" aria-hidden="true" />
            Perbaikan Data Pendaftaran
          </h3>

          {hasPendingChangeRequest ? (
            <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning-soft p-3 text-xs font-medium text-warning">
              <Clock className="size-4 shrink-0" aria-hidden="true" />
              <span>
                Permohonan perbaikan data Anda sedang ditinjau panitia.
                Perubahan akan diterapkan setelah disetujui.
              </span>
            </div>
          ) : registrationOpen ? (
            <>
              <p className="text-xs text-muted-foreground">
                Ada kesalahan pada data tim, anggota, kontak, atau foto? Ajukan
                perbaikan — panitia akan meninjau sebelum menerapkan.
              </p>
              <button
                type="button"
                onClick={() => setShowChangeForm(true)}
                className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary hover:bg-muted text-secondary-foreground border border-border rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <PencilLine className="size-4" aria-hidden="true" />
                Ajukan Perbaikan Data
              </button>
            </>
          ) : (
            <p className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              Pendaftaran sudah ditutup. Perbaikan data tidak dapat diajukan.
              Silakan hubungi panitia.
            </p>
          )}
        </div>

        {/* Share Button & WhatsApp Reminder */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-success/15 hover:bg-success/25 text-success border border-success/30 rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Share2 className="w-4 h-4" /> Kirim Reminder via WhatsApp (wa.me)
          </a>

          {registration.payment_status === "pending" &&
            registration.total_amount > 0 && (
              <a
                href={`/mrc/bayar/${registration.access_token}`}
                className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Bayar via QRIS <ExternalLink className="w-4 h-4" />
              </a>
            )}
        </div>
      </div>

      <RegistrationChangeRequestForm
        registration={registration}
        open={showChangeForm}
        onOpenChange={setShowChangeForm}
      />
    </div>
  );
}
