"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Workflow,
  UserCog,
  ScrollText,
  CalendarDays,
  CalendarCheck2,
  FileText,
  AlertTriangle,
  SprayCan,
  ClipboardList,
  Users,
  UsersRound,
  Briefcase,
  Settings,
  Trophy,
  CalendarRange,
  CreditCard,
  Search,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useSyncExternalStore,
} from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/shared/sidebar-provider";

// ─────────────────────────────────────────────────────────────
// Modul — tiap kelompok menu mewakili satu domain tanggung jawab nyata.
// Judul section mengodekan struktur organisasi, bukan dekorasi.
// `hint` memberi konteks singkat domain kerja modul tersebut.
// ─────────────────────────────────────────────────────────────
const moduleGroups = {
  governance: {
    title: "Governance",
    hint: "Struktur, akun & audit sistem",
  },
  kedisiplinan: {
    title: "Kedisiplinan",
    hint: "Kegiatan, presensi & perizinan",
  },
  kebersihan: {
    title: "Kebersihan",
    hint: "Piket & perawatan laboratorium",
  },
  openRecruitment: {
    title: "Open Recruitment",
    hint: "Seleksi, pembinaan & magang caang",
  },
  mrc: {
    title: "Minangkabau Robot Contest",
    hint: "Operasional event & kompetisi",
  },
} as const;

type ModuleKey = keyof typeof moduleGroups;

// ─────────────────────────────────────────────────────────────
// Katalog menu — sumber tunggal untuk metadata, ikon, modul & gating.
// `adminOnly` = hanya super-admin. `searchTerms` memperluas pencarian
// agar admin menemukan menu lewat istilah kerja sehari-hari.
// Ikon memakai lucide-react (lihat DESIGN.md §9 — Ikon & Ilustrasi).
// ─────────────────────────────────────────────────────────────
const allMenuItems = {
  dashboard: {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    module: "governance" as ModuleKey,
    adminOnly: false,
    searchTerms: "beranda utama ringkasan",
  },
  manajemenStruktur: {
    title: "Manajemen Struktur",
    href: "/manajemen-struktur",
    icon: Workflow,
    module: "governance" as ModuleKey,
    adminOnly: true,
    searchTerms: "bagan pengurus jabatan divisi organisasi",
  },
  manajemenAkun: {
    title: "Manajemen Akun",
    href: "/manajemen-akun",
    icon: UserCog,
    module: "governance" as ModuleKey,
    adminOnly: true,
    searchTerms: "pengguna user role hak akses login akun",
  },
  auditLogSistem: {
    title: "Audit Log Sistem",
    href: "/audit-log",
    icon: ScrollText,
    module: "governance" as ModuleKey,
    adminOnly: true,
    searchTerms: "log rekam jejak mutasi keamanan jejak audit",
  },

  kegiatan: {
    title: "Kegiatan",
    href: "/kegiatan",
    icon: CalendarDays,
    module: "kedisiplinan" as ModuleKey,
    adminOnly: false,
    searchTerms: "sesi agenda jadwal acara qr presensi",
  },
  presensi: {
    title: "Presensi",
    href: "/presensi",
    icon: CalendarCheck2,
    module: "kedisiplinan" as ModuleKey,
    adminOnly: false,
    searchTerms: "kehadiran absen hadir alpha scan",
  },
  perizinan: {
    title: "Perizinan",
    href: "/perizinan",
    icon: FileText,
    module: "kedisiplinan" as ModuleKey,
    adminOnly: true,
    searchTerms: "izin sakit dispensasi permohonan cuti",
  },
  kedisiplinan: {
    title: "Kedisiplinan",
    href: "/kedisiplinan",
    icon: AlertTriangle,
    module: "kedisiplinan" as ModuleKey,
    adminOnly: true,
    searchTerms: "poin pelanggaran sanksi sp surat peringatan",
  },

  piket: {
    title: "Piket",
    href: "/piket",
    icon: SprayCan,
    module: "kebersihan" as ModuleKey,
    adminOnly: false,
    searchTerms: "shift lab laboratorium jadwal bersih denda",
  },

  dashboardPendaftaranCaang: {
    title: "Dashboard Pendaftaran",
    href: "/dashboard-pendaftaran-caang",
    icon: ClipboardList,
    module: "openRecruitment" as ModuleKey,
    adminOnly: false,
    searchTerms: "rekap pendaftar oprec gelombang statistik",
  },
  manajemenCaang: {
    title: "Manajemen Caang",
    href: "/manajemen-caang",
    icon: Users,
    module: "openRecruitment" as ModuleKey,
    adminOnly: false,
    searchTerms: "calon anggota seleksi wawancara evaluasi kandidat",
  },
  manajemenKelompokCaang: {
    title: "Manajemen Kelompok",
    href: "/manajemen-kelompok",
    icon: UsersRound,
    module: "openRecruitment" as ModuleKey,
    adminOnly: false,
    searchTerms: "kelompok mentoring pembinaan gugus caang",
  },
  manajemenMagang: {
    title: "Manajemen Magang",
    href: "/manajemen-magang",
    icon: Briefcase,
    module: "openRecruitment" as ModuleKey,
    adminOnly: false,
    searchTerms: "internship robotika magang logbook penilaian",
  },
  pengaturanOr: {
    title: "Pengaturan OR",
    href: "/pengaturan-or",
    icon: Settings,
    module: "openRecruitment" as ModuleKey,
    adminOnly: true,
    searchTerms: "konfigurasi oprec gelombang window pendaftaran",
  },

  mrcDashboard: {
    title: "Dashboard MRC",
    href: "/manajemen-event",
    icon: LayoutDashboard,
    module: "mrc" as ModuleKey,
    adminOnly: false,
    searchTerms:
      "mrc dashboard utama ringkasan statistik kuota pendaftaran tim",
  },
  mrcPendaftaran: {
    title: "Data Pendaftar",
    href: "/manajemen-event/pendaftaran",
    icon: ClipboardList,
    module: "mrc" as ModuleKey,
    adminOnly: false,
    searchTerms:
      "mrc pendaftaran tim peserta verifikasi pembayaran bukti transfer pendaftar",
  },
  mrcKategori: {
    title: "Kategori Lomba",
    href: "/manajemen-event/kategori",
    icon: Trophy,
    module: "mrc" as ModuleKey,
    adminOnly: false,
    searchTerms: "mrc kategori divisi lomba kuota biaya batch fee",
  },
  mrcTimeline: {
    title: "Timeline Acara",
    href: "/manajemen-event/timeline",
    icon: CalendarRange,
    module: "mrc" as ModuleKey,
    adminOnly: false,
    searchTerms: "mrc timeline jadwal batch technical meeting acara rilis",
  },
  mrcPembayaran: {
    title: "Metode Pembayaran",
    href: "/manajemen-event/pembayaran",
    icon: CreditCard,
    module: "mrc" as ModuleKey,
    adminOnly: false,
    searchTerms: "mrc pembayaran midtrans bank manual rekening qris gateway",
  },
} as const;

type MenuKey = keyof typeof allMenuItems;

// ─────────────────────────────────────────────────────────────
// Otorisasi: daftar menu yang boleh diakses tiap role.
// ─────────────────────────────────────────────────────────────
const roleMenuKeys: Record<string, MenuKey[]> = {
  caang: ["dashboard", "kegiatan", "presensi", "manajemenMagang"],
  anggota: ["dashboard", "kegiatan", "presensi", "piket"],
  "admin-kestari": ["dashboard", "kegiatan", "presensi", "piket"],
  "admin-komdis": [
    "dashboard",
    "kegiatan",
    "presensi",
    "perizinan",
    "kedisiplinan",
    "piket",
  ],
  "admin-or": [
    "dashboard",
    "kegiatan",
    "presensi",
    "piket",
    "dashboardPendaftaranCaang",
    "manajemenCaang",
    "manajemenKelompokCaang",
    "manajemenMagang",
  ],
  "panitia-pendaftaran": [
    "dashboard",
    "mrcDashboard",
    "mrcPendaftaran",
    "mrcKategori",
    "mrcTimeline",
    "mrcPembayaran",
  ],
  "panitia-verifikasi": ["dashboard", "mrcDashboard", "mrcPendaftaran"],
  "panitia-pertandingan": ["dashboard", "mrcDashboard", "mrcPendaftaran"],
  "super-admin": [
    "dashboard",
    "manajemenStruktur",
    "manajemenAkun",
    "auditLogSistem",
    "kegiatan",
    "presensi",
    "perizinan",
    "kedisiplinan",
    "piket",
    "dashboardPendaftaranCaang",
    "manajemenCaang",
    "manajemenKelompokCaang",
    "manajemenMagang",
    "pengaturanOr",
    "mrcDashboard",
    "mrcPendaftaran",
    "mrcKategori",
    "mrcTimeline",
    "mrcPembayaran",
  ],
};

// Urutan modul & urutan menu di dalamnya mengikuti alur kerja, bukan alfabet.
const moduleOrder: ModuleKey[] = [
  "governance",
  "kedisiplinan",
  "kebersihan",
  "openRecruitment",
  "mrc",
];

const menuOrderWithinModule: Record<ModuleKey, MenuKey[]> = {
  governance: [
    "dashboard",
    "manajemenStruktur",
    "manajemenAkun",
    "auditLogSistem",
  ],
  kedisiplinan: ["kegiatan", "presensi", "perizinan", "kedisiplinan"],
  kebersihan: ["piket"],
  openRecruitment: [
    "dashboardPendaftaranCaang",
    "manajemenCaang",
    "manajemenKelompokCaang",
    "manajemenMagang",
    "pengaturanOr",
  ],
  mrc: [
    "mrcDashboard",
    "mrcPendaftaran",
    "mrcKategori",
    "mrcTimeline",
    "mrcPembayaran",
  ],
};

interface ModuleSection {
  module: ModuleKey;
  keys: MenuKey[];
}

// Aturan visibilitas tunggal: item `adminOnly` hanya untuk super-admin.
function resolveVisibleKeys(
  role: string | undefined,
  isOnboarded: boolean | undefined,
): MenuKey[] {
  if (isOnboarded === false) return ["dashboard"];
  const base: MenuKey[] =
    role && roleMenuKeys[role] ? roleMenuKeys[role] : ["dashboard"];
  return base.filter((key) => {
    const item = allMenuItems[key];
    if (item.adminOnly && role !== "super-admin") return false;
    return true;
  });
}

// Href yang harus dicocokkan persis: menjadi prefix bagi sub-route lain,
// sehingga pencocokan `startsWith` akan salah menyalakan highlight.
const EXACT_MATCH_HREFS = new Set<string>(["/dashboard", "/manajemen-event"]);

function isActiveLink(pathname: string, href: string) {
  if (EXACT_MATCH_HREFS.has(href)) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Deteksi platform lewat external store agar tidak memicu cascading render.
const macPlatformStore = {
  subscribe: () => () => {},
  getSnapshot: () =>
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/i.test(navigator.userAgent || ""),
  getServerSnapshot: () => false,
};

function useIsMac() {
  return useSyncExternalStore(
    macPlatformStore.subscribe,
    macPlatformStore.getSnapshot,
    macPlatformStore.getServerSnapshot,
  );
}

// ─────────────────────────────────────────────────────────────
// Brand header — logo + nama unit + email akun. Saat rail minimized,
// hanya logo yang tampil (di-tooltip-kan) agar tidak overflow di 72px.
// ─────────────────────────────────────────────────────────────
function BrandHeader({
  email,
  collapsed,
  onClick,
  showSettingsLink = true,
}: {
  email?: string;
  collapsed: boolean;
  onClick?: () => void;
  /**
   * Tampilkan pintasan gear ke `/settings` di ujung kanan.
   * Dimatikan pada drawer mobile karena posisi itu ditempati tombol tutup (X)
   * bawaan Sheet — keduanya akan saling menumpuk bila dirender bersamaan.
   */
  showSettingsLink?: boolean;
}) {
  const logo = (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card">
      <Image
        src="/images/logo-ukm-robotik-pnp.webp"
        alt="Logo UKM Robotik PNP"
        width={24}
        height={24}
        priority
        className="size-6 object-contain"
      />
    </span>
  );

  if (collapsed) {
    return (
      <div className="flex w-full items-center justify-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/settings"
              onClick={onClick}
              aria-label="Buka pengaturan akun — Robotik PNP"
              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {logo}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Pengaturan akun</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-2.5">
      {logo}
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-semibold tracking-tight text-foreground">
          Robotik PNP
        </p>
        <p className="truncate font-mono text-micro text-muted-foreground">
          {email || "memuat akun…"}
        </p>
      </div>
      <Link
        href="/settings"
        onClick={onClick}
        aria-label="Buka pengaturan akun"
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          !showSettingsLink && "hidden",
        )}
      >
        <Settings size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Search field — filter menu lintas modul + shortcut ⌘K / Ctrl+K.
// Disembunyikan saat rail minimized (lihat SidebarNav).
// ─────────────────────────────────────────────────────────────
function SidebarSearch({
  value,
  onChange,
  inputRef,
  onNavigate,
}: {
  value: string;
  onChange: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Dipakai tombol settings di samping kolom pencarian (drawer mobile). */
  onNavigate?: () => void;
}) {
  const isMac = useIsMac();

  return (
    <div className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Search
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
        />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Cari menu…"
          aria-label="Cari menu navigasi"
          className="h-8 w-full rounded-md border border-input bg-input/20 pr-14 pl-9 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:appearance-none"
        />
        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-0.5 rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono text-micro font-medium text-muted-foreground"
        >
          {isMac ? "⌘" : "Ctrl"} K
        </kbd>
      </div>

      {/*
        Pintasan settings untuk drawer mobile. Ditempatkan di baris ini —
        bukan di pojok kanan header — agar tidak bertumpuk dengan tombol
        tutup (X) bawaan Sheet yang berada di `absolute top-4 right-4`.
      */}
      {onNavigate && (
        <Link
          href="/settings"
          onClick={onNavigate}
          aria-label="Buka pengaturan akun"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Settings size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NavLink — baris menu. Garis vertikal tipis di left-0 menandai
// posisi dalam pohon modul; item aktif mengisi garis itu dengan warna brand.
// Saat rail minimized, dirender sebagai tombol ikon terpusat + tooltip,
// dengan indikator badge sebagai titik kecil di sudut kanan-atas ikon.
// ─────────────────────────────────────────────────────────────
function NavLink({
  itemKey,
  isActive,
  collapsed,
  badgeCount,
  badgeTone = "default",
  onClick,
}: {
  itemKey: MenuKey;
  isActive: boolean;
  collapsed: boolean;
  badgeCount?: number;
  badgeTone?: "default" | "warning";
  onClick?: () => void;
}) {
  const item = allMenuItems[itemKey];
  const Icon: LucideIcon = item.icon;
  const hasBadge = typeof badgeCount === "number" && badgeCount > 0;

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            onClick={onClick}
            aria-current={isActive ? "page" : undefined}
            aria-label={
              hasBadge
                ? `${item.title} — ${badgeCount} item menunggu tindakan`
                : item.title
            }
            className={cn(
              "relative mx-auto flex size-9 items-center justify-center rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-primary-soft text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon size={18} aria-hidden="true" />
            {hasBadge && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-1.5 right-1.5 size-2 rounded-full",
                  badgeTone === "warning" ? "bg-warning" : "bg-primary",
                )}
              />
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{item.title}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex min-h-9 items-center gap-2.5 rounded-md py-1.5 pr-2.5 pl-4 text-sm transition-colors duration-150 before:absolute before:inset-y-1 before:left-0 before:w-px before:rounded-full before:bg-border before:transition-colors",
        isActive
          ? "bg-primary-soft font-semibold text-primary before:bg-primary"
          : "text-foreground/80 hover:bg-muted hover:text-foreground before:group-hover:bg-primary/40",
      )}
    >
      <Icon
        size={17}
        className={cn(
          "shrink-0 transition-colors",
          isActive
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground",
        )}
        aria-hidden="true"
      />
      <span className="truncate">{item.title}</span>
      {hasBadge && (
        <Badge
          variant={badgeTone === "warning" ? "secondary" : "default"}
          className={cn(
            "ml-auto h-5 min-w-5 justify-center rounded-full px-1.5 font-mono text-micro font-semibold tabular-nums",
            badgeTone === "warning" &&
              "border border-warning/30 bg-warning-soft text-warning",
            badgeTone === "default" && "bg-primary text-primary-foreground",
          )}
          aria-label={`${badgeCount} item menunggu tindakan`}
        >
          {badgeCount! > 99 ? "99+" : badgeCount}
        </Badge>
      )}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// ModuleSectionBlock — satu modul sebagai grup yang bisa dilipat.
// Header memakai eyebrow mono + caret; kontennya adalah daftar menu.
// Saat rail minimized, header modul disembunyikan dan menu dirender rata
// dengan pembatas tipis antar-modul (tidak ada lagi grup yang bisa dilipat).
// ─────────────────────────────────────────────────────────────
function ModuleSectionBlock({
  section,
  pathname,
  expanded,
  collapsed,
  isFirst,
  onToggle,
  badgeCounts,
  onNavigate,
}: {
  section: ModuleSection;
  pathname: string;
  expanded: boolean;
  collapsed: boolean;
  isFirst: boolean;
  onToggle: (module: ModuleKey, open: boolean) => void;
  badgeCounts?: Partial<Record<MenuKey, number>>;
  onNavigate?: () => void;
}) {
  const group = moduleGroups[section.module];
  const hasActive = section.keys.some((key) =>
    isActiveLink(pathname, allMenuItems[key].href),
  );

  if (collapsed) {
    return (
      <div role="group" aria-label={group.title} className="flex flex-col">
        {!isFirst && (
          <div
            className="mx-3 my-2 h-px shrink-0 bg-border"
            aria-hidden="true"
          />
        )}
        <div className="flex flex-col gap-1">
          {section.keys.map((key) => (
            <NavLink
              key={key}
              itemKey={key}
              isActive={isActiveLink(pathname, allMenuItems[key].href)}
              collapsed
              badgeCount={badgeCounts?.[key]}
              badgeTone={
                key === "kedisiplinan" || key === "mrcPendaftaran"
                  ? "warning"
                  : "default"
              }
              onClick={onNavigate}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Collapsible
      open={expanded}
      onOpenChange={(open) => onToggle(section.module, open)}
      asChild
    >
      <div role="group" aria-label={group.title}>
        <CollapsibleTrigger
          className={cn(
            "group flex min-h-[36px] w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "hover:bg-muted/60",
          )}
        >
          {expanded ? (
            <ChevronDown
              size={14}
              aria-hidden="true"
              className={cn(
                "shrink-0 transition-colors",
                hasActive
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            />
          ) : (
            <ChevronRight
              size={14}
              aria-hidden="true"
              className={cn(
                "shrink-0 transition-colors",
                hasActive
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            />
          )}
          <span
            className={cn(
              "truncate font-mono text-micro font-semibold uppercase tracking-wider transition-colors",
              hasActive
                ? "text-primary"
                : "text-muted-foreground group-hover:text-foreground",
            )}
          >
            {group.title}
          </span>
          <span
            className={cn(
              "ml-auto font-mono text-micro tabular-nums transition-colors",
              hasActive ? "text-primary" : "text-muted-foreground/70",
            )}
            aria-hidden="true"
          >
            {section.keys.length}
          </span>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden data-[state=closed]:hidden">
          <div className="mt-1 flex flex-col gap-0.5 pb-1">
            {section.keys.map((key) => (
              <NavLink
                key={key}
                itemKey={key}
                isActive={isActiveLink(pathname, allMenuItems[key].href)}
                collapsed={false}
                badgeCount={badgeCounts?.[key]}
                badgeTone={
                  key === "kedisiplinan" || key === "mrcPendaftaran"
                    ? "warning"
                    : "default"
                }
                onClick={onNavigate}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function SidebarSkeleton({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="flex flex-1 flex-col items-center gap-3 overflow-hidden p-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="size-9 shrink-0 rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden p-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <div className="flex items-center gap-2.5 pl-4">
            <Skeleton className="size-4 rounded-sm" />
            <Skeleton className="h-3.5 w-28" />
          </div>
          <div className="flex items-center gap-2.5 pl-4">
            <Skeleton className="size-4 rounded-sm" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SidebarNav({
  sections,
  loading,
  pathname,
  collapsed,
  query,
  onQueryChange,
  searchInputRef,
  badgeCounts,
  onNavigate,
  searchTrailing,
}: {
  sections: ModuleSection[];
  loading: boolean;
  pathname: string;
  collapsed: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  badgeCounts?: Partial<Record<MenuKey, number>>;
  onNavigate?: () => void;
  /**
   * Elemen yang dirender sejajar (satu baris) dengan kolom pencarian di
   * sebelah kanannya — dipakai untuk menaruh tombol ciutkan sidebar desktop.
   */
  searchTrailing?: React.ReactNode;
}) {
  // Default semua modul terbuka; perubahan manual pengguna disimpan sebagai override.
  const [collapsedOverrides, setCollapsedOverrides] = useState<Set<ModuleKey>>(
    () => new Set(),
  );

  const isSearching = !collapsed && query.trim().length > 0;

  const filteredSections = useMemo(() => {
    if (!isSearching) return sections;
    const needle = query.trim().toLowerCase();
    return sections
      .map((section) => ({
        module: section.module,
        keys: section.keys.filter((key) => {
          const item = allMenuItems[key];
          const haystack =
            `${item.title} ${item.searchTerms} ${moduleGroups[section.module].title}`.toLowerCase();
          return haystack.includes(needle);
        }),
      }))
      .filter((section) => section.keys.length > 0);
  }, [sections, query, isSearching]);

  const handleToggle = useCallback((module: ModuleKey, open: boolean) => {
    setCollapsedOverrides((prev) => {
      const next = new Set(prev);
      if (open) next.delete(module);
      else next.add(module);
      return next;
    });
  }, []);

  // Saat mencari, semua modul hasil pencarian dibuka paksa.
  const isExpanded = useCallback(
    (module: ModuleKey) => isSearching || !collapsedOverrides.has(module),
    [isSearching, collapsedOverrides],
  );

  return (
    <nav
      aria-label="Navigasi utama"
      className="flex flex-1 flex-col gap-3 overflow-hidden mt-4"
    >
      {!collapsed && (
        // Satu baris berisi kolom pencarian + (opsional) tombol ciutkan
        // sidebar, sehingga keduanya sejajar. Pt-3 memberi jarak dari header
        // brand di atasnya.
        <div className="flex items-center gap-2 px-3 pt-3">
          <div className="min-w-0 flex-1">
            <SidebarSearch
              value={query}
              onChange={onQueryChange}
              inputRef={searchInputRef}
              onNavigate={onNavigate}
            />
          </div>
          {searchTrailing}
        </div>
      )}

      {loading ? (
        <SidebarSkeleton collapsed={collapsed} />
      ) : (
        <div
          className={cn(
            "flex-1 overflow-y-auto pb-3",
            collapsed ? "px-2" : "px-2",
          )}
        >
          {filteredSections.length === 0 ? (
            <p className="px-2.5 py-6 text-center text-xs text-muted-foreground">
              Tidak ada menu yang cocok dengan{" "}
              <span className="font-medium text-foreground">
                &ldquo;{query.trim()}&rdquo;
              </span>
              .
            </p>
          ) : (
            <div
              className={cn("flex flex-col", collapsed ? "gap-0" : "gap-1.5")}
            >
              {filteredSections.map((section, index) => (
                <ModuleSectionBlock
                  key={section.module}
                  section={section}
                  pathname={pathname}
                  expanded={isExpanded(section.module)}
                  collapsed={collapsed}
                  isFirst={index === 0}
                  onToggle={handleToggle}
                  badgeCounts={badgeCounts}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

// SidebarNav memegang state pencarian sendiri dan di-`key` berdasarkan pathname,
// sehingga navigasi otomatis mengosongkan filter tanpa perlu efek sinkronisasi.
function SidebarNavController({
  sections,
  loading,
  pathname,
  collapsed,
  badgeCounts,
  onNavigate,
  onExpandRequest,
  searchTrailing,
}: {
  sections: ModuleSection[];
  loading: boolean;
  pathname: string;
  collapsed: boolean;
  badgeCounts?: Partial<Record<MenuKey, number>>;
  onNavigate?: () => void;
  onExpandRequest?: () => void;
  /** Diteruskan ke SidebarNav agar tampil sejajar dengan kolom pencarian. */
  searchTrailing?: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Shortcut ⌘K / Ctrl+K memfokuskan kolom pencarian menu. Jika rail sedang
  // minimized, buka dulu panelnya lalu fokuskan setelah animasi transisi.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (collapsed) {
          onExpandRequest?.();
          window.setTimeout(() => searchInputRef.current?.focus(), 210);
        } else {
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [collapsed, onExpandRequest]);

  return (
    <SidebarNav
      sections={sections}
      loading={loading}
      pathname={pathname}
      collapsed={collapsed}
      query={query}
      onQueryChange={setQuery}
      searchInputRef={searchInputRef}
      badgeCounts={badgeCounts}
      onNavigate={onNavigate}
      searchTrailing={searchTrailing}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Tombol minimize/expand — hanya tampil dari breakpoint md ke atas.
// Diletakkan menyatu di baris BrandHeader saat expanded, dan sebagai
// tombol tersendiri di bawah logo saat collapsed (lebih mudah dijangkau).
//
// Catatan penting: penyembunyian di layar kecil TIDAK boleh memakai kelas
// `hidden` pada <Button>, karena kelas dasar Button sudah memuat
// `inline-flex` dan `.inline-flex` berada SETELAH `.hidden` di stylesheet
// Tailwind — sehingga `hidden` kalah dan tombol tetap tampil. Karena itu
// visibilitas diatur lewat wrapper `hidden md:flex`, bukan pada Button.
// ─────────────────────────────────────────────────────────────
function CollapseToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="hidden md:flex">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
          >
            {collapsed ? (
              <PanelLeftOpen size={16} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={16} aria-hidden="true" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const {
    collapsed,
    setCollapsed,
    toggleCollapsed,
    mobileOpen,
    setMobileOpen,
  } = useSidebar();

  const role = user?.role;
  const isOnboarded = user?.is_onboarded;

  const visibleKeys = useMemo(
    () => resolveVisibleKeys(role, isOnboarded),
    [role, isOnboarded],
  );

  // Setiap modul dirender sebagai satu blok; modul tanpa menu terlihat hilang,
  // sehingga sidebar hanya menampilkan domain yang relevan bagi role pengguna.
  const sections: ModuleSection[] = useMemo(
    () =>
      moduleOrder
        .map((module) => ({
          module,
          keys: menuOrderWithinModule[module].filter((key) =>
            visibleKeys.includes(key),
          ),
        }))
        .filter((section) => section.keys.length > 0),
    [visibleKeys],
  );

  const handleNavigate = useCallback(
    () => setMobileOpen(false),
    [setMobileOpen],
  );
  const handleExpandRequest = useCallback(
    () => setCollapsed(false),
    [setCollapsed],
  );

  return (
    <>
      {/* Desktop / Tablet Sidebar — lebar diatur oleh `collapsed` (lihat sidebar-provider.tsx) */}
      <TooltipProvider delayDuration={300}>
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-background transition-[width] duration-200 ease-in-out motion-reduce:transition-none md:flex",
            collapsed ? "md:w-[4.5rem]" : "md:w-64",
          )}
        >
          <div
            className={cn(
              "flex h-14 shrink-0 items-center border-b border-border sm:h-16",
              collapsed ? "justify-center px-2" : "px-4",
            )}
          >
            <BrandHeader email={user?.email} collapsed={collapsed} />
          </div>

          <SidebarNavController
            key={`desktop-${pathname}`}
            sections={sections}
            loading={loading}
            pathname={pathname}
            collapsed={collapsed}
            onExpandRequest={handleExpandRequest}
            searchTrailing={
              // Tombol ciutkan diletakkan sejajar dengan kolom pencarian.
              <CollapseToggle
                collapsed={collapsed}
                onToggle={toggleCollapsed}
              />
            }
          />

          {collapsed && (
            <div className="flex items-center justify-center border-t border-border py-2">
              <CollapseToggle
                collapsed={collapsed}
                onToggle={toggleCollapsed}
              />
            </div>
          )}
        </aside>
      </TooltipProvider>

      {/* Mobile Sidebar (Sheet Drawer) — selalu tampil penuh (tidak ikut mode collapsed) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
          <SheetDescription className="sr-only">
            Navigasi aplikasi UKM Robotik PNP
          </SheetDescription>

          <div className="flex h-full flex-col">
            <div className="flex h-14 items-center border-b border-border px-4">
              {/* Gear disembunyikan di sini: ruang kanan dipakai tombol tutup (X)
                  Sheet. Pintasan settings dirender di samping kolom pencarian. */}
              <BrandHeader
                email={user?.email}
                collapsed={false}
                onClick={handleNavigate}
                showSettingsLink={false}
              />
            </div>

            <SidebarNavController
              key={`mobile-${pathname}`}
              sections={sections}
              loading={loading}
              pathname={pathname}
              collapsed={false}
              onNavigate={handleNavigate}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
