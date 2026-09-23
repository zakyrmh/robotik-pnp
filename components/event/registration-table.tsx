"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  updatePaymentStatusAction,
  verifyManualPaymentAction,
  purgeOldEventDataAction,
} from "@/lib/actions/event-admin";
import type {
  EventRegistration,
  EventCategory,
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
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  DollarSign,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RegistrationTableProps {
  initialRegistrations: EventRegistration[];
  categories?: EventCategory[];
  isSuperAdmin?: boolean;
}

const statusStyle: Record<string, string> = {
  paid: "border-success/30 bg-success-soft text-success font-semibold",
  pending: "border-warning/30 bg-warning-soft text-warning font-semibold",
  pending_verification:
    "border-warning/30 bg-warning-soft text-warning font-semibold",
  expired:
    "border-destructive/30 bg-destructive/10 text-destructive font-semibold",
  failed:
    "border-destructive/30 bg-destructive/10 text-destructive font-semibold",
  rejected:
    "border-destructive/30 bg-destructive/10 text-destructive font-semibold",
};

export function RegistrationTable({
  initialRegistrations,
  categories = [],
  isSuperAdmin,
}: RegistrationTableProps) {
  const [registrations, setRegistrations] =
    useState<EventRegistration[]>(initialRegistrations);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedReg, setSelectedReg] = useState<EventRegistration | null>(
    null,
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Manual payment verification inside modal
  const [isVerifying, setIsVerifying] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Lightbox preview for receipt
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const [isPurging, setIsPurging] = useState(false);
  const [purgeMessage, setPurgeMessage] = useState<string | null>(null);

  // Filtered registrations
  const filtered = useMemo(() => {
    return registrations.filter((reg) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        reg.team_name.toLowerCase().includes(q) ||
        reg.registration_code.toLowerCase().includes(q) ||
        reg.institution.toLowerCase().includes(q) ||
        reg.team_email.toLowerCase().includes(q) ||
        reg.team_whatsapp.includes(q);

      const matchesStatus =
        statusFilter === "all" || reg.payment_status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" ||
        reg.category_id === categoryFilter ||
        reg.category?.name === categoryFilter ||
        reg.category?.id === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [registrations, search, statusFilter, categoryFilter]);

  // Metric breakdown
  const metrics = useMemo(() => {
    const total = registrations.length;
    const paid = registrations.filter((r) => r.payment_status === "paid");
    const pendingVerification = registrations.filter(
      (r) => r.payment_status === "pending_verification",
    );
    const pending = registrations.filter((r) => r.payment_status === "pending");
    const totalRevenue = paid.reduce(
      (acc, r) => acc + (Number(r.total_amount) || 0),
      0,
    );

    return {
      total,
      paidCount: paid.length,
      pendingVerificationCount: pendingVerification.length,
      pendingCount: pending.length,
      totalRevenue,
    };
  }, [registrations]);

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

  const handleVerifyManualInModal = async (action: "approve" | "reject") => {
    if (!selectedReg) return;

    if (action === "reject" && !rejectionReason.trim()) {
      setRejectError("Alasan penolakan wajib diisi.");
      return;
    }

    setIsVerifying(true);
    setRejectError(null);
    const res = await verifyManualPaymentAction(
      selectedReg.id,
      action,
      action === "reject" ? rejectionReason : undefined,
    );
    setIsVerifying(false);

    if (res.success) {
      const updatedStatus: PaymentStatus =
        action === "approve" ? "paid" : "rejected";
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === selectedReg.id
            ? {
                ...r,
                payment_status: updatedStatus,
                paid_at:
                  action === "approve" ? new Date().toISOString() : r.paid_at,
                rejection_reason: action === "reject" ? rejectionReason : null,
              }
            : r,
        ),
      );
      setSelectedReg((prev) =>
        prev
          ? {
              ...prev,
              payment_status: updatedStatus,
              paid_at:
                action === "approve" ? new Date().toISOString() : prev.paid_at,
              rejection_reason: action === "reject" ? rejectionReason : null,
            }
          : null,
      );
      setShowRejectForm(false);
      setRejectionReason("");
    } else {
      setRejectError(res.error || "Gagal memproses verifikasi.");
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
      `Halo perwakilan tim *${reg.team_name}* (${reg.registration_code}),\n\nBerikut adalah link akses resmi pendaftaran & E-Tiket tim Anda di Minangkabau Robot Contest:\n${url}\n\nMelalui portal ini Anda dapat melihat E-Tiket, status pembayaran, atau memperbarui berkas anggota. Terimakasih!`,
    );
    return `https://wa.me/${formattedPhone}?text=${message}`;
  };

  const exportToCsv = () => {
    if (filtered.length === 0) return;

    const headers = [
      "Kode Registrasi",
      "Nama Tim",
      "Kategori",
      "Instansi",
      "Kota Asal",
      "Email Tim",
      "WhatsApp",
      "Status Pembayaran",
      "Total Biaya (Rp)",
      "Tanggal Bayar",
      "Tanggal Daftar",
    ];

    const rows = filtered.map((r) => [
      `"${r.registration_code}"`,
      `"${r.team_name.replace(/"/g, '""')}"`,
      `"${(r.category?.name || "").replace(/"/g, '""')}"`,
      `"${r.institution.replace(/"/g, '""')}"`,
      `"${(r.origin_city || "").replace(/"/g, '""')}"`,
      `"${r.team_email}"`,
      `"${r.team_whatsapp}"`,
      `"${r.payment_status}"`,
      `"${r.total_amount}"`,
      `"${r.paid_at ? new Date(r.paid_at).toLocaleString("id-ID") : ""}"`,
      `"${r.created_at ? new Date(r.created_at).toLocaleString("id-ID") : ""}"`,
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `mrc-pendaftaran-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ── Metric Filter Cards Ribbon ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter("all")}
          className={cn(
            "rounded-lg border p-3.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            statusFilter === "all"
              ? "border-primary bg-primary-soft"
              : "border-border bg-card hover:bg-secondary",
          )}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Semua Tim</span>
            <Users className="size-3.5 text-primary" aria-hidden="true" />
          </div>
          <div className="font-mono text-xl font-bold tabular-nums text-foreground">
            {metrics.total}
          </div>
          <p className="text-micro text-muted-foreground mt-0.5">
            Tampilkan semua
          </p>
        </button>

        <button
          onClick={() => setStatusFilter("paid")}
          className={cn(
            "rounded-lg border p-3.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            statusFilter === "paid"
              ? "border-success bg-success-soft"
              : "border-border bg-card hover:bg-secondary",
          )}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Pembayaran Lunas</span>
            <CheckCircle2
              className="size-3.5 text-success"
              aria-hidden="true"
            />
          </div>
          <div className="font-mono text-xl font-bold tabular-nums text-success">
            {metrics.paidCount}
          </div>
          <p className="text-micro text-muted-foreground mt-0.5 font-mono">
            {metrics.totalRevenue > 0
              ? `Total: Rp ${metrics.totalRevenue.toLocaleString("id-ID")}`
              : "Lunas terverifikasi"}
          </p>
        </button>

        <button
          onClick={() => setStatusFilter("pending_verification")}
          className={cn(
            "rounded-lg border p-3.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            statusFilter === "pending_verification"
              ? "border-warning bg-warning-soft"
              : "border-border bg-card hover:bg-secondary",
          )}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Pending Verifikasi</span>
            <Clock className="size-3.5 text-warning" aria-hidden="true" />
          </div>
          <div className="font-mono text-xl font-bold tabular-nums text-warning">
            {metrics.pendingVerificationCount}
          </div>
          <p className="text-micro text-muted-foreground mt-0.5">
            Butuh konfirmasi
          </p>
        </button>

        <button
          onClick={() => setStatusFilter("pending")}
          className={cn(
            "rounded-lg border p-3.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            statusFilter === "pending"
              ? "border-accent-strong bg-accent/20"
              : "border-border bg-card hover:bg-secondary",
          )}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Menunggu Bayar</span>
            <DollarSign
              className="size-3.5 text-accent-strong"
              aria-hidden="true"
            />
          </div>
          <div className="font-mono text-xl font-bold tabular-nums text-foreground">
            {metrics.pendingCount}
          </div>
          <p className="text-micro text-muted-foreground mt-0.5">
            Belum transfer
          </p>
        </button>
      </div>

      {/* ── Toolbar: Search + Multi-Filter + CSV Export + Retensi Data ── */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 lg:flex-row lg:items-center lg:justify-between shadow-xs">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Cari tim, kode, instansi, email, WA..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Cari pendaftaran tim"
              className="min-h-[44px] w-full rounded-md border border-input bg-background pr-3 pl-9 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
            />
          </div>

          {/* Filter Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter status pembayaran"
            className="min-h-[44px] rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm font-medium text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
          >
            <option value="all">Semua Status Bayar</option>
            <option value="paid">Lunas (Paid)</option>
            <option value="pending_verification">Pending Verifikasi</option>
            <option value="pending">Menunggu Bayar (Pending)</option>
            <option value="expired">Expired</option>
            <option value="failed">Failed</option>
            <option value="rejected">Ditolak (Rejected)</option>
          </select>

          {/* Filter Kategori */}
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter kategori divisi lomba"
              className="min-h-[44px] rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm font-medium text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
            >
              <option value="all">Semua Divisi Lomba</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Action Buttons: Export CSV & Purge */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="secondary"
            className="font-mono text-micro tabular-nums py-1.5 px-2.5"
          >
            {filtered.length} / {registrations.length} tim
          </Badge>

          <button
            onClick={exportToCsv}
            disabled={filtered.length === 0}
            title="Ekspor daftar pendaftaran ke format file CSV"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Download className="size-4 text-primary" aria-hidden="true" />
            <span>Ekspor CSV</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={handlePurgeOldData}
              disabled={isPurging}
              title="Hapus data pendaftaran lama (>3 bulan)"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isPurging ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-4" aria-hidden="true" />
              )}
              <span>Retensi (&gt;3 Bulan)</span>
            </button>
          )}
        </div>
      </div>

      {purgeMessage && (
        <p
          role="status"
          className="text-xs sm:text-sm font-medium text-muted-foreground"
        >
          {purgeMessage}
        </p>
      )}

      {/* ── Mobile: Card List (Screen < lg) ── */}
      <div className="grid grid-cols-1 gap-3.5 lg:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
            <p className="text-sm font-semibold text-foreground">
              Tidak ada pendaftaran ditemukan.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Coba ubah kata kunci pencarian atau filter status.
            </p>
          </div>
        ) : (
          filtered.map((reg) => (
            <article
              key={reg.id}
              className="space-y-3.5 rounded-lg border border-border bg-card p-4 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">
                      {reg.registration_code}
                    </span>
                    {reg.manual_payment_proof_url && (
                      <Badge
                        variant="outline"
                        className="text-micro font-medium border-warning/30 bg-warning-soft text-warning"
                      >
                        Bukti Transfer
                      </Badge>
                    )}
                  </div>
                  <h3 className="truncate font-display text-md font-semibold text-foreground">
                    {reg.team_name}
                  </h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {reg.category?.name || "-"} · {reg.institution} (
                    {reg.origin_city || "-"})
                  </p>
                </div>

                <Badge
                  variant="secondary"
                  className={cn(
                    "shrink-0 text-micro uppercase tracking-wide",
                    statusStyle[reg.payment_status] ?? "",
                  )}
                >
                  {reg.payment_status}
                </Badge>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-2.5 text-xs">
                <div>
                  <span className="text-muted-foreground block text-micro">
                    Total Biaya:
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {reg.total_amount > 0
                      ? `Rp ${Number(reg.total_amount).toLocaleString("id-ID")}`
                      : "Gratis"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block text-micro">
                    Kontak & Anggota:
                  </span>
                  <span className="text-xs text-foreground font-medium">
                    {reg.members?.length || 0} anggota
                  </span>
                </div>
              </div>

              {/* Status Select & Quick Actions Bar */}
              <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
                <select
                  value={reg.payment_status}
                  onChange={(e) =>
                    handleStatusChange(reg.id, e.target.value as PaymentStatus)
                  }
                  aria-label={`Ubah status ${reg.team_name}`}
                  className={cn(
                    "min-h-[44px] flex-1 rounded-md border bg-background px-2.5 py-2 text-xs font-semibold focus:ring-2 focus:ring-ring focus:outline-none",
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
                  <option value="rejected">rejected</option>
                </select>

                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    onClick={() => copyAccessLink(reg.access_token, reg.id)}
                    title="Salin link akses E-Tiket"
                    className="inline-flex min-h-[44px] flex-1 sm:flex-initial items-center justify-center gap-1 rounded-md border border-border bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {copiedId === reg.id ? (
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
                    <span>{copiedId === reg.id ? "Tersalin" : "Tiket"}</span>
                  </button>

                  <a
                    href={getWaShareUrl(reg)}
                    target="_blank"
                    rel="noreferrer"
                    title="Kirim link ke WA peserta"
                    className="inline-flex min-h-[44px] flex-1 sm:flex-initial items-center justify-center gap-1 rounded-md border border-success/30 bg-success-soft px-3 py-2 text-xs font-semibold text-success hover:bg-success/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <MessageSquare className="size-3.5" aria-hidden="true" />
                    <span>WA</span>
                  </a>

                  <button
                    onClick={() => setSelectedReg(reg)}
                    className="inline-flex min-h-[44px] flex-1 sm:flex-initial items-center justify-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Eye className="size-3.5" aria-hidden="true" />
                    <span>Detail</span>
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* ── Desktop: Master Data Table (Screen >= lg) ── */}
      <div className="hidden overflow-hidden rounded-lg border border-border bg-card shadow-xs lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/80 text-micro font-semibold tracking-wider text-muted-foreground uppercase font-mono">
                <th scope="col" className="p-3.5">
                  Kode & Tim
                </th>
                <th scope="col" className="p-3.5">
                  Kategori & Instansi
                </th>
                <th scope="col" className="p-3.5">
                  Kontak Email / WA
                </th>
                <th scope="col" className="p-3.5">
                  Total Biaya
                </th>
                <th scope="col" className="p-3.5">
                  Status Pembayaran
                </th>
                <th scope="col" className="p-3.5 text-right">
                  Aksi Manajemen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-muted-foreground text-sm font-medium"
                  >
                    Tidak ada pendaftaran tim yang sesuai dengan kriteria
                    filter.
                  </td>
                </tr>
              ) : (
                filtered.map((reg, i) => (
                  <tr
                    key={reg.id}
                    className={cn(
                      "transition-colors hover:bg-secondary/50",
                      i % 2 === 1 && "bg-secondary/20",
                    )}
                  >
                    {/* Kode & Tim */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">
                          {reg.registration_code}
                        </span>
                        {reg.manual_payment_proof_url && (
                          <Badge
                            variant="outline"
                            className="text-micro font-medium border-warning/30 bg-warning-soft text-warning"
                          >
                            Bukti Transfer
                          </Badge>
                        )}
                      </div>
                      <span className="block text-sm font-semibold text-foreground mt-0.5">
                        {reg.team_name}
                      </span>
                    </td>

                    {/* Kategori & Instansi */}
                    <td className="p-3.5">
                      <span className="block text-sm font-medium text-foreground">
                        {reg.category?.name || "-"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {reg.institution} ({reg.origin_city || "-"})
                      </span>
                    </td>

                    {/* Kontak Email / WA */}
                    <td className="p-3.5">
                      <span className="block text-xs text-foreground font-medium">
                        {reg.team_email}
                      </span>
                      <a
                        href={getWaShareUrl(reg)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-success hover:underline mt-0.5"
                      >
                        <MessageSquare className="size-3" aria-hidden="true" />
                        {reg.team_whatsapp}
                      </a>
                    </td>

                    {/* Total Biaya */}
                    <td className="p-3.5 font-mono text-sm font-bold tabular-nums text-foreground">
                      {reg.total_amount > 0
                        ? `Rp ${Number(reg.total_amount).toLocaleString("id-ID")}`
                        : "Gratis"}
                    </td>

                    {/* Status Pembayaran */}
                    <td className="p-3.5">
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
                          "min-h-[44px] rounded-md border bg-background px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-ring focus:outline-none cursor-pointer",
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
                        <option value="rejected">rejected</option>
                      </select>
                      {reg.manual_payment_proof_url && (
                        <button
                          onClick={() =>
                            setLightboxImage(reg.manual_payment_proof_url)
                          }
                          className="mt-1 flex items-center gap-1 text-micro font-semibold text-primary hover:underline"
                        >
                          <Eye className="size-3" aria-hidden="true" />
                          Pratinjau Bukti Transfer
                        </button>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="p-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() =>
                            copyAccessLink(reg.access_token, reg.id)
                          }
                          title="Salin link akses E-Tiket tim"
                          className="inline-flex min-h-[44px] items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {copiedId === reg.id ? (
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
                          <span>
                            {copiedId === reg.id ? "Tersalin" : "Link"}
                          </span>
                        </button>

                        <a
                          href={getWaShareUrl(reg)}
                          target="_blank"
                          rel="noreferrer"
                          title="Kirim E-Tiket ke WhatsApp perwakilan tim"
                          className="inline-flex min-h-[44px] items-center gap-1 rounded-md border border-success/30 bg-success-soft px-2.5 py-1.5 text-xs font-semibold text-success hover:bg-success/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <MessageSquare
                            className="size-3.5"
                            aria-hidden="true"
                          />
                          <span>WA</span>
                        </a>

                        <button
                          onClick={() => setSelectedReg(reg)}
                          className="inline-flex min-h-[44px] items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Eye className="size-3.5" aria-hidden="true" />
                          <span>Detail ({reg.members?.length || 0})</span>
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

      {/* ── Modal Pratinjau Lightbox Gambar Bukti Transfer ── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-label="Pratinjau Bukti Transfer"
        >
          <div className="relative max-w-xl w-full bg-card rounded-lg border border-border p-4 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-sm font-semibold text-foreground">
                Bukti Transfer Pembayaran Manual
              </h3>
              <button
                onClick={() => setLightboxImage(null)}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex items-center justify-center bg-secondary/50 rounded-md p-2 max-h-[70vh] overflow-auto">
              <img
                src={lightboxImage}
                alt="Bukti Transfer Manual"
                className="max-h-[60vh] object-contain rounded-md"
              />
            </div>
            <div className="flex justify-end pt-2">
              <a
                href={lightboxImage}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[44px] items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs font-semibold hover:bg-primary-hover"
              >
                <ExternalLink className="size-4" aria-hidden="true" /> Buka
                Ukuran Penuh
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Detail Tim Terdaftar & Verifikasi Manual ── */}
      {selectedReg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Detail tim ${selectedReg.team_name}`}
        >
          <div className="max-h-[90vh] w-full max-w-3xl space-y-5 overflow-y-auto rounded-lg border border-border bg-card p-5 sm:p-6 shadow-lg">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">
                    {selectedReg.registration_code}
                  </span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-micro uppercase tracking-wide",
                      statusStyle[selectedReg.payment_status] ?? "",
                    )}
                  >
                    {selectedReg.payment_status}
                  </Badge>
                </div>
                <h3 className="truncate font-display text-lg font-bold text-foreground">
                  {selectedReg.team_name}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Kategori:{" "}
                  <strong className="text-foreground">
                    {selectedReg.category?.name || "-"}
                  </strong>{" "}
                  · {selectedReg.institution} ({selectedReg.origin_city || "-"})
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedReg(null);
                  setShowRejectForm(false);
                  setRejectError(null);
                }}
                aria-label="Tutup detail"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            {/* Direct Quick Actions Bar */}
            <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-secondary/50 p-3.5 text-xs sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground block">
                  Akses Portal E-Tiket Peserta:
                </span>
                <p className="text-muted-foreground text-micro font-mono">
                  Token: {selectedReg.access_token}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button
                  onClick={() =>
                    copyAccessLink(
                      selectedReg.access_token,
                      `modal-${selectedReg.id}`,
                    )
                  }
                  className="inline-flex min-h-[44px] flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  <span>
                    {copiedId === `modal-${selectedReg.id}`
                      ? "Tersalin"
                      : "Salin Link Tiket"}
                  </span>
                </button>

                <a
                  href={getWaShareUrl(selectedReg)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-md border border-success/30 bg-success-soft px-3.5 py-2 font-semibold text-success hover:bg-success/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <MessageSquare className="size-3.5" aria-hidden="true" />
                  <span>Kirim E-Tiket via WA</span>
                </a>
              </div>
            </div>

            {/* Manual Payment Verification Section inside Modal */}
            {selectedReg.manual_payment_proof_url && (
              <div className="rounded-lg border border-warning/30 bg-warning-soft/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-xs font-semibold text-warning uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="size-4" aria-hidden="true" />
                    Bukti Transfer Pembayaran Manual
                  </h4>
                  <button
                    onClick={() =>
                      setLightboxImage(selectedReg.manual_payment_proof_url!)
                    }
                    className="text-micro font-semibold text-primary hover:underline"
                  >
                    Perbesar Foto
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div
                    onClick={() =>
                      setLightboxImage(selectedReg.manual_payment_proof_url!)
                    }
                    className="relative size-28 shrink-0 cursor-pointer rounded-md border border-border bg-background overflow-hidden hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={selectedReg.manual_payment_proof_url}
                      alt="Bukti Transfer"
                      className="size-full object-cover"
                    />
                  </div>

                  <div className="space-y-2 flex-1 w-full">
                    <p className="text-xs text-muted-foreground">
                      Pendaftar mengunggah bukti transfer manual untuk tagihan
                      sebesar{" "}
                      <strong className="font-mono font-bold text-foreground">
                        Rp{" "}
                        {Number(selectedReg.total_amount).toLocaleString(
                          "id-ID",
                        )}
                      </strong>
                      .
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleVerifyManualInModal("approve")}
                        disabled={isVerifying}
                        className="inline-flex min-h-[44px] items-center gap-1.5 px-4 py-2 bg-success hover:bg-success/90 text-white rounded-md text-xs font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {isVerifying ? (
                          <Loader2
                            className="size-4 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <CheckCircle2 className="size-4" aria-hidden="true" />
                        )}
                        Setujui (Ubah Status ke Lunas)
                      </button>

                      <button
                        onClick={() => setShowRejectForm(!showRejectForm)}
                        disabled={isVerifying}
                        className="inline-flex min-h-[44px] items-center gap-1.5 px-3.5 py-2 bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 rounded-md text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <XCircle className="size-4" aria-hidden="true" />
                        Tolak Pembayaran
                      </button>
                    </div>

                    {showRejectForm && (
                      <div className="pt-2 space-y-2">
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Tuliskan alasan penolakan (misal: nominal tidak sesuai / foto buram)..."
                          className="w-full px-3 py-2 border border-input bg-background rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          rows={2}
                        />
                        {rejectError && (
                          <p className="text-micro font-medium text-destructive">
                            {rejectError}
                          </p>
                        )}
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowRejectForm(false)}
                            className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary rounded-md"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVerifyManualInModal("reject")}
                            disabled={isVerifying}
                            className="px-3.5 py-1.5 bg-destructive text-white font-semibold text-xs rounded-md hover:bg-destructive/90"
                          >
                            Konfirmasi Tolak
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Team Roster Breakdown */}
            <div className="space-y-3 pt-2">
              <h4 className="font-display text-xs font-semibold tracking-wider text-muted-foreground uppercase flex items-center justify-between">
                <span>
                  Daftar Anggota Tim ({selectedReg.members?.length || 0})
                </span>
                <span className="font-mono text-micro text-muted-foreground font-normal">
                  Daftar Pas Foto & Identitas Resmi
                </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedReg.members?.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-secondary/40 p-3.5 shadow-xs"
                  >
                    <Image
                      src={m.photo_url}
                      alt={`Foto ${m.full_name}`}
                      width={56}
                      height={56}
                      className="size-14 shrink-0 rounded-md border border-border object-cover bg-background"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="secondary"
                          className="text-micro font-semibold"
                        >
                          {m.role_in_team}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-micro font-mono border",
                            m.verification_status === "verified"
                              ? "bg-success-soft text-success border-success/30"
                              : "bg-secondary text-muted-foreground border-border",
                          )}
                        >
                          {m.verification_status}
                        </Badge>
                      </div>

                      <p className="truncate text-xs sm:text-sm font-bold text-foreground">
                        {m.full_name}
                      </p>

                      {m.birth_date && (
                        <p className="text-micro font-medium text-muted-foreground">
                          Lahir: {m.birth_date}
                        </p>
                      )}

                      {m.identity_card_url && (
                        <a
                          href={m.identity_card_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-micro font-semibold text-primary hover:underline pt-0.5"
                        >
                          <ExternalLink className="size-3" aria-hidden="true" />
                          Kartu Pelajar / KTM / KK
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-border">
              <button
                onClick={() => {
                  setSelectedReg(null);
                  setShowRejectForm(false);
                  setRejectError(null);
                }}
                className="inline-flex min-h-[44px] items-center px-4 py-2 bg-secondary text-foreground text-xs font-semibold rounded-md hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
