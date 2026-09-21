"use client";

import { useState } from "react";
import Image from "next/image";
import { verifyManualPaymentAction } from "@/lib/actions/event-admin";
import type { EventRegistration } from "@/types/event-registration";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  Loader2,
  Building2,
  FileText,
  AlertCircle,
  Eye,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ManualPaymentVerificationListProps {
  initialRegistrations: EventRegistration[];
}

export function ManualPaymentVerificationList({
  initialRegistrations,
}: ManualPaymentVerificationListProps) {
  const [registrations, setRegistrations] =
    useState<EventRegistration[]>(initialRegistrations);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  const [rejectModalReg, setRejectModalReg] =
    useState<EventRegistration | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredRegistrations = registrations.filter((reg) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      reg.team_name.toLowerCase().includes(q) ||
      reg.registration_code.toLowerCase().includes(q) ||
      reg.institution.toLowerCase().includes(q) ||
      reg.team_email.toLowerCase().includes(q)
    );
  });

  const pendingCount = registrations.filter(
    (r) => r.payment_status === "pending_verification",
  ).length;

  const handleApprove = async (reg: EventRegistration) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menyetujui pembayaran tim ${reg.team_name}? Status akan diubah ke Lunas dan email E-Tiket dikirim.`,
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    const res = await verifyManualPaymentAction(reg.id, "approve");
    setIsSubmitting(false);

    if (res.success) {
      setRegistrations(
        registrations.map((r) =>
          r.id === reg.id
            ? {
                ...r,
                payment_status: "paid",
                paid_at: new Date().toISOString(),
              }
            : r,
        ),
      );
    } else {
      alert(res.error || "Gagal menyetujui pembayaran.");
    }
  };

  const handleOpenRejectModal = (reg: EventRegistration) => {
    setRejectModalReg(reg);
    setRejectionReason("");
    setErrorMsg(null);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalReg) return;
    if (!rejectionReason.trim()) {
      setErrorMsg("Alasan penolakan wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await verifyManualPaymentAction(
      rejectModalReg.id,
      "reject",
      rejectionReason,
    );

    setIsSubmitting(false);

    if (res.success) {
      setRegistrations(
        registrations.map((r) =>
          r.id === rejectModalReg.id
            ? {
                ...r,
                payment_status: "rejected",
                rejection_reason: rejectionReason.trim(),
              }
            : r,
        ),
      );
      setRejectModalReg(null);
    } else {
      setErrorMsg(res.error || "Gagal menolak bukti pembayaran.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header statistik + pencarian */}
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-warning/30 bg-warning-soft p-3 text-warning">
            <Clock className="size-6" aria-hidden="true" />
          </div>
          <div>
            <h3 className="flex flex-wrap items-center gap-2 font-display text-md font-semibold text-foreground">
              Menunggu Verifikasi Manual
              <Badge
                variant="secondary"
                className="border-warning/20 bg-warning-soft font-mono text-warning tabular-nums"
              >
                {pendingCount} Pending
              </Badge>
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Bukti pembayaran yang perlu diverifikasi admin.
            </p>
          </div>
        </div>

        <div className="relative w-full sm:min-w-[260px]">
          <Search
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tim, kode, email…"
            aria-label="Cari bukti pembayaran"
            className="min-h-[44px] w-full rounded-md border border-border bg-background pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
          />
        </div>
      </div>

      {filteredRegistrations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <FileText
            className="mx-auto size-10 text-muted-foreground"
            aria-hidden="true"
          />
          <h3 className="mt-2 font-display text-md font-semibold text-foreground">
            Tidak ada bukti pembayaran ditemukan
          </h3>
          <p className="mx-auto mt-1 max-w-prose text-sm text-muted-foreground">
            {searchQuery
              ? "Tidak ada pendaftaran yang sesuai dengan kata kunci pencarian."
              : "Semua pendaftaran telah diverifikasi atau belum ada yang mengunggah bukti pembayaran."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredRegistrations.map((reg) => {
            const isPending = reg.payment_status === "pending_verification";
            const isApproved = reg.payment_status === "paid";
            const isRejected = reg.payment_status === "rejected";

            return (
              <article
                key={reg.id}
                className={cn(
                  "flex flex-col justify-between gap-4 rounded-lg border bg-card p-4 transition-colors duration-150 sm:p-5",
                  isPending && "border-warning/50 ring-2 ring-warning/10",
                  isApproved && "border-success/30",
                  isRejected && "border-destructive/30",
                  !isPending && !isApproved && !isRejected && "border-border",
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
                    <div className="min-w-0">
                      <span className="block font-mono text-micro font-semibold text-muted-foreground">
                        {reg.registration_code}
                      </span>
                      <h3 className="truncate font-display text-md font-semibold text-foreground">
                        {reg.team_name}
                      </h3>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
                        <Building2
                          className="size-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        {reg.institution}
                      </p>
                    </div>

                    <Badge
                      variant="secondary"
                      className={cn(
                        "shrink-0 uppercase",
                        isPending &&
                          "border-warning/30 bg-warning-soft text-warning",
                        isApproved &&
                          "border-success/30 bg-success-soft text-success",
                        isRejected &&
                          "border-destructive/30 bg-destructive/10 text-destructive",
                      )}
                    >
                      {isPending && "Menunggu Verifikasi"}
                      {isApproved && "Lunas / Disetujui"}
                      {isRejected && "Ditolak"}
                      {!isPending &&
                        !isApproved &&
                        !isRejected &&
                        reg.payment_status}
                    </Badge>
                  </div>

                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Kategori</dt>
                      <dd className="truncate font-medium text-foreground">
                        {reg.category?.name || "Kategori Lomba"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Nominal</dt>
                      <dd className="font-mono font-semibold text-primary">
                        Rp {Number(reg.total_amount).toLocaleString("id-ID")}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">WhatsApp</dt>
                      <dd>
                        <a
                          href={`https://wa.me/${reg.team_whatsapp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 font-medium text-success hover:underline"
                        >
                          {reg.team_whatsapp}{" "}
                          <ExternalLink className="size-3" aria-hidden="true" />
                        </a>
                      </dd>
                    </div>
                  </dl>

                  <div className="pt-1">
                    <span className="mb-1.5 block text-sm font-medium text-foreground">
                      Bukti Transfer Bank:
                    </span>
                    {reg.manual_payment_proof_url ? (
                      <div className="group relative flex aspect-video items-center justify-center overflow-hidden rounded-md border border-border bg-secondary">
                        <Image
                          src={reg.manual_payment_proof_url}
                          alt={`Bukti pembayaran ${reg.team_name}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedProofUrl(reg.manual_payment_proof_url)
                          }
                          aria-label={`Lihat bukti pembayaran ${reg.team_name} fullscreen`}
                          className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/40 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          <Eye className="size-4" aria-hidden="true" /> Lihat
                          Fullscreen
                        </button>
                      </div>
                    ) : (
                      <p className="rounded-md border border-border bg-secondary p-3 text-center text-sm text-muted-foreground italic">
                        Belum ada gambar bukti transfer diunggah.
                      </p>
                    )}
                  </div>

                  {isRejected && reg.rejection_reason && (
                    <div className="space-y-1 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      <span className="flex items-center gap-1 font-semibold">
                        <AlertCircle className="size-3.5" aria-hidden="true" />{" "}
                        Alasan Penolakan:
                      </span>
                      <p className="text-xs">{reg.rejection_reason}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    disabled={isSubmitting || !reg.manual_payment_proof_url}
                    onClick={() => handleApprove(reg)}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-md bg-success px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    <CheckCircle2 className="size-4" aria-hidden="true" />{" "}
                    Setujui
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting || !reg.manual_payment_proof_url}
                    onClick={() => handleOpenRejectModal(reg)}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-md bg-destructive px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    <XCircle className="size-4" aria-hidden="true" /> Tolak
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Fullscreen bukti */}
      {selectedProofUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedProofUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau bukti pembayaran"
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-4xl items-center justify-center overflow-hidden rounded-lg bg-black p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedProofUrl(null)}
              aria-label="Tutup pratinjau"
              className="absolute top-4 right-4 z-10 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-secondary p-2 text-foreground transition-colors hover:bg-secondary/70"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
            <div className="relative h-[80vh] w-full">
              <Image
                src={selectedProofUrl}
                alt="Bukti transfer fullscreen"
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal alasan tolak */}
      {rejectModalReg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Tolak bukti pembayaran"
        >
          <div className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
            <div>
              <h3 className="font-display text-md font-semibold text-foreground">
                Tolak Bukti Pembayaran
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Tim: <strong>{rejectModalReg.team_name}</strong> (
                <span className="font-mono text-xs">
                  {rejectModalReg.registration_code}
                </span>
                )
              </p>
            </div>

            {errorMsg && (
              <p
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive"
              >
                {errorMsg}
              </p>
            )}

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label
                  htmlFor="rejection-reason"
                  className="mb-1 block text-sm font-medium text-foreground"
                >
                  Alasan Penolakan *
                </label>
                <textarea
                  id="rejection-reason"
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Nominal transfer tidak sesuai / Bukti buram / Rekening tujuan salah."
                  className="min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Alasan ini dikirim ke email peserta agar dapat mengunggah
                  ulang bukti yang benar.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setRejectModalReg(null)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : null}
                  {isSubmitting ? "Mengirim…" : "Kirim Penolakan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
