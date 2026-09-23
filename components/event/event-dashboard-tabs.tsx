"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EventSettingsForm } from "@/components/event/event-settings-form";
import { CategoryManager } from "@/components/event/category-manager";
import { RegistrationTable } from "@/components/event/registration-table";
import type {
  EventSettings,
  EventCategory,
  EventRegistration,
  RoleEvent,
} from "@/types/event-registration";
import {
  Settings,
  Trophy,
  ClipboardList,
  QrCode,
  Users,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";

interface EventDashboardTabsProps {
  settings: EventSettings | null;
  categories: EventCategory[];
  registrations: EventRegistration[];
  isSuperAdmin: boolean;
  roleEvent: RoleEvent | undefined;
}

export function EventDashboardTabs({
  settings,
  categories,
  registrations,
  isSuperAdmin,
  roleEvent,
}: EventDashboardTabsProps) {
  const canManageSettings = isSuperAdmin || roleEvent === "panitia-pendaftaran";
  const canVerify =
    isSuperAdmin ||
    roleEvent === "panitia-verifikasi" ||
    roleEvent === "panitia-pendaftaran";

  const pendingVerificationCount = useMemo(
    () =>
      registrations.filter((r) => r.payment_status === "pending_verification")
        .length,
    [registrations],
  );

  const paidCount = useMemo(
    () => registrations.filter((r) => r.payment_status === "paid").length,
    [registrations],
  );

  const defaultTab = canManageSettings ? "settings" : "registrations";

  return (
    <div className="space-y-6">
      {/* ── Header: Clean Institutional Engineering ── */}
      <header className="rounded-lg border border-border bg-card p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-display text-micro font-semibold uppercase tracking-wider text-accent-strong">
                Manajemen Event Lomba
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
              Dashboard Panitia Minangkabau Robot Contest
            </h1>
            <p className="text-sm text-muted-foreground">
              Pusat kendali operasional, verifikasi administrasi tim, dan
              manajemen kompetisi robotika nasional.
            </p>
          </div>

          {/* Tombol Aksi Cepat (Min 44px Touch Target) */}
          <div
            className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center"
            role="group"
            aria-label="Aksi cepat panitia"
          >
            {canVerify && (
              <Link
                href="/manajemen-event/verifikasi"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-xs transition-colors duration-150 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <QrCode className="size-4 shrink-0" aria-hidden="true" />
                <span>Scan QR Kokarde</span>
              </Link>
            )}
          </div>
        </div>

        {/* Separator khusus dari globals.css */}
        <div className="divider" />

        {/* ── Metric Cards Grid (70-20-10 Rule) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-md border border-border bg-secondary/50 p-3.5 sm:p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Tim</span>
              <Users className="size-4 text-primary" aria-hidden="true" />
            </div>
            <div className="font-mono text-2xl font-bold tabular-nums text-foreground">
              {registrations.length}
            </div>
            <p className="text-micro text-muted-foreground">Tim terdaftar</p>
          </div>

          <div className="rounded-md border border-border bg-secondary/50 p-3.5 sm:p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Lunas</span>
              <CheckCircle2
                className="size-4 text-success"
                aria-hidden="true"
              />
            </div>
            <div className="font-mono text-2xl font-bold tabular-nums text-success">
              {paidCount}
            </div>
            <p className="text-micro text-muted-foreground">
              Pembayaran terverifikasi
            </p>
          </div>

          <div className="rounded-md border border-border bg-secondary/50 p-3.5 sm:p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Pending</span>
              <Clock className="size-4 text-warning" aria-hidden="true" />
            </div>
            <div className="font-mono text-2xl font-bold tabular-nums text-warning">
              {pendingVerificationCount}
            </div>
            <p className="text-micro text-muted-foreground">
              Menunggu konfirmasi
            </p>
          </div>

          <div className="rounded-md border border-border bg-secondary/50 p-3.5 sm:p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Kategori</span>
              <Layers
                className="size-4 text-accent-strong"
                aria-hidden="true"
              />
            </div>
            <div className="font-mono text-2xl font-bold tabular-nums text-foreground">
              {categories.length}
            </div>
            <p className="text-micro text-muted-foreground">
              Divisi kompetisi aktif
            </p>
          </div>
        </div>
      </header>

      {/* ── Tab Navigation ── */}
      <Tabs defaultValue={defaultTab} className="w-full space-y-6">
        <div className="overflow-x-auto">
          <TabsList
            variant="line"
            aria-label="Navigasi manajemen event"
            className="w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0 sm:w-auto"
          >
            {canManageSettings && (
              <TabsTrigger
                value="settings"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-none px-3.5 py-2.5 text-sm font-medium focus-visible:outline-none"
              >
                <Settings className="size-4 shrink-0" aria-hidden="true" />
                <span className="hidden md:inline">Pengaturan & Timeline</span>
                <span className="md:hidden">Pengaturan</span>
              </TabsTrigger>
            )}

            {canManageSettings && (
              <TabsTrigger
                value="categories"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-none px-3.5 py-2.5 text-sm font-medium focus-visible:outline-none"
              >
                <Trophy className="size-4 shrink-0" aria-hidden="true" />
                <span className="hidden md:inline">Kategori Lomba</span>
                <span className="md:hidden">Kategori</span>
                <Badge
                  variant="secondary"
                  className="rounded-full px-1.5 font-mono text-micro tabular-nums bg-secondary text-secondary-foreground"
                  aria-label={`${categories.length} kategori`}
                >
                  {categories.length}
                </Badge>
              </TabsTrigger>
            )}

            <TabsTrigger
              value="registrations"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-none px-3.5 py-2.5 text-sm font-medium focus-visible:outline-none"
            >
              <ClipboardList className="size-4 shrink-0" aria-hidden="true" />
              <span className="hidden md:inline">Pendaftaran & Transaksi</span>
              <span className="md:hidden">Pendaftaran</span>
              <Badge
                variant="secondary"
                className="rounded-full px-1.5 font-mono text-micro tabular-nums bg-secondary text-secondary-foreground"
                aria-label={`${registrations.length} pendaftar`}
              >
                {registrations.length}
              </Badge>
              {pendingVerificationCount > 0 && (
                <Badge
                  variant="secondary"
                  className="rounded-full border-warning/30 bg-warning-soft px-1.5 font-mono text-micro tabular-nums text-warning"
                  aria-label={`${pendingVerificationCount} menunggu verifikasi`}
                >
                  {pendingVerificationCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Tab 1: Pengaturan & Timeline ── */}
        {canManageSettings && (
          <TabsContent value="settings" className="mt-0 space-y-6">
            <EventSettingsForm initialSettings={settings} />
          </TabsContent>
        )}

        {/* ── Tab 2: Kategori Lomba ── */}
        {canManageSettings && (
          <TabsContent value="categories" className="mt-0 space-y-6">
            <CategoryManager initialCategories={categories} />
          </TabsContent>
        )}

        {/* ── Tab 3: Pendaftaran & Transaksi (Tabel Tunggal Master) ── */}
        <TabsContent value="registrations" className="mt-0 space-y-6">
          <section aria-labelledby="pendaftar-heading" className="space-y-4">
            <h2
              id="pendaftar-heading"
              className="sr-only font-display text-md font-semibold tracking-tight text-foreground"
            >
              Daftar Pendaftaran & Transaksi Tim
            </h2>
            <RegistrationTable
              initialRegistrations={registrations}
              categories={categories}
              isSuperAdmin={isSuperAdmin}
            />
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
