"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Image01Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getPiketWeekInfo } from "@/lib/utils/piket-date";
import { getPublicR2Url } from "@/lib/storage/r2";
import type {
  PiketComplianceRow,
  PiketComplianceStatus,
  PiketHistoryLog,
  PiketLogStatus,
} from "@/lib/repositories/piket";
import type { PiketProfile } from "./types";
import {
  PiketComplianceBadge,
  PiketLogStatusBadge,
} from "./piket-status-badge";
import { PiketHistoryMemberDrawer } from "./piket-history-member-drawer";
import { PiketPhotoPreviewDialog } from "./piket-photo-preview-dialog";

/** Nama bulan Indonesia (0-indexed) untuk picker filter bulan. */
const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

/** Pilihan pekan piket dalam satu siklus bulan (1–4). */
const WEEK_OPTIONS = [1, 2, 3, 4] as const;

/**
 * Props kontrak `PiketHistoryClient` (lihat plan Task 6). Di-consume oleh RSC
 * `/piket/riwayat`; jaga tetap kompatibel.
 */
export interface PiketHistoryClientProps {
  profile: PiketProfile;
  availablePeriods: string[];
  logs: PiketHistoryLog[];
  compliance: PiketComplianceRow[];
  initialTab: "kepatuhan" | "log";
  activeFilter: {
    academicPeriod: string;
    year: number | null;
    monthIndex0: number | null;
    weekNumber: number | null;
  };
  /**
   * Pesan error ramah bila salah satu fetch RPC di RSC gagal (mis. logs atau
   * compliance). `null` = tidak ada kegagalan. Ketika terisi, tab terkait
   * menampilkan panel error + tombol muat ulang, bukan empty state.
   */
  loadError?: string | null;
}

/** Kunci tab yang tersedia pada switcher histori. */
type HistoryTab = "kepatuhan" | "log";

/**
 * Histori piket DPH: filter bar (periode/tahun/bulan/pekan) + dua tab
 * (Kepatuhan & Log). Filter disimpan pada query URL (`router.replace`)
 * sehingga dapat di-bookmark dan tetap konsisten dengan fetch di RSC.
 */
export function PiketHistoryClient({
  profile,
  availablePeriods,
  logs,
  compliance,
  initialTab,
  activeFilter,
  loadError = null,
}: PiketHistoryClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<HistoryTab>(initialTab);
  // Filter ringan (client-side, spec §6.4). Status bergantung tab aktif;
  // pencarian mencocokkan nama anggota (case-insensitive substring).
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  // ID profil yang dipilih untuk drawer anggota (render drawer di Task 7).
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  // Pratinjau bukti foto baris Log (before/after).
  const [photoPreview, setPhotoPreview] = useState<{
    beforeUrl: string | null;
    afterUrl: string | null;
    reporterName: string;
    dutyDate: string;
    activeTab: "before" | "after";
  } | null>(null);

  const weekInfo = getPiketWeekInfo(new Date());

  // Tahun kalender yang mungkin dari rentang periode akademik aktif
  // (mis. "2026/2027" → 2026, 2027). Dipakai untuk picker tahun.
  const yearOptions = (() => {
    const years = new Set<number>();
    for (const period of availablePeriods) {
      const parts = period.split("/").map((p) => Number(p.trim()));
      for (const part of parts) {
        if (Number.isFinite(part) && part >= 1970 && part <= 9999) {
          years.add(part);
        }
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  })();

  /**
   * Perbarui query filter histori. Nilai `null`/`""` menghapus key terkait,
   * sementara nilai lain mengganti (atau menambah). `tab` dipertahankan.
   */
  const updateFilter = (
    patch: Record<string, string | number | null | undefined>,
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const handleRowClick = (profileId: string) => {
    // Drawer anggota dibangun pada Task 7; state disiapkan sekarang agar
    // handler & pemilihan baris sudah aktif.
    setSelectedProfileId(profileId);
  };

  /**
   * Ganti tab aktif + persist ke query (`?tab=`) agar bertahan saat refresh
   * atau dibagikan (spec ringan; server sudah membaca `?tab=`). Status filter
   * direset karena opsi status berbeda antar tab.
   */
  const handleTabChange = (tab: HistoryTab) => {
    setActiveTab(tab);
    setStatusFilter("");
    updateFilter({ tab });
  };

  // Nama anggota untuk header drawer, diturunkan dari baris yang tersedia.
  const selectedMemberName = (() => {
    if (!selectedProfileId) return "Anggota";
    const fromCompliance = compliance.find(
      (r) => r.profileId === selectedProfileId,
    );
    if (fromCompliance) return fromCompliance.memberName;
    const fromLog = logs.find((l) => l.reportedById === selectedProfileId);
    if (fromLog) return fromLog.reporterName;
    return "Anggota";
  })();

  // Ringkasan count tetap dihitung dari himpunan hasil server (sebelum
  // filter status/pencarian klien) — lihat catatan keputusan di report.
  const complianceCounts: Record<PiketComplianceStatus, number> = {
    alpha: compliance.filter((r) => r.status === "alpha").length,
    berlangsung: compliance.filter((r) => r.status === "berlangsung").length,
    magang: compliance.filter((r) => r.status === "magang").length,
    "sudah-lapor": compliance.filter((r) => r.status === "sudah-lapor").length,
  };

  // Opsi status mengikuti tab aktif (spec §2.2).
  const complianceStatusOptions: {
    value: PiketComplianceStatus;
    label: string;
  }[] = [
    { value: "sudah-lapor", label: "Sudah Lapor" },
    { value: "alpha", label: "Alpha" },
    { value: "berlangsung", label: "Berlangsung" },
    { value: "magang", label: "Magang" },
  ];

  const logStatusOptions: { value: PiketLogStatus; label: string }[] = [
    { value: "approved", label: "Disetujui" },
    { value: "pending", label: "Menunggu" },
    { value: "rejected", label: "Ditolak" },
    { value: "auto_final", label: "Final Otomatis" },
  ];

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const hasLightFilter = statusFilter !== "" || normalizedSearch !== "";

  // Terapkan filter status + pencarian nama di atas data ter-filter server.
  const filteredCompliance = compliance.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (
      normalizedSearch &&
      !r.memberName.toLowerCase().includes(normalizedSearch)
    ) {
      return false;
    }
    return true;
  });

  const filteredLogs = logs.filter((l) => {
    if (statusFilter && l.status !== statusFilter) return false;
    if (
      normalizedSearch &&
      !l.reporterName.toLowerCase().includes(normalizedSearch)
    ) {
      return false;
    }
    return true;
  });

  const summaryItems: { key: PiketComplianceStatus; label: string }[] = [
    { key: "alpha", label: "Alpha" },
    { key: "berlangsung", label: "Berlangsung" },
    { key: "magang", label: "Magang" },
    { key: "sudah-lapor", label: "Sudah Lapor" },
  ];

  const summaryTone: Record<PiketComplianceStatus, string> = {
    alpha:
      "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300",
    berlangsung:
      "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300",
    magang:
      "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300",
    "sudah-lapor":
      "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300",
  };

  const filterSelectClass =
    "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 min-h-[44px] text-xs font-mono font-medium text-[#0a192f] dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#1e3a8a] cursor-pointer";

  const tabClass = (tab: HistoryTab) =>
    cn(
      "flex-1 min-h-[44px] rounded-lg font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer text-center",
      activeTab === tab
        ? "bg-[#1e3a8a] dark:bg-blue-600 text-white shadow-xs"
        : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800",
    );

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
      {/* Header Panel */}
      <div className="relative border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-xs overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-[#1e3a8a] via-[#3b82f6] to-[#f97316]" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-[#0a192f] dark:text-slate-100 font-display flex items-center gap-2.5">
              <HugeiconsIcon
                icon={Calendar03Icon}
                size={24}
                className="text-[#1e3a8a] dark:text-blue-400 shrink-0"
              />
              Riwayat Piket Kebersihan
            </h1>
            <p className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
              Rekap kepatuhan &amp; log laporan piket DPH UKM Robotik PNP —
              masuk sebagai {profile.email}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[#ffedd5] dark:bg-orange-950/60 text-[#c2410c] dark:text-orange-300 border border-orange-200 dark:border-orange-900/60 px-3 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-wider font-semibold">
              SAAT INI: PEKAN {weekInfo.weekNumber} (
              {weekInfo.dateRangeFormatted})
            </Badge>
          </div>
        </div>
      </div>

      {/* Filter Bar: Periode / Tahun / Bulan / Pekan / Status / Cari */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-xs">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Periode DPH
            </span>
            <select
              aria-label="Periode DPH"
              value={activeFilter.academicPeriod}
              onChange={(e) => updateFilter({ period: e.target.value })}
              className={filterSelectClass}
            >
              {availablePeriods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Tahun
            </span>
            <select
              aria-label="Tahun"
              value={activeFilter.year ?? ""}
              onChange={(e) => updateFilter({ year: e.target.value || null })}
              className={filterSelectClass}
            >
              <option value="">Semua Tahun</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Bulan
            </span>
            <select
              aria-label="Bulan"
              value={
                activeFilter.monthIndex0 == null
                  ? ""
                  : activeFilter.monthIndex0 + 1
              }
              onChange={(e) =>
                updateFilter({
                  month: e.target.value ? Number(e.target.value) : null,
                })
              }
              className={filterSelectClass}
            >
              <option value="">Semua Bulan</option>
              {MONTH_NAMES_ID.map((name, index0) => (
                <option key={name} value={index0 + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Pekan
            </span>
            <select
              aria-label="Pekan"
              value={activeFilter.weekNumber ?? ""}
              onChange={(e) => updateFilter({ week: e.target.value || null })}
              className={filterSelectClass}
            >
              <option value="">Semua Pekan</option>
              {WEEK_OPTIONS.map((w) => (
                <option key={w} value={w}>
                  Pekan {w}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Status
            </span>
            <select
              aria-label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={filterSelectClass}
            >
              <option value="">Semua status</option>
              {activeTab === "kepatuhan"
                ? complianceStatusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))
                : logStatusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Cari Anggota
            </span>
            <input
              type="search"
              aria-label="Cari nama anggota"
              placeholder="Nama anggota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 min-h-[44px] text-xs font-mono font-medium text-[#0a192f] dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#1e3a8a]"
            />
          </label>
        </div>
      </div>

      {/* Tab Switcher: Kepatuhan & Log */}
      <div className="flex gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl shadow-xs">
        <button
          type="button"
          onClick={() => handleTabChange("kepatuhan")}
          className={tabClass("kepatuhan")}
        >
          Kepatuhan
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("log")}
          className={tabClass("log")}
        >
          Log
        </button>
      </div>

      {/* Panel Kepatuhan (kept mounted; hidden via CSS) */}
      <div
        data-testid="piket-history-kepatuhan-panel"
        aria-hidden={activeTab !== "kepatuhan"}
        className={activeTab === "kepatuhan" ? "block" : "hidden"}
      >
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-base font-display font-medium text-[#0a192f] dark:text-slate-100">
              Rekap Kepatuhan Piket ({activeFilter.academicPeriod})
            </CardTitle>
            <CardDescription className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Ringkasan status piket anggota per pekan pada periode{" "}
              {activeFilter.academicPeriod}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* Summary count per status */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {summaryItems.map((item) => (
                <div
                  key={item.key}
                  data-testid={`piket-history-summary-${item.key}`}
                  className={cn("p-3 rounded-lg border", summaryTone[item.key])}
                >
                  <span className="text-[10px] font-mono uppercase tracking-widest block">
                    {item.label}
                  </span>
                  <span className="font-display font-medium text-lg">
                    {complianceCounts[item.key]}
                  </span>
                </div>
              ))}
            </div>

            {loadError ? (
              <div
                role="alert"
                className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 font-mono text-xs flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <span className="flex-1">{loadError}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.refresh()}
                  className="min-h-[44px] font-mono text-xs border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer self-start sm:self-auto"
                >
                  <HugeiconsIcon
                    icon={RefreshIcon}
                    size={16}
                    className="mr-1.5"
                  />
                  Muat ulang
                </Button>
              </div>
            ) : filteredCompliance.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">
                {hasLightFilter
                  ? "Tidak ada hasil kepatuhan untuk filter yang dipilih."
                  : `Belum ada data kepatuhan untuk periode ${activeFilter.academicPeriod}.`}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 font-mono text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      <th className="p-3">Anggota</th>
                      <th className="p-3">NIM</th>
                      <th className="p-3">Bulan</th>
                      <th className="p-3">Pekan</th>
                      <th className="p-3">Ruang</th>
                      <th className="p-3">Rentang</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredCompliance.map((r) => (
                      <tr
                        key={`${r.profileId}-${r.weekNumber}-${r.roomTarget}-${r.startIsoDate}`}
                        onClick={() => handleRowClick(r.profileId)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleRowClick(r.profileId);
                          }
                        }}
                        aria-pressed={selectedProfileId === r.profileId}
                        className={cn(
                          "cursor-pointer transition-colors",
                          selectedProfileId === r.profileId
                            ? "bg-[#eaf1f8] dark:bg-slate-800/60"
                            : "hover:bg-slate-50/70 dark:hover:bg-slate-800/40",
                        )}
                      >
                        <td className="p-3">
                          <span className="font-display font-medium text-[#0a192f] dark:text-slate-100 block">
                            {r.memberName}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                          {r.nim || "-"}
                        </td>
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                          {r.cycleMonthLabel}
                        </td>
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                          Pekan {r.weekNumber}
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                          {r.roomTarget}
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                          {new Date(r.startIsoDate).toLocaleDateString(
                            "id-ID",
                            {
                              dateStyle: "medium",
                            },
                          )}
                          {" – "}
                          {new Date(r.endIsoDate).toLocaleDateString("id-ID", {
                            dateStyle: "medium",
                          })}
                        </td>
                        <td className="p-3">
                          <PiketComplianceBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Panel Log (kept mounted; hidden via CSS) */}
      <div
        data-testid="piket-history-log-panel"
        aria-hidden={activeTab !== "log"}
        className={activeTab === "log" ? "block" : "hidden"}
      >
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-base font-display font-medium text-[#0a192f] dark:text-slate-100">
              Log Laporan Piket ({activeFilter.academicPeriod})
            </CardTitle>
            <CardDescription className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Daftar laporan piket kebersihan yang tercatat pada periode{" "}
              {activeFilter.academicPeriod}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {loadError ? (
              <div
                role="alert"
                className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 font-mono text-xs flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <span className="flex-1">{loadError}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.refresh()}
                  className="min-h-[44px] font-mono text-xs border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer self-start sm:self-auto"
                >
                  <HugeiconsIcon
                    icon={RefreshIcon}
                    size={16}
                    className="mr-1.5"
                  />
                  Muat ulang
                </Button>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">
                {hasLightFilter
                  ? "Tidak ada hasil log untuk filter yang dipilih."
                  : `Belum ada log piket untuk periode ${activeFilter.academicPeriod}.`}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 font-mono text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      <th className="p-3">Tanggal Tugas</th>
                      <th className="p-3">Petugas</th>
                      <th className="p-3">Pekan</th>
                      <th className="p-3">Bulan</th>
                      <th className="p-3">Ruang</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Bukti</th>
                      <th className="p-3">Catatan</th>
                      <th className="p-3">Verifikator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => {
                          if (log.reportedById) {
                            handleRowClick(log.reportedById);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (
                            log.reportedById &&
                            (e.key === "Enter" || e.key === " ")
                          ) {
                            e.preventDefault();
                            handleRowClick(log.reportedById);
                          }
                        }}
                        aria-pressed={selectedProfileId === log.reportedById}
                        className={cn(
                          "transition-colors",
                          log.reportedById ? "cursor-pointer" : "",
                          selectedProfileId === log.reportedById
                            ? "bg-[#eaf1f8] dark:bg-slate-800/60"
                            : "hover:bg-slate-50/70 dark:hover:bg-slate-800/40",
                        )}
                      >
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                          {new Date(log.dutyDate).toLocaleDateString("id-ID", {
                            dateStyle: "medium",
                          })}
                        </td>
                        <td className="p-3">
                          <span className="font-display font-medium text-[#0a192f] dark:text-slate-100 block">
                            {log.reporterName}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                            {log.reporterNim || "-"}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                          Pekan {log.weekNumber}
                        </td>
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                          {new Date(log.dutyDate).toLocaleDateString("id-ID", {
                            month: "long",
                            year: "numeric",
                          })}
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                          {log.roomTarget}
                        </td>
                        <td className="p-3">
                          <PiketLogStatusBadge status={log.status} />
                        </td>
                        <td className="p-3">
                          {log.proofImageUrl || log.proofImageBeforeUrl ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="min-h-[44px] font-mono text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPhotoPreview({
                                  beforeUrl:
                                    getPublicR2Url(log.proofImageBeforeUrl) ||
                                    null,
                                  afterUrl:
                                    getPublicR2Url(log.proofImageUrl) || null,
                                  reporterName: log.reporterName,
                                  dutyDate: new Date(
                                    log.dutyDate,
                                  ).toLocaleDateString("id-ID", {
                                    dateStyle: "medium",
                                  }),
                                  activeTab: log.proofImageUrl
                                    ? "after"
                                    : "before",
                                });
                              }}
                            >
                              <HugeiconsIcon
                                icon={Image01Icon}
                                size={16}
                                className="mr-1.5"
                              />
                              Lihat
                            </Button>
                          ) : (
                            <span className="font-mono text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300 max-w-[16rem]">
                          {log.notes || "-"}
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                          {log.verifierName || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Drawer riwayat anggota (lazy fetch saat dibuka) */}
      <PiketHistoryMemberDrawer
        profileId={selectedProfileId}
        memberName={selectedMemberName}
        open={selectedProfileId !== null}
        onOpenChange={(o) => {
          if (!o) setSelectedProfileId(null);
        }}
      />

      {/* Pratinjau bukti foto baris Log */}
      <PiketPhotoPreviewDialog
        open={!!photoPreview}
        beforeUrl={photoPreview?.beforeUrl ?? null}
        afterUrl={photoPreview?.afterUrl ?? null}
        reporterName={photoPreview?.reporterName ?? "Petugas"}
        dutyDate={photoPreview?.dutyDate ?? ""}
        activeTab={photoPreview?.activeTab ?? "after"}
        onTabChange={(tab) =>
          setPhotoPreview((prev) => (prev ? { ...prev, activeTab: tab } : null))
        }
        onClose={() => setPhotoPreview(null)}
      />
    </div>
  );
}
