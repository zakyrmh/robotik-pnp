"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EventSettingsForm } from "@/components/event/event-settings-form";
import { CategoryManager } from "@/components/event/category-manager";
import { RegistrationTable } from "@/components/event/registration-table";
import { ManualPaymentVerificationList } from "@/components/event/manual-payment-verification-list";
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
  CreditCard,
  QrCode,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EventDashboardTabsProps {
  settings: EventSettings | null;
  categories: EventCategory[];
  registrations: EventRegistration[];
  isSuperAdmin: boolean;
  roleEvent: RoleEvent | undefined;
}

type RegistrationSubView = "verification" | "all";

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

  const [regSubView, setRegSubView] =
    useState<RegistrationSubView>("verification");

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
      {/* ── Header: judul + indikator aksi ber-badge counter ── */}
      <header className="border-b border-border pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-1.5">
            <span className="block font-display text-micro font-semibold uppercase tracking-wider text-accent-strong">
              Manajemen Event Lomba
            </span>
            <h1 className="font-display text-xl font-semibold tracking-tight text-balance sm:text-2xl">
              Dashboard Panitia Minangkabau Robot Contest
            </h1>
            <p className="text-sm text-muted-foreground">
              Role Anda:{" "}
              <strong className="font-mono text-xs font-semibold text-foreground">
                {roleEvent ?? "super-admin"}
              </strong>
              <span aria-hidden="true" className="mx-2 text-border">
                |
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" aria-hidden="true" />
                {registrations.length} tim terdaftar
                <span aria-hidden="true">·</span>
                {paidCount} lunas
              </span>
            </p>
          </div>

          {/* Tombol indikator aktif dengan badge counter */}
          <div
            className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
            role="group"
            aria-label="Aksi cepat panitia"
          >
            {canManageSettings && (
              <Link
                href="/manajemen-event/verifikasi-pembayaran"
                aria-label={`Verifikasi pembayaran, ${pendingVerificationCount} pending`}
                className={cn(
                  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors duration-150",
                  pendingVerificationCount > 0
                    ? "border-warning/30 bg-warning-soft text-warning hover:bg-warning/20"
                    : "border-border bg-card text-foreground hover:border-primary hover:text-primary",
                )}
              >
                <CreditCard className="size-4 shrink-0" aria-hidden="true" />
                <span>Verifikasi Pembayaran</span>
                <Badge
                  variant="secondary"
                  className="rounded-full border-warning/20 bg-warning-soft px-2 font-mono text-micro tabular-nums text-warning"
                >
                  {pendingVerificationCount} Pending
                </Badge>
              </Link>
            )}

            {canVerify && (
              <Link
                href="/manajemen-event/verifikasi"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary-hover"
              >
                <QrCode className="size-4 shrink-0" aria-hidden="true" />
                Scan QR Kokarde
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Tab Navigation: 3 tab terpisah ── */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <div className="overflow-x-auto">
          <TabsList
            variant="line"
            aria-label="Navigasi manajemen event"
            className="w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0 sm:w-auto"
          >
            {canManageSettings && (
              <TabsTrigger
                value="settings"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-none px-3 py-2.5 text-sm font-medium sm:px-4"
              >
                <Settings className="size-4 shrink-0" aria-hidden="true" />
                <span className="hidden md:inline">Pengaturan & Timeline</span>
                <span className="md:hidden">Pengaturan</span>
              </TabsTrigger>
            )}

            {canManageSettings && (
              <TabsTrigger
                value="categories"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-none px-3 py-2.5 text-sm font-medium sm:px-4"
              >
                <Trophy className="size-4 shrink-0" aria-hidden="true" />
                <span className="hidden md:inline">Kategori Lomba</span>
                <span className="md:hidden">Kategori</span>
                <Badge
                  variant="secondary"
                  className="rounded-full px-1.5 font-mono text-micro tabular-nums"
                  aria-label={`${categories.length} kategori`}
                >
                  {categories.length}
                </Badge>
              </TabsTrigger>
            )}

            <TabsTrigger
              value="registrations"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-none px-3 py-2.5 text-sm font-medium sm:px-4"
            >
              <ClipboardList className="size-4 shrink-0" aria-hidden="true" />
              <span className="hidden md:inline">Pendaftaran & Transaksi</span>
              <span className="md:hidden">Pendaftaran</span>
              <Badge
                variant="secondary"
                className="rounded-full px-1.5 font-mono text-micro tabular-nums"
                aria-label={`${registrations.length} pendaftar`}
              >
                {registrations.length}
              </Badge>
              {pendingVerificationCount > 0 && (
                <Badge
                  variant="secondary"
                  className="rounded-full border-warning/20 bg-warning-soft px-1.5 font-mono text-micro tabular-nums text-warning"
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
          <TabsContent value="settings" className="mt-6">
            <EventSettingsForm initialSettings={settings} />
          </TabsContent>
        )}

        {/* ── Tab 2: Kategori Lomba ── */}
        {canManageSettings && (
          <TabsContent value="categories" className="mt-6">
            <CategoryManager initialCategories={categories} />
          </TabsContent>
        )}

        {/* ── Tab 3: Pendaftaran & Transaksi ── */}
        <TabsContent value="registrations" className="mt-6 space-y-6">
          {canManageSettings && (
            <div
              className="flex flex-col gap-2 rounded-lg border border-border bg-card p-1.5 sm:flex-row"
              role="tablist"
              aria-label="Sub-navigasi pendaftaran"
            >
              <button
                type="button"
                role="tab"
                aria-selected={regSubView === "verification"}
                onClick={() => setRegSubView("verification")}
                className={cn(
                  "inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors duration-150",
                  regSubView === "verification"
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <CreditCard className="size-4 shrink-0" aria-hidden="true" />
                Verifikasi Manual
                <Badge
                  variant="secondary"
                  className="rounded-full border-warning/20 bg-warning-soft px-1.5 font-mono text-micro tabular-nums text-warning"
                >
                  {pendingVerificationCount} Pending
                </Badge>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={regSubView === "all"}
                onClick={() => setRegSubView("all")}
                className={cn(
                  "inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors duration-150",
                  regSubView === "all"
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <ClipboardList className="size-4 shrink-0" aria-hidden="true" />
                Semua Pendaftar
                <Badge
                  variant="secondary"
                  className="rounded-full px-1.5 font-mono text-micro tabular-nums"
                >
                  {registrations.length}
                </Badge>
              </button>
            </div>
          )}

          {(!canManageSettings || regSubView === "verification") &&
            canManageSettings && (
              <section aria-labelledby="verifikasi-heading">
                <h2
                  id="verifikasi-heading"
                  className="sr-only font-display text-md font-semibold"
                >
                  Verifikasi pembayaran manual
                </h2>
                <ManualPaymentVerificationList
                  initialRegistrations={registrations}
                />
              </section>
            )}

          {(!canManageSettings ||
            regSubView === "all" ||
            !canManageSettings) && (
            <section aria-labelledby="pendaftar-heading">
              {canManageSettings && regSubView === "all" && (
                <h2
                  id="pendaftar-heading"
                  className="mb-4 font-display text-md font-semibold text-foreground"
                >
                  Daftar Pendaftaran & Pembayaran Tim
                </h2>
              )}
              {(!canManageSettings || regSubView === "all") && (
                <RegistrationTable
                  initialRegistrations={registrations}
                  isSuperAdmin={isSuperAdmin}
                />
              )}
            </section>
          )}

          {/* Verifikator tanpa akses kelola tetap melihat tabel penuh */}
          {!canManageSettings && (
            <span className="sr-only" id="pendaftar-heading">
              Daftar pendaftaran tim
            </span>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
