"use client";

import { useState } from "react";
import Image from "next/image";
import {
  updatePaymentStatusAction,
  purgeOldEventDataAction,
} from "@/lib/actions/event-admin";
import type {
  EventRegistration,
  PaymentStatus,
} from "@/types/event-registration";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Trash2,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  MessageSquare,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RegistrationTableProps {
  initialRegistrations: EventRegistration[];
  isSuperAdmin?: boolean;
}

const statusStyle: Record<string, string> = {
  paid: "border-success/30 bg-success-soft text-success",
  pending: "border-warning/30 bg-warning-soft text-warning",
  pending_verification: "border-warning/30 bg-warning-soft text-warning",
  expired: "border-destructive/30 bg-destructive/10 text-destructive",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
};

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
      {/* Toolbar: search + filter + retensi */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:w-72">
            <Search
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Cari tim, kode, instansi…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Cari pendaftaran"
              className="min-h-[44px] w-full rounded-md border border-border bg-background pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter status pembayaran"
            className="min-h-[44px] rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
          >
            <option value="all">Semua Status Bayar</option>
            <option value="paid">Lunas (Paid)</option>
            <option value="pending">Menunggu (Pending)</option>
            <option value="pending_verification">Menunggu Verifikasi</option>
            <option value="expired">Expired</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono tabular-nums">
            {filtered.length} / {registrations.length} tim
          </Badge>
          {isSuperAdmin && (
            <button
              onClick={handlePurgeOldData}
              disabled={isPurging}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-60"
            >
              {isPurging ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-4" aria-hidden="true" />
              )}
              Retensi Data (&gt;3 Bulan)
            </button>
          )}
        </div>
      </div>

      {purgeMessage && (
        <p role="status" className="text-sm font-medium text-muted-foreground">
          {purgeMessage}
        </p>
      )}

      {/* ── Mobile: kartu / Desktop: tabel ── */}
      {/* Kartu mobile */}
      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
            <p className="text-sm font-semibold text-foreground">
              Tidak ada pendaftaran ditemukan.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Coba ubah kata kunci atau filter status.
            </p>
          </div>
        ) : (
          filtered.map((reg) => (
            <article
              key={reg.id}
              className="space-y-3 rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="block font-mono text-xs font-semibold text-primary">
                    {reg.registration_code}
                  </span>
                  <h3 className="truncate font-display text-md font-semibold text-foreground">
                    {reg.team_name}
                  </h3>
                  <p className="truncate text-sm text-muted-foreground">
                    {reg.category?.name || "-"} · {reg.institution}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "shrink-0",
                    statusStyle[reg.payment_status] ?? "",
                  )}
                >
                  {reg.payment_status}
                </Badge>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="font-mono font-semibold text-foreground">
                  {reg.total_amount > 0
                    ? `Rp ${Number(reg.total_amount).toLocaleString("id-ID")}`
                    : "Gratis"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {reg.members?.length || 0} anggota
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={reg.payment_status}
                  onChange={(e) =>
                    handleStatusChange(reg.id, e.target.value as PaymentStatus)
                  }
                  aria-label={`Ubah status ${reg.team_name}`}
                  className={cn(
                    "min-h-[44px] flex-1 rounded-md border bg-background px-2 py-2 text-xs font-semibold focus:ring-2 focus:ring-ring focus:outline-none",
                    statusStyle[reg.payment_status] ?? "border-border",
                  )}
                >
                  <option value="pending">pending</option>
                  <option value="pending_verification">
                    pending_verification
                  </option>
                  <option value="paid">paid</option>
                  <option value="expired">expired</option>
                  <option value="failed">failed</option>
                </select>
                <button
                  onClick={() => setSelectedReg(reg)}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
                >
                  Detail
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Tabel desktop */}
      <div className="hidden overflow-hidden rounded-lg border border-border bg-card lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary text-xs font-semibold tracking-wider text-foreground uppercase">
                <th scope="col" className="p-3">
                  Kode & Tim
                </th>
                <th scope="col" className="p-3">
                  Kategori & Instansi
                </th>
                <th scope="col" className="p-3">
                  Kontak Email / WA
                </th>
                <th scope="col" className="p-3">
                  Total Biaya
                </th>
                <th scope="col" className="p-3">
                  Status Pembayaran
                </th>
                <th scope="col" className="p-3 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-muted-foreground"
                  >
                    Tidak ada pendaftaran ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((reg, i) => (
                  <tr
                    key={reg.id}
                    className={cn(
                      "transition-colors hover:bg-secondary/60",
                      i % 2 === 1 && "bg-secondary/30",
                    )}
                  >
                    <td className="p-3">
                      <span className="block font-mono text-xs font-semibold text-primary">
                        {reg.registration_code}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {reg.team_name}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="block text-sm font-medium text-foreground">
                        {reg.category?.name || "-"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {reg.institution} ({reg.origin_city || "-"})
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="block text-sm text-foreground">
                        {reg.team_email}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {reg.team_whatsapp}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-sm font-semibold text-foreground">
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
                        aria-label={`Status pembayaran ${reg.team_name}`}
                        className={cn(
                          "min-h-[44px] rounded-md border bg-background px-2 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-ring focus:outline-none",
                          statusStyle[reg.payment_status] ?? "border-border",
                        )}
                      >
                        <option value="pending">pending</option>
                        <option value="pending_verification">
                          pending_verification
                        </option>
                        <option value="paid">paid</option>
                        <option value="expired">expired</option>
                        <option value="failed">failed</option>
                      </select>
                      {reg.manual_payment_proof_url && (
                        <a
                          href={reg.manual_payment_proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Bukti Manual{" "}
                          <ExternalLink className="size-3" aria-hidden="true" />
                        </a>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() =>
                            copyAccessLink(reg.access_token, reg.id)
                          }
                          title="Salin link akses tiket / pembayaran"
                          className="inline-flex min-h-[44px] items-center gap-1 rounded-md bg-secondary px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/70"
                        >
                          {copiedId === reg.id ? (
                            <Check
                              className="size-3 text-success"
                              aria-hidden="true"
                            />
                          ) : (
                            <Copy className="size-3" aria-hidden="true" />
                          )}
                          {copiedId === reg.id ? "Tersalin" : "Link"}
                        </button>

                        <a
                          href={getWaShareUrl(reg)}
                          target="_blank"
                          rel="noreferrer"
                          title="Kirim link akses ke WA peserta"
                          className="inline-flex min-h-[44px] items-center gap-1 rounded-md border border-success/30 bg-success-soft px-2.5 py-1.5 text-xs font-medium text-success hover:bg-success/20"
                        >
                          <MessageSquare
                            className="size-3"
                            aria-hidden="true"
                          />{" "}
                          WA
                        </a>

                        <button
                          onClick={() => setSelectedReg(reg)}
                          className="inline-flex min-h-[44px] items-center rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
                        >
                          Detail ({reg.members?.length || 0})
                        </button>
                      </div>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Detail tim ${selectedReg.team_name}`}
        >
          <div className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
            <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
              <div className="min-w-0">
                <span className="font-mono text-xs font-semibold text-primary">
                  {selectedReg.registration_code}
                </span>
                <h3 className="truncate font-display text-md font-semibold text-foreground">
                  {selectedReg.team_name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedReg.institution} ({selectedReg.origin_city || "-"})
                </p>
              </div>
              <button
                onClick={() => setSelectedReg(null)}
                aria-label="Tutup detail"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-border bg-secondary p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="font-medium text-foreground">
                Akses Portal Peserta:
              </span>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={() =>
                    copyAccessLink(
                      selectedReg.access_token,
                      `modal-${selectedReg.id}`,
                    )
                  }
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary"
                >
                  {copiedId === `modal-${selectedReg.id}` ? (
                    <Check
                      className="size-3.5 text-success"
                      aria-hidden="true"
                    />
                  ) : (
                    <Copy
                      className="size-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                  {copiedId === `modal-${selectedReg.id}`
                    ? "Link Akses Tersalin"
                    : "Salin Link Akses"}
                </button>
                <a
                  href={getWaShareUrl(selectedReg)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-md bg-success px-3 py-2 text-xs font-medium text-white hover:opacity-90"
                >
                  <MessageSquare className="size-3.5" aria-hidden="true" />{" "}
                  Kirim Link via WA
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Anggota Tim
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {selectedReg.members?.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-secondary/60 p-3"
                  >
                    <Image
                      src={m.photo_url}
                      alt={`Foto ${m.full_name}`}
                      width={48}
                      height={48}
                      className="size-12 shrink-0 rounded-md border border-border object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <Badge variant="secondary" className="text-micro">
                        {m.role_in_team}
                      </Badge>
                      <p className="mt-1 truncate text-sm font-semibold text-foreground">
                        {m.full_name}
                      </p>
                      {m.birth_date && (
                        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                          Tgl Lahir: {m.birth_date}
                        </p>
                      )}
                      <p className="font-mono text-xs text-muted-foreground">
                        Status: {m.verification_status}
                      </p>
                      {m.identity_card_url && (
                        <a
                          href={m.identity_card_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Lihat Kartu Pelajar / KK{" "}
                          <ExternalLink
                            className="size-2.5"
                            aria-hidden="true"
                          />
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
