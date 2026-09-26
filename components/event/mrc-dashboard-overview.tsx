"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getBatchPhase, PHASE_LABELS } from "@/lib/event-batch";
import type {
  EventSettings,
  EventCategory,
  EventRegistration,
  RoleEvent,
} from "@/types/event-registration";
import {
  Users,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  CalendarRange,
  CreditCard,
  Building2,
} from "lucide-react";

interface MrcDashboardOverviewProps {
  settings: EventSettings | null;
  categories: EventCategory[];
  registrations: EventRegistration[];
  roleEvent: RoleEvent | undefined;
}

export function MrcDashboardOverview({
  settings,
  categories,
  registrations,
  roleEvent,
}: MrcDashboardOverviewProps) {
  const currentPhase = getBatchPhase(settings);
  const pendingCount = registrations.filter(
    (r) => r.payment_status === "pending_verification",
  ).length;
  const paidCount = registrations.filter(
    (r) => r.payment_status === "paid",
  ).length;
  const totalIncome = registrations
    .filter((r) => r.payment_status === "paid")
    .reduce((sum, r) => sum + (r.total_amount || 0), 0);

  const recentRegistrations = registrations.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* ── Header Institusional ── */}
      <header className="rounded-lg border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-display text-micro font-semibold uppercase tracking-wider text-accent-strong">
                Sistem Pendaftaran MRC 2026
              </span>
              <span aria-hidden="true" className="text-border">
                •
              </span>
              <Badge
                variant="outline"
                className="font-mono text-micro font-semibold uppercase tracking-wide border-primary/20 bg-primary-soft text-primary"
              >
                {roleEvent ?? "super-admin"}
              </Badge>
            </div>

            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground text-balance">
              Dashboard Admin Minangkabau Robot Contest
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Ringkasan pendaftaran tim, status kuota divisi kompetisi, dan
              verifikasi pembayaran manual.
            </p>
          </div>

          {/* Banner Fase Event */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 p-3 sm:px-4 text-xs">
            <CalendarRange
              className="size-4 text-primary shrink-0"
              aria-hidden="true"
            />
            <div>
              <span className="block text-micro font-semibold uppercase text-muted-foreground">
                Fase Event Saat Ini
              </span>
              <span className="font-semibold text-foreground">
                {PHASE_LABELS[currentPhase.phase]}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Grid Kartu Metrik Utama (70-20-10 Rule) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-lg border border-border bg-card p-4 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total Tim Terdaftar</span>
            <Users className="size-4 text-primary" aria-hidden="true" />
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-foreground">
            {registrations.length}
          </div>
          <p className="text-micro text-muted-foreground">
            Dari seluruh kategori
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Pembayaran Lunas</span>
            <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-success">
            {paidCount}
          </div>
          <p className="text-micro text-muted-foreground">
            Terverifikasi (Rp {totalIncome.toLocaleString("id-ID")})
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Menunggu Verifikasi</span>
            <Clock className="size-4 text-warning" aria-hidden="true" />
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-warning">
            {pendingCount}
          </div>
          <p className="text-micro text-muted-foreground">
            {pendingCount > 0
              ? "Membutuhkan tindakan admin"
              : "Tidak ada antrean"}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Kategori Lomba</span>
            <Layers className="size-4 text-accent-strong" aria-hidden="true" />
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-foreground">
            {categories.length}
          </div>
          <p className="text-micro text-muted-foreground">
            {categories.filter((c) => c.is_active).length} kategori aktif
          </p>
        </div>
      </div>

      {/* ── Status Kuota Kategori & Pintasan Cepat ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Kuota Per Kategori (2 Kolom) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-md font-semibold tracking-tight text-foreground">
              Status Kuota & Pendaftar Per Kategori
            </h2>
            <Link
              href="/manajemen-event/kategori"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>Kelola Kategori</span>
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {categories.map((cat) => {
              const catRegs = registrations.filter(
                (r) => r.category_id === cat.id,
              );
              const catPaid = catRegs.filter(
                (r) => r.payment_status === "paid",
              ).length;
              const percent = Math.min(
                100,
                Math.round((catPaid / (cat.quota || 1)) * 100),
              );

              return (
                <div
                  key={cat.id}
                  className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-display text-sm font-semibold text-foreground block">
                        {cat.name}
                      </span>
                      <span className="font-mono text-micro text-muted-foreground">
                        /{cat.slug}
                      </span>
                    </div>
                    <Badge
                      variant={cat.is_active ? "outline" : "secondary"}
                      className="text-micro font-mono"
                    >
                      {cat.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-muted-foreground">
                        Pendaftar / Kuota
                      </span>
                      <span className="font-bold text-foreground">
                        {catPaid} / {cat.quota} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-micro text-muted-foreground pt-1 border-t border-border">
                    <span>Maks {cat.max_team_members} anggota/tim</span>
                    <span>Total {catRegs.length} tim terdaftar</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kolom Kanan: Pintasan & Pengaturan ── */}
        <div className="space-y-4">
          <h2 className="font-display text-md font-semibold tracking-tight text-foreground">
            Aksi Cepat & Metode Pembayaran
          </h2>

          <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <CreditCard
                  className="size-4 text-primary"
                  aria-hidden="true"
                />
                Mode Pembayaran Aktif
              </span>
              <Badge variant="outline" className="font-mono text-micro">
                {settings?.payment_mode === "manual_bank"
                  ? "Transfer Bank Manual"
                  : "Midtrans (Gateway)"}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              {settings?.payment_mode === "manual_bank"
                ? `Menerima transfer manual ke ${settings.bank_accounts?.length || 1} rekening bank yang telah dikonfigurasi.`
                : "Menerima pembayaran otomatis via Midtrans QRIS/Snap."}
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/manajemen-event/pendaftaran?status=pending_verification"
                className="inline-flex min-h-[44px] items-center justify-between rounded-md bg-warning-soft px-3.5 py-2 text-xs font-medium text-warning border border-warning/30 transition-colors hover:bg-warning-soft/80"
              >
                <span className="flex items-center gap-2">
                  <Clock className="size-4 shrink-0" aria-hidden="true" />
                  <span>Verifikasi Pembayaran Manual</span>
                </span>
                <Badge
                  variant="secondary"
                  className="font-mono text-micro bg-warning text-warning-foreground"
                >
                  {pendingCount}
                </Badge>
              </Link>

              <Link
                href="/manajemen-event/pembayaran"
                className="inline-flex min-h-[44px] items-center justify-between rounded-md bg-secondary/80 px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <span className="flex items-center gap-2">
                  <CreditCard
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>Atur Rekening & Gateway</span>
                </span>
                <ArrowRight
                  className="size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
              </Link>

              <Link
                href="/manajemen-event/timeline"
                className="inline-flex min-h-[44px] items-center justify-between rounded-md bg-secondary/80 px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <span className="flex items-center gap-2">
                  <CalendarRange
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>Atur Timeline & Batch</span>
                </span>
                <ArrowRight
                  className="size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5 Pendaftaran Terbaru ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-md font-semibold tracking-tight text-foreground">
            Pendaftaran Terbaru
          </h2>
          <Link
            href="/manajemen-event/pendaftaran"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <span>Lihat Semua Pendaftar</span>
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted border-b border-border text-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Tim / Instansi</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Status Bayar</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentRegistrations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Belum ada tim yang mendaftar.
                    </td>
                  </tr>
                ) : (
                  recentRegistrations.map((reg) => (
                    <tr
                      key={reg.id}
                      className="hover:bg-secondary/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-foreground">
                        {reg.registration_code}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-foreground block">
                          {reg.team_name}
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Building2
                            className="size-3 shrink-0"
                            aria-hidden="true"
                          />
                          {reg.institution}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className="font-mono text-micro"
                        >
                          {reg.category?.name || "Lomba"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            reg.payment_status === "paid"
                              ? "outline"
                              : reg.payment_status === "pending_verification"
                                ? "secondary"
                                : "destructive"
                          }
                          className={
                            reg.payment_status === "paid"
                              ? "border-success/30 bg-success-soft text-success font-mono"
                              : reg.payment_status === "pending_verification"
                                ? "border-warning/30 bg-warning-soft text-warning font-mono"
                                : "font-mono"
                          }
                        >
                          {reg.payment_status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/manajemen-event/pendaftaran/${reg.id}`}
                          className="inline-flex min-h-[36px] items-center justify-center gap-1 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
