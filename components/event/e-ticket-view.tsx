"use client";

import { useState } from "react";
import type { EventRegistration } from "@/types/event-registration";
import { submitManualPaymentProofAction } from "@/lib/actions/event-registration";
import { CheckCircle2, Clock, XCircle, Share2, Upload, ExternalLink } from "lucide-react";

interface ETicketClientViewProps {
  registration: EventRegistration;
}

export function ETicketClientView({ registration }: ETicketClientViewProps) {
  const [proofUrl, setProofUrl] = useState(registration.manual_payment_proof_url || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleManualProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofUrl) return;

    setIsSubmitting(true);
    const res = await submitManualPaymentProofAction(registration.id, proofUrl);
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Lunas / Terverifikasi
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
            <Clock className="w-4 h-4" /> Menunggu Pembayaran
          </span>
        );
      case "expired":
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-semibold">
            <XCircle className="w-4 h-4" /> Cadars / Gagal / Expired
          </span>
        );
      default:
        return null;
    }
  };

  const waShareText = encodeURIComponent(
    `Halo Admin Panitia MRC, saya perwakilan tim *${registration.team_name}* (${registration.registration_code}). Mohon konfirmasi status pendaftaran kami.`
  );
  const waUrl = `https://wa.me/?text=${waShareText}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-[#3b5b84] p-6 text-white text-center space-y-2">
        <span className="text-xs uppercase tracking-widest font-semibold text-[#f0975a]">
          Official E-Ticket & Pass
        </span>
        <h1 className="text-2xl font-bold">{registration.category?.name || "Minangkabau Robot Contest"}</h1>
        <p className="text-xs opacity-90">{registration.institution}</p>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Status Badge & Registration Code */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 border rounded-xl">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Kode Pendaftaran:</span>
            <span className="text-xl font-bold font-mono text-slate-800">{registration.registration_code}</span>
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {/* Tim details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500 text-xs block">Nama Tim:</span>
            <span className="font-semibold text-slate-800">{registration.team_name}</span>
          </div>
          <div>
            <span className="text-slate-500 text-xs block">Pembimbing:</span>
            <span className="font-semibold text-slate-800">{registration.advisor_name || "-"}</span>
          </div>
          <div>
            <span className="text-slate-500 text-xs block">Email Registrasi:</span>
            <span className="font-semibold text-slate-800">{registration.team_email}</span>
          </div>
          <div>
            <span className="text-slate-500 text-xs block">WhatsApp:</span>
            <span className="font-semibold text-slate-800">{registration.team_whatsapp}</span>
          </div>
        </div>

        {/* Member QR Kokarde Section */}
        {registration.members && registration.members.length > 0 && (
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-base font-semibold text-slate-800">Kokarde & Foto Anggota</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {registration.members.map((member) => (
                <div key={member.id} className="p-4 border rounded-xl flex items-center gap-4 bg-slate-50">
                  <img
                    src={member.photo_url}
                    alt={member.full_name}
                    className="w-16 h-16 object-cover rounded-lg border border-slate-300"
                  />
                  <div className="space-y-1">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full">
                      {member.role_in_team}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">{member.full_name}</h4>
                    {/* QR Code image URL via quickchart for member_qr_token */}
                    <div className="pt-1 flex items-center gap-2">
                      <img
                        src={`https://quickchart.io/qr?text=${member.member_qr_token}&size=60`}
                        alt="QR Kokarde"
                        className="w-10 h-10 border rounded"
                      />
                      <span className="text-[10px] text-slate-500">QR Scan Lapangan</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fallback Manual Payment Proof Upload */}
        {registration.payment_status === "pending" && (
          <div className="border-t pt-6 space-y-3">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#f0975a]" /> Upload Bukti Pembayaran Manual (Fallback)
            </h3>
            <p className="text-xs text-slate-500">
              Jika pembayaran melalui Midtrans mengalami kendala, Anda dapat mengunggah link bukti transfer manual di bawah ini untuk diverifikasi oleh panitia.
            </p>

            <form onSubmit={handleManualProofSubmit} className="flex gap-2">
              <input
                type="url"
                required
                placeholder="https://drive.google.com/..."
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                className="flex-1 min-h-[44px] px-3 py-2 border rounded-lg text-sm focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#3b5b84] hover:bg-[#2f4a6d] text-white text-sm font-semibold rounded-lg"
              >
                {isSubmitting ? "Mengirim..." : "Simpan"}
              </button>
            </form>

            {message && <p className="text-xs text-emerald-600 font-medium">{message}</p>}
          </div>
        )}

        {/* Share Button & WhatsApp Reminder */}
        <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Share2 className="w-4 h-4" /> Kirim Reminder via WhatsApp (wa.me)
          </a>

          {registration.midtrans_snap_token && registration.payment_status === "pending" && (
            <button
              onClick={() => {
                if (window.snap) {
                  window.snap.pay(registration.midtrans_snap_token!, {});
                } else {
                  alert("Snap JS belum dimuat sepenuhnya.");
                }
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f0975a] hover:bg-[#9a5b30] text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Bayar Sekarang <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
