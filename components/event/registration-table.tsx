"use client";

import { useState } from "react";
import {
  updatePaymentStatusAction,
  purgeOldEventDataAction,
} from "@/lib/actions/event-admin";
import type {
  EventRegistration,
  PaymentStatus,
} from "@/types/event-registration";
import {
  Search,
  Trash2,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  MessageSquare,
} from "lucide-react";

interface RegistrationTableProps {
  initialRegistrations: EventRegistration[];
  isSuperAdmin?: boolean;
}

export function RegistrationTable({
  initialRegistrations,
  isSuperAdmin,
}: RegistrationTableProps) {
  const [registrations, setRegistrations] =
    useState<EventRegistration[]>(initialRegistrations);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReg, setSelectedReg] = useState<EventRegistration | null>(
    null,
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isPurging, setIsPurging] = useState(false);
  const [purgeMessage, setPurgeMessage] = useState<string | null>(null);

  const filtered = registrations.filter((reg) => {
    const matchesSearch =
      reg.team_name.toLowerCase().includes(search.toLowerCase()) ||
      reg.registration_code.toLowerCase().includes(search.toLowerCase()) ||
      reg.institution.toLowerCase().includes(search.toLowerCase()) ||
      reg.team_email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || reg.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (
    regId: string,
    newStatus: PaymentStatus,
  ) => {
    const res = await updatePaymentStatusAction(regId, newStatus);
    if (res.success) {
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === regId ? { ...r, payment_status: newStatus } : r,
        ),
      );
    } else {
      alert(res.error || "Gagal mengubah status pembayaran");
    }
  };

  const handlePurgeOldData = async () => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus seluruh data pendaftaran & foto peserta yang sudah berusia lebih dari 3 bulan? Action ini tidak dapat dibatalkan.",
      )
    ) {
      return;
    }

    setIsPurging(true);
    setPurgeMessage(null);
    const res = await purgeOldEventDataAction();
    setIsPurging(false);

    if (res.success) {
      setPurgeMessage(
        res.message ||
          `Berhasil menghapus ${res.data.deletedCount} data pendaftaran lama.`,
      );
      window.location.reload();
    } else {
      setPurgeMessage(res.error || "Gagal menghapus data pendaftaran lama.");
    }
  };

  const copyAccessLink = (accessToken: string, regId: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/mrc/tiket/${accessToken}`;
    navigator.clipboard.writeText(url);
    setCopiedId(regId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getWaShareUrl = (reg: EventRegistration) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/mrc/tiket/${reg.access_token}`;
    const cleanPhone = reg.team_whatsapp.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("0")
      ? `62${cleanPhone.slice(1)}`
      : cleanPhone;

    const message = encodeURIComponent(
      `Halo perwakilan tim *${reg.team_name}* (${reg.registration_code}),\n\nBerikut adalah link akses pendaftaran & E-Tiket tim Anda di Minangkabau Robot Contest:\n${url}\n\nMelalui link tersebut, Anda dapat mengecek status pembayaran, melakukan pembayaran via Midtrans, atau melihat QR Kokarde anggota.`,
    );
    return `https://wa.me/${formattedPhone}?text=${message}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tim, kode, instansi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#3b5b84]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="all">Semua Status Bayar</option>
            <option value="paid">Lunas (Paid)</option>
            <option value="pending">Menunggu (Pending)</option>
            <option value="expired">Expired</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {isSuperAdmin && (
          <button
            onClick={handlePurgeOldData}
            disabled={isPurging}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors"
          >
            {isPurging ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}{" "}
            Retensi Data (&gt;3 Bulan)
          </button>
        )}
      </div>

      {purgeMessage && (
        <p className="text-xs text-slate-600 font-medium">{purgeMessage}</p>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b text-slate-900 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3">Kode & Tim</th>
                <th className="p-3">Kategori & Instansi</th>
                <th className="p-3">Kontak Email / WA</th>
                <th className="p-3">Total Biaya</th>
                <th className="p-3">Status Pembayaran</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    Tidak ada pendaftaran ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <span className="font-mono text-xs font-bold text-[#3b5b84] block">
                        {reg.registration_code}
                      </span>
                      <span className="font-semibold text-slate-900 text-sm">
                        {reg.team_name}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-slate-800 block">
                        {reg.category?.name || "-"}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {reg.institution} ({reg.origin_city || "-"})
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="block text-slate-800">
                        {reg.team_email}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {reg.team_whatsapp}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-900">
                      {reg.total_amount > 0
                        ? `Rp ${Number(reg.total_amount).toLocaleString("id-ID")}`
                        : "Gratis"}
                    </td>
                    <td className="p-3">
                      <select
                        value={reg.payment_status}
                        onChange={(e) =>
                          handleStatusChange(
                            reg.id,
                            e.target.value as PaymentStatus,
                          )
                        }
                        className={`px-2 py-1 rounded text-xs font-bold border focus:outline-none ${
                          reg.payment_status === "paid"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : reg.payment_status === "pending"
                              ? "bg-amber-50 text-amber-700 border-amber-300"
                              : "bg-rose-50 text-rose-700 border-rose-300"
                        }`}
                      >
                        <option value="pending">pending</option>
                        <option value="paid">paid</option>
                        <option value="expired">expired</option>
                        <option value="failed">failed</option>
                      </select>
                      {reg.manual_payment_proof_url && (
                        <a
                          href={reg.manual_payment_proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline mt-1 block"
                        >
                          Bukti Manual <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-1 space-y-1">
                      <button
                        onClick={() => copyAccessLink(reg.access_token, reg.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium"
                        title="Salin Link Akses Tiket / Pembayaran"
                      >
                        {copiedId === reg.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        {copiedId === reg.id ? "Tersalin" : "Link"}
                      </button>

                      <a
                        href={getWaShareUrl(reg)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[11px] font-medium"
                        title="Kirim Link Akses ke WA Peserta"
                      >
                        <MessageSquare className="w-3 h-3" /> WA
                      </a>

                      <button
                        onClick={() => setSelectedReg(reg)}
                        className="px-2.5 py-1 bg-[#3b5b84] hover:bg-[#2f4a6d] text-white rounded text-[11px] font-medium"
                      >
                        Detail ({reg.members?.length || 0})
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Tim */}
      {selectedReg && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-[#3b5b84]">
                  {selectedReg.registration_code}
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedReg.team_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedReg.institution} ({selectedReg.origin_city || "-"})
                </p>
              </div>
              <button
                onClick={() => setSelectedReg(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Admin Sharing Actions in Modal */}
            <div className="p-3 bg-slate-50 border rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-700">
                Akses Portal Peserta:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    copyAccessLink(
                      selectedReg.access_token,
                      `modal-${selectedReg.id}`,
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded font-medium"
                >
                  {copiedId === `modal-${selectedReg.id}` ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  {copiedId === `modal-${selectedReg.id}`
                    ? "Link Akses Tersalin"
                    : "Salin Link Akses"}
                </button>
                <a
                  href={getWaShareUrl(selectedReg)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Kirim Link via WA
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Anggota Tim
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedReg.members?.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 border rounded-lg bg-slate-50 flex items-start gap-3"
                  >
                    <img
                      src={m.photo_url}
                      alt={m.full_name}
                      className="w-12 h-12 object-cover rounded-md border flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full">
                        {m.role_in_team}
                      </span>
                      <p className="font-bold text-xs text-slate-900 mt-1 truncate">
                        {m.full_name}
                      </p>
                      {m.birth_date && (
                        <p className="text-[10px] text-slate-600 font-medium mt-0.5">
                          Tgl Lahir: {m.birth_date}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-500 font-mono">
                        Status: {m.verification_status}
                      </p>
                      {m.identity_card_url && (
                        <a
                          href={m.identity_card_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline mt-1 font-medium block"
                        >
                          Lihat Kartu Pelajar / KK{" "}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
