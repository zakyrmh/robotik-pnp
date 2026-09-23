"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  Calendar03Icon,
  CalendarCheckIn01Icon,
  File01Icon,
  Alert01Icon,
  CleanIcon,
  Settings02Icon,
  UserGroupIcon,
  UserMultiple02Icon,
  Briefcase02Icon,
  UserSettings01Icon,
  Audit01Icon,
  WorkflowSquare01Icon,
  Award01Icon,
  Search01Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
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
// ─────────────────────────────────────────────────────────────
const allMenuItems = {
  dashboard: {
    title: "Dashboard",
    href: "/dashboard",
    icon: DashboardSquare01Icon,
    module: "governance" as ModuleKey,
    adminOnly: false,
    searchTerms: "beranda utama ringkasan",
  },
  manajemenStruktur: {
    title: "Manajemen Struktur",
    href: "/manajemen-struktur",
    icon: WorkflowSquare01Icon,
    module: "governance" as ModuleKey,
    adminOnly: true,
    searchTerms: "bagan pengurus jabatan divisi organisasi",
  },
  manajemenAkun: {
    title: "Manajemen Akun",
    href: "/manajemen-akun",
    icon: UserSettings01Icon,
    module: "governance" as ModuleKey,
    adminOnly: true,
    searchTerms: "pengguna user role hak akses login akun",
  },
  auditLogSistem: {
    title: "Audit Log Sistem",
    href: "/audit-log",
    icon: Audit01Icon,
    module: "governance" as ModuleKey,
    adminOnly: true,
    searchTerms: "log rekam jejak mutasi keamanan jejak audit",
  },

  kegiatan: {
    title: "Kegiatan",
    href: "/kegiatan",
    icon: Calendar03Icon,
    module: "kedisiplinan" as ModuleKey,
    adminOnly: false,
    searchTerms: "sesi agenda jadwal acara qr presensi",
  },
  presensi: {
    title: "Presensi",
    href: "/presensi",
    icon: CalendarCheckIn01Icon,
    module: "kedisiplinan" as ModuleKey,
    adminOnly: false,
    searchTerms: "kehadiran absen hadir alpha scan",
  },
  perizinan: {
    title: "Perizinan",
    href: "/perizinan",
    icon: File01Icon,
    module: "kedisiplinan" as ModuleKey,
    adminOnly: true,
    searchTerms: "izin sakit dispensasi permohonan cuti",
  },
  kedisiplinan: {
    title: "Kedisiplinan",
    href: "/kedisiplinan",
    icon: Alert01Icon,
    module: "kedisiplinan" as ModuleKey,
    adminOnly: true,
    searchTerms: "poin pelanggaran sanksi sp surat peringatan",
  },

  piket: {
    title: "Piket",
    href: "/piket",
    icon: CleanIcon,
    module: "kebersihan" as ModuleKey,
    adminOnly: false,
    searchTerms: "shift lab laboratorium jadwal bersih denda",
  },

  dashboardPendaftaranCaang: {
    title: "Dashboard Pendaftaran",
    href: "/dashboard-pendaftaran-caang",
    icon: DashboardSquare01Icon,
    module: "openRecruitment" as ModuleKey,
    adminOnly: false,
    searchTerms: "rekap pendaftar oprec gelombang statistik",
  },
  manajemenCaang: {
    title: "Manajemen Caang",
    href: "/manajemen-caang",
    icon: UserGroupIcon,
    module: "openRecruitment" as ModuleKey,
    adminOnly: false,
    searchTerms: "calon anggota seleksi wawancara evaluasi kandidat",
  },
  manajemenKelompokCaang: {
    title: "Manajemen Kelompok",
    href: "/manajemen-kelompok",
    icon: UserMultiple02Icon,
    module: "openRecruitment" as ModuleKey,
    adminOnly: false,
    searchTerms: "kelompok mentoring pembinaan gugus caang",
  },
  manajemenMagang: {
    title: "Manajemen Magang",
    href: "/manajemen-magang",
    icon: Briefcase02Icon,
    module: "openRecruitment" as ModuleKey,
    adminOnly: false,
    searchTerms: "internship robotika magang logbook penilaian",
  },
  pengaturanOr: {
    title: "Pengaturan OR",
    href: "/pengaturan-or",
    icon: Settings02Icon,
    module: "openRecruitment" as ModuleKey,
    adminOnly: true,
    searchTerms: "konfigurasi oprec gelombang window pendaftaran",
  },

  manajemenEvent: {
    title: "Manajemen Event",
    href: "/manajemen-event",
    icon: Award01Icon,
    module: "mrc" as ModuleKey,
    adminOnly: false,
    searchTerms: "mrc lomba kompetisi pendaftaran verifikasi tiket",
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
  "panitia-pendaftaran": ["dashboard", "manajemenEvent"],
  "panitia-verifikasi": ["dashboard", "manajemenEvent"],
  "panitia-pertandingan": ["dashboard", "manajemenEvent"],
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
    "manajemenEvent",
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
  mrc: ["manajemenEvent"],
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

function isActiveLink(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
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
// Brand header — logo + nama unit + email akun, meniru blok
// identitas workspace pada referensi.
// ─────────────────────────────────────────────────────────────
function BrandHeader({
  email,
  onClick,
}: {
  email?: string;
  onClick?: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
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
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <HugeiconsIcon icon={Settings02Icon} size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Search field — filter menu lintas modul + shortcut ⌘K / Ctrl+K.
// ─────────────────────────────────────────────────────────────
function SidebarSearch({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const isMac = useIsMac();

  return (
    <div className="relative">
      <HugeiconsIcon
        icon={Search01Icon}
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
        className="h-9 w-full rounded-md border border-input bg-input/20 pr-14 pl-9 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:appearance-none"
      />
      <kbd
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-0.5 rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono text-micro font-medium text-muted-foreground"
      >
        {isMac ? "⌘" : "Ctrl"} K
      </kbd>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NavLink — baris menu. Garis vertikal tipis di left-0 menandai
// posisi dalam pohon modul; item aktif mengisi garis itu dengan warna brand.
// ─────────────────────────────────────────────────────────────
function NavLink({
  itemKey,
  isActive,
  badgeCount,
  badgeTone = "default",
  onClick,
}: {
  itemKey: MenuKey;
  isActive: boolean;
  badgeCount?: number;
  badgeTone?: "default" | "warning";
  onClick?: () => void;
}) {
  const item = allMenuItems[itemKey];

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex min-h-[44px] items-center gap-2.5 rounded-md py-2 pr-2.5 pl-4 text-sm transition-colors duration-150 before:absolute before:inset-y-1 before:left-0 before:w-px before:rounded-full before:bg-border before:transition-colors",
        isActive
          ? "bg-primary-soft font-semibold text-primary before:bg-primary"
          : "text-foreground/80 hover:bg-muted hover:text-foreground before:group-hover:bg-primary/40",
      )}
    >
      <HugeiconsIcon
        icon={item.icon}
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
      {typeof badgeCount === "number" && badgeCount > 0 && (
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
          {badgeCount > 99 ? "99+" : badgeCount}
        </Badge>
      )}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// ModuleSectionBlock — satu modul sebagai grup yang bisa dilipat.
// Header memakai eyebrow mono + caret; kontennya adalah daftar menu.
// ─────────────────────────────────────────────────────────────
function ModuleSectionBlock({
  section,
  pathname,
  expanded,
  onToggle,
  badgeCounts,
  onNavigate,
}: {
  section: ModuleSection;
  pathname: string;
  expanded: boolean;
  onToggle: (module: ModuleKey, open: boolean) => void;
  badgeCounts?: Partial<Record<MenuKey, number>>;
  onNavigate?: () => void;
}) {
  const group = moduleGroups[section.module];
  const hasActive = section.keys.some((key) =>
    isActiveLink(pathname, allMenuItems[key].href),
  );

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
          <HugeiconsIcon
            icon={expanded ? ArrowDown01Icon : ArrowRight01Icon}
            size={14}
            aria-hidden="true"
            className={cn(
              "shrink-0 transition-colors",
              hasActive
                ? "text-primary"
                : "text-muted-foreground group-hover:text-foreground",
            )}
          />
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
                badgeCount={badgeCounts?.[key]}
                badgeTone={
                  key === "kedisiplinan" || key === "manajemenEvent"
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

function SidebarSkeleton() {
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
  query,
  onQueryChange,
  searchInputRef,
  badgeCounts,
  onNavigate,
}: {
  sections: ModuleSection[];
  loading: boolean;
  pathname: string;
  query: string;
  onQueryChange: (value: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  badgeCounts?: Partial<Record<MenuKey, number>>;
  onNavigate?: () => void;
}) {
  // Default semua modul terbuka; perubahan manual pengguna disimpan sebagai override.
  const [collapsedOverrides, setCollapsedOverrides] = useState<Set<ModuleKey>>(
    () => new Set(),
  );

  const isSearching = query.trim().length > 0;

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
      className="flex flex-1 flex-col gap-3 overflow-hidden"
    >
      <div className="px-3">
        <SidebarSearch
          value={query}
          onChange={onQueryChange}
          inputRef={searchInputRef}
        />
      </div>

      {loading ? (
        <SidebarSkeleton />
      ) : (
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {filteredSections.length === 0 ? (
            <p className="px-2.5 py-6 text-center text-xs text-muted-foreground">
              Tidak ada menu yang cocok dengan{" "}
              <span className="font-medium text-foreground">
                &ldquo;{query.trim()}&rdquo;
              </span>
              .
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filteredSections.map((section) => (
                <ModuleSectionBlock
                  key={section.module}
                  section={section}
                  pathname={pathname}
                  expanded={isExpanded(section.module)}
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
  badgeCounts,
  onNavigate,
}: {
  sections: ModuleSection[];
  loading: boolean;
  pathname: string;
  badgeCounts?: Partial<Record<MenuKey, number>>;
  onNavigate?: () => void;
}) {
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Shortcut ⌘K / Ctrl+K memfokuskan kolom pencarian menu.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SidebarNav
      sections={sections}
      loading={loading}
      pathname={pathname}
      query={query}
      onQueryChange={setQuery}
      searchInputRef={searchInputRef}
      badgeCounts={badgeCounts}
      onNavigate={onNavigate}
    />
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Sync mobile menu toggling from Header
  useEffect(() => {
    const handleToggle = () => setIsMobileOpen((prev) => !prev);
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

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

  const handleNavigate = useCallback(() => setIsMobileOpen(false), []);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-background lg:flex">
        <div className="flex h-14 items-center border-b border-border px-4 sm:h-16">
          <BrandHeader email={user?.email} />
        </div>

        <SidebarNavController
          key={`desktop-${pathname}`}
          sections={sections}
          loading={loading}
          pathname={pathname}
        />
      </aside>

      {/* Mobile Sidebar (Sheet Drawer) */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
          <SheetDescription className="sr-only">
            Navigasi aplikasi UKM Robotik PNP
          </SheetDescription>

          <div className="flex h-full flex-col">
            <div className="flex h-14 items-center border-b border-border px-4">
              <BrandHeader email={user?.email} onClick={handleNavigate} />
            </div>

            <SidebarNavController
              key={`mobile-${pathname}`}
              sections={sections}
              loading={loading}
              pathname={pathname}
              onNavigate={handleNavigate}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
