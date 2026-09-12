"use client";

import { useState } from "react";
import Image from "next/image";
import { verifyManualPaymentAction } from "@/lib/actions/event-admin";
import type { EventRegistration } from "@/types/event-registration";
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

  // Modal Reject State
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
    <div className="space-y-6">
      {/* Header Stat & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Menunggu Verifikasi Manual
            </h2>
            <p className="text-xs text-slate-500">
              Terdapat{" "}
              <strong className="text-amber-700 font-bold">
                {pendingCount}
              </strong>{" "}
              bukti pembayaran yang perlu diverifikasi admin.
            </p>
          </div>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tim, kode, email..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#3b5b84]"
          />
        </div>
      </div>

      {/* List Verifikasi */}
      {filteredRegistrations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">
            Tidak ada bukti pembayaran ditemukan
          </h3>
          <p className="text-xs text-slate-500">
            {searchQuery
              ? "Tidak ada pendaftaran yang sesuai dengan kata kunci pencarian."
              : "Semua pendaftaran telah diverifikasi atau belum ada yang mengunggah bukti pembayaran."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRegistrations.map((reg) => {
            const isPending = reg.payment_status === "pending_verification";
            const isApproved = reg.payment_status === "paid";
            const isRejected = reg.payment_status === "rejected";

            return (
              <div
                key={reg.id}
                className={cn(
                  "bg-white border rounded-xl shadow-sm p-5 space-y-4 relative flex flex-col justify-between transition-all",
                  isPending && "border-amber-300 ring-2 ring-amber-500/10",
                  isApproved && "border-emerald-200 bg-emerald-50/10",
                  isRejected && "border-rose-200 bg-rose-50/10",
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 font-mono block">
                        {reg.registration_code}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base leading-snug">
                        {reg.team_name}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        {reg.institution}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 border uppercase tracking-wider",
                        isPending &&
                          "bg-amber-50 text-amber-700 border-amber-200",
                        isApproved &&
                          "bg-emerald-50 text-emerald-700 border-emerald-200",
                        isRejected &&
                          "bg-rose-50 text-rose-700 border-rose-200",
                        !isPending &&
                          !isApproved &&
                          !isRejected &&
                          "bg-slate-100 text-slate-600 border-slate-200",
                      )}
                    >
                      {isPending && "Menunggu Verifikasi"}
                      {isApproved && "Lunas / Disetujui"}
                      {isRejected && "Ditolak"}
                      {!isPending &&
                        !isApproved &&
                        !isRejected &&
                        reg.payment_status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kategori:</span>
                      <span className="font-semibold text-slate-800">
                        {reg.category?.name || "Kategori Lomba"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nominal:</span>
                      <span className="font-mono font-bold text-[#3b5b84]">
                        Rp {Number(reg.total_amount).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">WhatsApp:</span>
                      <a
                        href={`https://wa.me/${reg.team_whatsapp.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        {reg.team_whatsapp} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Preview Gambar Bukti Bayar */}
                  <div className="pt-2">
                    <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Bukti Transfer Bank:
                    </span>
                    {reg.manual_payment_proof_url ? (
                      <div className="relative group border rounded-lg overflow-hidden bg-slate-100 aspect-video flex items-center justify-center">
                        <Image
                          src={reg.manual_payment_proof_url}
                          alt="Bukti pembayaran"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedProofUrl(reg.manual_payment_proof_url)
                          }
                          className="absolute inset-0 bg-slate-900/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs font-semibold"
                        >
                          <Eye className="w-4 h-4" /> Lihat Fullscreen
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border text-center">
                        Belum ada gambar bukti transfer diunggah.
                      </p>
                    )}
                  </div>

                  {isRejected && reg.rejection_reason && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
                      <span className="font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Alasan
                        Penolakan:
                      </span>
                      <p className="text-[11px] text-rose-700">
                        {reg.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions Button */}
                <div className="pt-4 border-t flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting || !reg.manual_payment_proof_url}
                    onClick={() => handleApprove(reg)}
                    className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Disetujui
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting || !reg.manual_payment_proof_url}
                    onClick={() => handleOpenRejectModal(reg)}
                    className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Ditolak
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Proof Image Modal */}
      {selectedProofUrl && (
        <div
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedProofUrl(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-black rounded-2xl overflow-hidden flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedProofUrl(null)}
              className="absolute top-4 right-4 bg-slate-800/80 hover:bg-slate-800 text-white p-2 rounded-full z-10 transition-colors"
            >
              ✕
            </button>
            <div className="relative w-full h-[80vh]">
              <Image
                src={selectedProofUrl}
                alt="Bukti Transfer Fullscreen"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Reject Reason */}
      {rejectModalReg && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Tolak Bukti Pembayaran
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tim: <strong>{rejectModalReg.team_name}</strong> (
                {rejectModalReg.registration_code})
              </p>
            </div>

            {errorMsg && (
              <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">
                {errorMsg}
              </p>
            )}

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Penolakan *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Nominal transfer tidak sesuai / Bukti pembayaran buram / Rekening tujuan salah."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#3b5b84]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Alasan ini akan dikirimkan ke email peserta agar peserta dapat
                  mengunggah ulang bukti transfer yang benar.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setRejectModalReg(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg min-h-[40px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 min-h-[40px]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Kirim Penolakan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
