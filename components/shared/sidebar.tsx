"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
  ClipboardCheck,
  Users,
  UsersRound,
  Briefcase,
  Settings,
  Trophy,
  CalendarRange,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useMemo, useCallback } from "react";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/shared/sidebar-provider";

// ─────────────────────────────────────────────────────────────
// Modul — tiap kelompok menu mewakili satu domain tanggung jawab nyata.
// Judul section mengodekan struktur organisasi, bukan dekorasi.
// ─────────────────────────────────────────────────────────────
const moduleGroups = {
  governance: {
    title: "Governance",
  },
  kedisiplinan: {
    title: "Kedisiplinan",
  },
  kebersihan: {
    title: "Kebersihan",
  },
  openRecruitment: {
    title: "Open Recruitment",
  },
  mrc: {
    title: "Minangkabau Robot Contest",
  },
} as const;

type ModuleKey = keyof typeof moduleGroups;

// ─────────────────────────────────────────────────────────────
// Katalog menu — sumber tunggal untuk metadata, ikon, modul & gating.
// `adminOnly` = hanya super-admin.
// `kestariOnly` = hanya super-admin & admin-kestari.
// Ikon memakai lucide-react (lihat DESIGN.md §9 — Ikon & Ilustrasi).
// ─────────────────────────────────────────────────────────────
interface MenuItem {
  title: string;
  href: string;
  icon: LucideIcon;
  module: ModuleKey;
  adminOnly: boolean;
  kestariOnly?: boolean;
}

const allMenuItems = {
  dashboard: {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    module: "governance" as ModuleKey,
    adminOnly: false,
  },
  manajemenStruktur: {
    title: "Manajemen Struktur",
    href: "/manajemen-struktur",
    icon: Workflow,
    module: "governance" as ModuleKey,
    adminOnly: true,
  },
  manajemenAkun: {
    title: "Manajemen Akun",
    href: "/manajemen-akun",
    icon: UserCog,
    module: "governance" as ModuleKey,
    adminOnly: true,
  },
  auditLogSistem: {
    title: "Audit Log Sistem",
    href: "/audit-log",
    icon: ScrollText,
    module: "governance" as ModuleKey,
    adminOnly: true,
  },

  kegiatan: {
    title: "Kegiatan",
    href: "/kegiatan",
    icon: CalendarDays,
    module: "kedisiplinan" as ModuleKey,
    adminOnly: false,
  },
  presensi: {
    title: "Presensi",
    href: "/presensi",
    icon: CalendarCheck2,
    module: "kedisiplinan" as ModuleKey,
    adminOnly: false,
  },
  perizinan: {
    title: "Perizinan",
    href: "/perizinan",
    icon: FileText,
    module: "kedisiplinan" as ModuleKey,
    adminOnly: true,
  },
  kedisiplinan: {
    title: "Kedisiplinan",
    href: "/kedisiplinan",
    icon: AlertTriangle,
    module: "kedisiplinan" as ModuleKey,
    adminOnly: true,
  },

  piket: {
    title: "Piket",
    href: "/piket",
    icon: SprayCan,
    module: "kebersihan" as ModuleKey,
    adminOnly: false,
  },
  piketVerifikasi: {
    title: "Verifikasi Piket",
    href: "/piket/verifikasi",
    icon: ClipboardCheck,
    module: "kebersihan" as ModuleKey,
    adminOnly: false,
    kestariOnly: true,
  },
  piketKelola: {
    title: "Kelola Piket",
    href: "/piket/kelola",
    icon: Settings,
    module: "kebersihan" as ModuleKey,
    adminOnly: false,
    kestariOnly: true,
  },

  dashboardPendaftaranCaang: {
    title: "Dashboard Pendaftaran",
    href: "/dashboard-pendaftaran-caang",
    icon: ClipboardList,
    module: "openRecruitment" as ModuleKey,
    adminOnly: false,
  },
  manajemenCaang: {
    title: "Manajemen Caang",
    href: "/manajemen-caang",
    icon: Users,
    module: "openRecruitment" as ModuleKey,
    adminOnly: false,
  },
  manajemenKelompokCaang: {
    title: "Manajemen Kelompok",
    href: "/manajemen-kelompok",
    icon: UsersRound,
    module: "openRecruitment" as ModuleKey,
    adminOnly: false,
  },
  manajemenMagang: {
    title: "Manajemen Magang",
    href: "/manajemen-magang",
    icon: Briefcase,
    module: "openRecruitment" as ModuleKey,
    adminOnly: false,
  },
  pengaturanOr: {
    title: "Pengaturan OR",
    href: "/pengaturan-or",
    icon: Settings,
    module: "openRecruitment" as ModuleKey,
    adminOnly: true,
  },

  mrcDashboard: {
    title: "Dashboard MRC",
    href: "/manajemen-event",
    icon: LayoutDashboard,
    module: "mrc" as ModuleKey,
    adminOnly: false,
  },
  mrcPendaftaran: {
    title: "Data Pendaftar",
    href: "/manajemen-event/pendaftaran",
    icon: ClipboardList,
    module: "mrc" as ModuleKey,
    adminOnly: false,
  },
  mrcKategori: {
    title: "Kategori Lomba",
    href: "/manajemen-event/kategori",
    icon: Trophy,
    module: "mrc" as ModuleKey,
    adminOnly: false,
  },
  mrcTimeline: {
    title: "Timeline Acara",
    href: "/manajemen-event/timeline",
    icon: CalendarRange,
    module: "mrc" as ModuleKey,
    adminOnly: false,
  },
  mrcPembayaran: {
    title: "Metode Pembayaran",
    href: "/manajemen-event/pembayaran",
    icon: CreditCard,
    module: "mrc" as ModuleKey,
    adminOnly: false,
  },
} satisfies Record<string, MenuItem>;

type MenuKey = keyof typeof allMenuItems;

// ─────────────────────────────────────────────────────────────
// Otorisasi: daftar menu yang boleh diakses tiap role.
// ─────────────────────────────────────────────────────────────
const roleMenuKeys: Record<string, MenuKey[]> = {
  caang: ["dashboard", "kegiatan", "presensi", "manajemenMagang"],
  anggota: ["dashboard", "kegiatan", "presensi", "piket"],
  "admin-divisi": ["dashboard", "kegiatan", "presensi", "piket"],
  "admin-kestari": [
    "dashboard",
    "kegiatan",
    "presensi",
    "piket",
    "piketVerifikasi",
    "piketKelola",
  ],
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
    "piketVerifikasi",
    "piketKelola",
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
  kebersihan: ["piket", "piketVerifikasi", "piketKelola"],
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

// Aturan visibilitas tunggal: item `adminOnly` hanya untuk super-admin,
// item `kestariOnly` hanya untuk super-admin & admin-kestari.
function resolveVisibleKeys(
  role: string | undefined,
  isOnboarded: boolean | undefined,
): MenuKey[] {
  if (isOnboarded === false) return ["dashboard"];
  const base: MenuKey[] =
    role && roleMenuKeys[role] ? roleMenuKeys[role] : ["dashboard"];
  return base.filter((key) => {
    const item = allMenuItems[key] as {
      adminOnly?: boolean;
      kestariOnly?: boolean;
    };
    if (item.adminOnly && role !== "super-admin") return false;
    if (item.kestariOnly && role !== "super-admin" && role !== "admin-kestari")
      return false;
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

// ─────────────────────────────────────────────────────────────
// Tokoh gerak diselaraskan dengan DESIGN.md §11 (Motion):
// - `SIDEBAR_SPRING`  → transisi lebar rail (≈200ms, terasa presisi & tidak "karet").
// - `FADE_FAST`       → gerak mikro untuk label/ikon saat rail melebar.
// Semua animasi tunduk pada `prefers-reduced-motion` lewat `useReducedMotion()`.
// ─────────────────────────────────────────────────────────────
const SIDEBAR_SPRING = {
  type: "spring",
  stiffness: 320,
  damping: 34,
  mass: 0.9,
} as const;

const FADE_FAST = { duration: 0.16, ease: [0.16, 1, 0.3, 1] } as const;

// ─────────────────────────────────────────────────────────────
// Brand header — logo + nama unit + email akun. Saat rail minimized,
// hanya logo yang tampil (di-tooltip-kan) agar tidak overflow di 72px.
// Tombol ciutkan/perluas dirender di sini (sebelah brand) pada desktop.
// ─────────────────────────────────────────────────────────────
function BrandHeader({
  email,
  collapsed,
  onClick,
  trailing,
  showSettingsLink = true,
}: {
  email?: string;
  collapsed: boolean;
  onClick?: () => void;
  /** Kendali (mis. tombol ciutkan) yang dijejerkan di ujung kanan header. */
  trailing?: React.ReactNode;
  /**
   * Tampilkan pintasan gear ke `/settings`.
   * Dimatikan pada drawer mobile karena posisi kanan ditempati tombol tutup
   * (X) bawaan Sheet — keduanya akan saling menumpuk bila dirender bersamaan.
   */
  showSettingsLink?: boolean;
}) {
  const reduceMotion = !!useReducedMotion();

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
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={FADE_FAST}
        className="min-w-0 flex-1"
      >
        <p className="truncate font-display text-sm font-semibold tracking-tight text-foreground">
          Robotik PNP
        </p>
        <p className="truncate font-mono text-micro text-muted-foreground">
          {email || "memuat akun…"}
        </p>
      </motion.div>
      {showSettingsLink && (
        <Link
          href="/settings"
          onClick={onClick}
          aria-label="Buka pengaturan akun"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Settings size={16} aria-hidden="true" />
        </Link>
      )}
      {trailing}
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

// Nada badge per-item: dua menu ini menandakan pekerjaan yang menunggu tindakan.
function badgeToneFor(key: MenuKey): "default" | "warning" {
  return key === "kedisiplinan" || key === "mrcPendaftaran"
    ? "warning"
    : "default";
}

// ─────────────────────────────────────────────────────────────
// ModuleSectionBlock — satu modul sebagai grup yang SELALU terbuka.
// Header memakai eyebrow mono kecil; kontennya adalah daftar menu.
// Saat rail minimized, header modul disembunyikan dan menu dirender rata
// dengan pembatas tipis antar-modul.
// ─────────────────────────────────────────────────────────────
function ModuleSectionBlock({
  section,
  pathname,
  collapsed,
  isFirst,
  badgeCounts,
  onNavigate,
}: {
  section: ModuleSection;
  pathname: string;
  collapsed: boolean;
  isFirst: boolean;
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
              badgeTone={badgeToneFor(key)}
              onClick={onNavigate}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section
      role="group"
      aria-label={group.title}
      className={cn(
        "flex flex-col",
        !isFirst && "mt-4 border-t border-border pt-4",
      )}
    >
      <header className="px-2.5 pb-1.5">
        {/*
          Ukuran font (`text-nano`) sengaja ditulis di luar `cn()` karena
          tailwind-merge tidak mengenali token `--text-*` kustom dan akan
          membuangnya saat di-merge dengan utilitas `text-<warna>` — sehingga
          ukurannya diam-diam jatuh ke font-size bawaan.
        */}
        <span
          className={`block truncate font-mono text-nano font-semibold uppercase tracking-widest transition-colors ${cn(
            hasActive ? "text-primary" : "text-muted-foreground",
          )}`}
        >
          {group.title}
        </span>
      </header>

      <div className="flex flex-col gap-0.5">
        {section.keys.map((key) => (
          <NavLink
            key={key}
            itemKey={key}
            isActive={isActiveLink(pathname, allMenuItems[key].href)}
            collapsed={false}
            badgeCount={badgeCounts?.[key]}
            badgeTone={badgeToneFor(key)}
            onClick={onNavigate}
          />
        ))}
      </div>
    </section>
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
    <div className="flex flex-1 flex-col gap-5 overflow-hidden p-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-2.5 w-28" />
          <div className="mt-1 flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5 pl-4">
              <Skeleton className="size-4 rounded-sm" />
              <Skeleton className="h-3.5 w-28" />
            </div>
            <div className="flex items-center gap-2.5 pl-4">
              <Skeleton className="size-4 rounded-sm" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SidebarNav — daftar modul statis (selalu terbuka). Tidak lagi memegang
// state pencarian maupun lipatan grup: sumbernya murni `sections` hasil
// otorisasi role.
// ─────────────────────────────────────────────────────────────
function SidebarNav({
  sections,
  loading,
  pathname,
  collapsed,
  badgeCounts,
  onNavigate,
}: {
  sections: ModuleSection[];
  loading: boolean;
  pathname: string;
  collapsed: boolean;
  badgeCounts?: Partial<Record<MenuKey, number>>;
  onNavigate?: () => void;
}) {
  return (
    <nav
      aria-label="Navigasi utama"
      className="flex flex-1 flex-col overflow-hidden pt-2"
    >
      {loading ? (
        <SidebarSkeleton collapsed={collapsed} />
      ) : (
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          <div className={cn("flex flex-col", collapsed ? "gap-0" : "gap-0.5")}>
            {sections.map((section, index) => (
              <ModuleSectionBlock
                key={section.module}
                section={section}
                pathname={pathname}
                collapsed={collapsed}
                isFirst={index === 0}
                badgeCounts={badgeCounts}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────
// Tombol minimize/expand — hanya tampil dari breakpoint md ke atas.
// Diletakkan menyatu di header brand (sebelah brand) saat expanded,
// dan di bawah logo saat collapsed (lebih mudah dijangkau).
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
  const reduceMotion = useReducedMotion();
  const label = collapsed ? "Perluas sidebar" : "Ciutkan sidebar";

  return (
    <div className="hidden md:flex">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            aria-label={label}
            aria-expanded={!collapsed}
            className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={collapsed ? "expanded" : "collapsed"}
                initial={reduceMotion ? false : { opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, rotate: 90 }}
                transition={FADE_FAST}
                className="flex items-center justify-center"
              >
                {collapsed ? (
                  <PanelLeftOpen size={16} aria-hidden="true" />
                ) : (
                  <PanelLeftClose size={16} aria-hidden="true" />
                )}
              </motion.span>
            </AnimatePresence>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    </div>
  );
}

export function Sidebar({
  badgeCounts,
}: {
  /** Jumlah item menunggu tindakan per menu (ditentukan server di layout). */
  badgeCounts?: Partial<Record<MenuKey, number>>;
} = {}) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const reduceMotion = useReducedMotion();
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } =
    useSidebar();

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

  return (
    <>
      {/* Desktop / Tablet Sidebar — lebar dianimasikan via framer-motion.
          Sumber kebenaran status tetap `collapsed` (lihat sidebar-provider.tsx). */}
      <TooltipProvider delayDuration={300}>
        <motion.aside
          initial={false}
          animate={{ width: collapsed ? 72 : 256 }}
          transition={reduceMotion ? { duration: 0 } : SIDEBAR_SPRING}
          className="fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden border-r border-border bg-background md:flex"
        >
          <div
            className={cn(
              "flex h-14 shrink-0 items-center gap-2 border-b border-border sm:h-16",
              collapsed ? "justify-center px-2" : "px-4",
            )}
          >
            <BrandHeader
              email={user?.email}
              collapsed={collapsed}
              trailing={
                <CollapseToggle
                  collapsed={collapsed}
                  onToggle={toggleCollapsed}
                />
              }
            />
          </div>

          <SidebarNav
            sections={sections}
            loading={loading}
            pathname={pathname}
            collapsed={collapsed}
            badgeCounts={badgeCounts}
          />

          {collapsed && (
            <div className="flex items-center justify-center border-t border-border py-2">
              <CollapseToggle
                collapsed={collapsed}
                onToggle={toggleCollapsed}
              />
            </div>
          )}
        </motion.aside>
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
                  Sheet. Pintasan settings tersedia di halaman pengaturan. */}
              <BrandHeader
                email={user?.email}
                collapsed={false}
                onClick={handleNavigate}
                showSettingsLink={false}
              />
            </div>

            <SidebarNav
              sections={sections}
              loading={loading}
              pathname={pathname}
              collapsed={false}
              badgeCounts={badgeCounts}
              onNavigate={handleNavigate}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
