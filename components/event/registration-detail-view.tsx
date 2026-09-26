"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { verifyManualPaymentAction } from "@/lib/actions/event-admin";
import type { EventRegistration, RoleEvent } from "@/types/event-registration";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  ShieldCheck,
  User,
  Users,
  XCircle,
  AlertCircle,
  Eye,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RegistrationDetailViewProps {
  registration: EventRegistration;
  roleEvent?: RoleEvent;
  isSuperAdmin?: boolean;
}

const statusBadgeStyle: Record<string, string> = {
  paid: "border-success/30 bg-success-soft text-success font-mono font-semibold",
  pending:
    "border-warning/30 bg-warning-soft text-warning font-mono font-semibold",
  pending_verification:
    "border-warning/30 bg-warning-soft text-warning font-mono font-semibold",
  expired:
    "border-destructive/30 bg-destructive/10 text-destructive font-mono font-semibold",
  failed:
    "border-destructive/30 bg-destructive/10 text-destructive font-mono font-semibold",
  rejected:
    "border-destructive/30 bg-destructive/10 text-destructive font-mono font-semibold",
};

export function RegistrationDetailView({
  registration: initialReg,
}: RegistrationDetailViewProps) {
  const [reg, setReg] = useState<EventRegistration>(initialReg);
  const [isVerifying, setIsVerifying] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(reg.registration_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleApprovePayment = async () => {
    if (!confirm("Apakah Anda yakin ingin MENYETUJUI pembayaran tim ini?"))
      return;
    setIsVerifying(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await verifyManualPaymentAction(reg.id, "approve");
    setIsVerifying(false);

    if (res.success) {
      setSuccessMsg(
        "Pembayaran berhasil disetujui (Status: PAID). Email e-ticket telah dikirim.",
      );
      setReg((prev) => ({
        ...prev,
        payment_status: "paid",
        paid_at: new Date().toISOString(),
        rejection_reason: null,
      }));
    } else {
      setErrorMsg(res.error || "Gagal memproses verifikasi.");
    }
  };

  const handleRejectPayment = async () => {
    if (!rejectReason.trim()) {
      setErrorMsg("Alasan penolakan wajib diisi.");
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await verifyManualPaymentAction(
      reg.id,
      "reject",
      rejectReason.trim(),
    );
    setIsVerifying(false);

    if (res.success) {
      setSuccessMsg(
        "Bukti pembayaran telah ditolak (Status: REJECTED). Email pemberitahuan telah dikirim.",
      );
      setReg((prev) => ({
        ...prev,
        payment_status: "rejected",
        rejection_reason: rejectReason.trim(),
      }));
      setShowRejectForm(false);
    } else {
      setErrorMsg(res.error || "Gagal memproses penolakan.");
    }
  };

  const formattedPhone = reg.team_whatsapp.replace(/[^0-9]/g, "");
  const waNumber = formattedPhone.startsWith("0")
    ? `62${formattedPhone.slice(1)}`
    : formattedPhone;
  const waUrl = `https://wa.me/${waNumber}?text=Halo%20Tim%20${encodeURIComponent(
    reg.team_name,
  )}%20(${encodeURIComponent(reg.registration_code)})%20panitia%20MRC...`;

  return (
    <div className="space-y-6">
      {/* ── Header Top Nav & Identity ── */}
      <div className="space-y-4">
        <Link
          href="/manajemen-event/pendaftaran"
          className="inline-flex min-h-[44px] items-center gap-2 text-xs sm:text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Kembali ke Daftar Pendaftaran</span>
        </Link>

        <div className="rounded-lg border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-primary bg-primary-soft border border-primary/20 px-2.5 py-1 rounded-md">
                  {reg.registration_code}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-muted-foreground hover:text-foreground text-xs p-1"
                  title="Salin kode pendaftaran"
                >
                  {copiedCode ? (
                    <Check className="size-3.5 text-success" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </button>
                <Badge variant="outline" className="font-mono text-micro">
                  {reg.category?.name || "Kategori"}
                </Badge>
                {reg.registration_batch && (
                  <Badge
                    variant="secondary"
                    className="font-mono text-micro uppercase"
                  >
                    {reg.registration_batch}
                  </Badge>
                )}
              </div>

              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                {reg.team_name}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                <Building2
                  className="size-4 text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
                <span>{reg.institution}</span>
                {reg.origin_city && (
                  <>
                    <span>•</span>
                    <MapPin
                      className="size-3.5 text-muted-foreground shrink-0"
                      aria-hidden="true"
                    />
                    <span>{reg.origin_city}</span>
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
              <Badge
                variant="outline"
                className={cn(
                  "px-3 py-1.5 text-xs uppercase",
                  statusBadgeStyle[reg.payment_status],
                )}
              >
                {reg.payment_status}
              </Badge>
              <span className="font-mono text-lg font-bold tabular-nums text-foreground">
                Rp {reg.total_amount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-soft p-4 text-xs font-medium text-success">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Main Content 2-Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Data Tim & Kontak (1 Kolom) */}
        <div className="space-y-6 lg:col-span-1">
          {/* Box 1: Informasi Tim */}
          <section className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-xs">
            <h2 className="font-display text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <User className="size-4 text-primary" aria-hidden="true" />
              Informasi Tim & Kontak Pembina
            </h2>

            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-muted-foreground font-semibold">
                  Nama Pembina
                </dt>
                <dd className="font-medium text-foreground mt-0.5">
                  {reg.advisor_name || "Tidak ada pembina"}
                </dd>
              </div>

              <div>
                <dt className="text-muted-foreground font-semibold">
                  Email Tim
                </dt>
                <dd className="font-mono text-foreground mt-0.5 flex items-center gap-1.5 overflow-hidden text-ellipsis">
                  <Mail
                    className="size-3.5 text-muted-foreground shrink-0"
                    aria-hidden="true"
                  />
                  <a
                    href={`mailto:${reg.team_email}`}
                    className="hover:underline"
                  >
                    {reg.team_email}
                  </a>
                </dd>
              </div>

              <div>
                <dt className="text-muted-foreground font-semibold">
                  WhatsApp Kontak
                </dt>
                <dd className="mt-1">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-success/30 bg-success-soft px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/20 transition-colors"
                  >
                    <MessageSquare className="size-3.5" aria-hidden="true" />
                    <span>{reg.team_whatsapp}</span>
                    <ExternalLink
                      className="size-3 ml-0.5"
                      aria-hidden="true"
                    />
                  </a>
                </dd>
              </div>

              <div>
                <dt className="text-muted-foreground font-semibold">
                  Tanggal Mendaftar
                </dt>
                <dd className="font-mono text-foreground mt-0.5 flex items-center gap-1.5">
                  <Calendar
                    className="size-3.5 text-muted-foreground shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    {new Date(reg.created_at).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </dd>
              </div>

              {reg.rules_accepted_at && (
                <div>
                  <dt className="text-muted-foreground font-semibold">
                    Persetujuan Aturan Lomba
                  </dt>
                  <dd className="font-mono text-muted-foreground mt-0.5 flex items-center gap-1 text-micro">
                    <ShieldCheck
                      className="size-3.5 text-success shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      Disetujui pada{" "}
                      {new Date(reg.rules_accepted_at).toLocaleDateString(
                        "id-ID",
                      )}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Box 2: Quick Links */}
          <section className="rounded-lg border border-border bg-card p-5 space-y-3 shadow-xs">
            <h2 className="font-display text-sm font-bold text-foreground">
              Akses E-Ticket & Kokarde
            </h2>
            <p className="text-xs text-muted-foreground">
              Halaman e-ticket publik yang dikirim ke tim via email setelah
              pembayaran lunas.
            </p>
            <a
              href={`/mrc/tiket/${reg.access_token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border border-border bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors"
            >
              <FileText className="size-4 text-primary" aria-hidden="true" />
              <span>Buka Halaman E-Ticket Publik</span>
              <ExternalLink
                className="size-3.5 text-muted-foreground"
                aria-hidden="true"
              />
            </a>
          </section>
        </div>

        {/* Right Column: Status Pembayaran & Anggota (2 Kolom) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Panel Verifikasi Pembayaran */}
          <section className="rounded-lg border border-border bg-card p-5 sm:p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-display text-md font-bold text-foreground flex items-center gap-2">
                <FileText className="size-5 text-primary" aria-hidden="true" />
                Verifikasi Pembayaran & Bukti Transfer
              </h2>
              <Badge variant="outline" className="font-mono text-micro">
                {reg.manual_payment_proof_url ? "Manual Transfer" : "Gateway"}
              </Badge>
            </div>

            {/* Bukti Transfer & Detail Nominal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Bukti Foto */}
              <div className="space-y-2">
                <span className="block text-xs font-semibold text-foreground">
                  Foto Bukti Transfer Manual
                </span>
                {reg.manual_payment_proof_url ? (
                  <div className="relative group rounded-lg border border-border overflow-hidden bg-background">
                    <div className="aspect-4/3 relative w-full">
                      <Image
                        src={reg.manual_payment_proof_url}
                        alt={`Bukti transfer tim ${reg.team_name}`}
                        fill
                        className="object-contain p-2"
                        unoptimized
                      />
                    </div>
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setLightboxImg({
                            url: reg.manual_payment_proof_url!,
                            title: `Bukti Bayar - Tim ${reg.team_name}`,
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs"
                      >
                        <Eye className="size-3.5" />
                        <span>Perbesar Gambar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-8 text-center text-xs text-muted-foreground">
                    Tidak ada upload bukti manual (Memakai Midtrans otomatis).
                  </div>
                )}
              </div>

              {/* Status & Tombol Tindakan */}
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-secondary/40 p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Total Tagihan:
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      Rp {reg.total_amount.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Status Pembayaran:
                    </span>
                    <span className="font-mono font-semibold uppercase">
                      {reg.payment_status}
                    </span>
                  </div>
                  {reg.paid_at && (
                    <div className="flex justify-between text-success">
                      <span>Waktu Disetujui:</span>
                      <span className="font-mono">
                        {new Date(reg.paid_at).toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                  {reg.rejection_reason && (
                    <div className="space-y-1 text-destructive pt-2 border-t border-border">
                      <span className="font-semibold block">
                        Alasan Penolakan:
                      </span>
                      <p className="bg-destructive/10 p-2 rounded text-micro font-medium">
                        {reg.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Form Aksi Approve / Reject */}
                {reg.payment_status !== "paid" && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleApprovePayment}
                        disabled={isVerifying}
                        className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-md bg-success px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-success/90 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="size-4" aria-hidden="true" />
                        <span>Setujui Pembayaran</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowRejectForm(!showRejectForm)}
                        disabled={isVerifying}
                        className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="size-4" aria-hidden="true" />
                        <span>Tolak Bukti</span>
                      </button>
                    </div>

                    {showRejectForm && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3 animate-in fade-in-50">
                        <label className="block text-xs font-semibold text-destructive">
                          Alasan Penolakan Pembayaran (Wajib diisi):
                        </label>
                        <textarea
                          rows={3}
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="e.g. Nominal transfer kurang / Foto bukti tidak terbaca / Nama pengirim tidak sesuai..."
                          className="w-full rounded-md border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowRejectForm(false)}
                            className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={handleRejectPayment}
                            disabled={isVerifying || !rejectReason.trim()}
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md bg-destructive px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-destructive/90 transition-colors disabled:opacity-50"
                          >
                            Konfirmasi Tolak
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Panel Anggota Tim */}
          <section className="rounded-lg border border-border bg-card p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-display text-md font-bold text-foreground flex items-center gap-2">
                <Users className="size-5 text-primary" aria-hidden="true" />
                Anggota Tim ({reg.members?.length || 0} Orang)
              </h2>
              <span className="text-micro font-mono text-muted-foreground">
                Dokumen & Verifikasi Fisik Venue
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!reg.members || reg.members.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6 col-span-2">
                  Belum ada data anggota tim terdaftar.
                </p>
              ) : (
                reg.members.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-lg border border-border bg-secondary/20 p-4 space-y-3 relative flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-3">
                      {/* Pas Foto Member */}
                      <div className="relative size-14 shrink-0 rounded-md border border-border overflow-hidden bg-background">
                        {m.photo_url ? (
                          <Image
                            src={m.photo_url}
                            alt={`Foto ${m.full_name}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-muted-foreground">
                            <User className="size-6" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-display text-sm font-bold text-foreground truncate">
                            {m.full_name}
                          </span>
                          <Badge
                            variant={
                              m.role_in_team === "Ketua"
                                ? "default"
                                : "secondary"
                            }
                            className="text-micro font-mono"
                          >
                            {m.role_in_team}
                          </Badge>
                        </div>

                        {m.birth_date && (
                          <p className="text-micro text-muted-foreground font-mono">
                            Tgl Lahir:{" "}
                            {new Date(m.birth_date).toLocaleDateString("id-ID")}
                          </p>
                        )}

                        <div className="pt-0.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-micro font-mono",
                              m.verification_status === "verified"
                                ? "border-success/30 bg-success-soft text-success"
                                : m.verification_status === "mismatch"
                                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                                  : "text-muted-foreground",
                            )}
                          >
                            Verifikasi Venue:{" "}
                            {m.verification_status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Pratinjau Kartu Pelajar / KK */}
                    <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">
                        Identitas (KTM/KK):
                      </span>
                      {m.identity_card_url ? (
                        <button
                          type="button"
                          onClick={() =>
                            setLightboxImg({
                              url: m.identity_card_url!,
                              title: `Kartu Identitas - ${m.full_name}`,
                            })
                          }
                          className="inline-flex items-center gap-1 text-primary hover:underline font-semibold text-micro"
                        >
                          <Eye className="size-3" />
                          <span>Lihat Dokumen</span>
                        </button>
                      ) : (
                        <span className="text-micro text-muted-foreground italic">
                          Belum diunggah
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ── Lightbox Modal Gambar ── */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxImg(null)}
        >
          <div
            className="relative max-w-3xl w-full rounded-lg border border-border bg-card p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-display text-sm font-bold text-foreground">
                {lightboxImg.title}
              </h3>
              <button
                type="button"
                onClick={() => setLightboxImg(null)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="relative aspect-16/10 w-full rounded-md border border-border overflow-hidden bg-black/50">
              <Image
                src={lightboxImg.url}
                alt={lightboxImg.title}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="flex justify-end">
              <a
                href={lightboxImg.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/80"
              >
                <ExternalLink className="size-3.5" />
                <span>Buka di Tab Baru</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
