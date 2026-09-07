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
  Task01Icon,
  Briefcase01Icon,
  CleanIcon,
  Settings02Icon,
  UserGroupIcon,
  CalendarAdd01Icon,
  UserMultiple02Icon,
  Briefcase02Icon,
  UserSettings01Icon,
  Audit01Icon,
  WorkflowSquare01Icon,
} from "@hugeicons/core-free-icons";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";

// Map of all possible menu items
const allMenuItems = {
  dashboard: {
    title: "Dashboard",
    href: "/dashboard",
    icon: DashboardSquare01Icon,
  },
  kegiatan: {
    title: "Kegiatan",
    href: "/kegiatan",
    icon: Calendar03Icon,
  },
  presensi: {
    title: "Presensi",
    href: "/presensi",
    icon: CalendarCheckIn01Icon,
  },
  perizinan: {
    title: "Perizinan",
    href: "/perizinan",
    icon: File01Icon,
  },
  kedisiplinan: {
    title: "Kedisiplinan",
    href: "/kedisiplinan",
    icon: Alert01Icon,
  },
  tugas: {
    title: "Tugas",
    href: "/tugas",
    icon: Task01Icon,
  },
  magang: {
    title: "Magang",
    href: "/magang",
    icon: Briefcase01Icon,
  },
  piket: {
    title: "Piket",
    href: "/piket",
    icon: CleanIcon,
  },
  pengaturanOr: {
    title: "Pengaturan OR",
    href: "/pengaturan-or",
    icon: Settings02Icon,
  },
  manajemenCaang: {
    title: "Manajemen Caang",
    href: "/manajemen-caang",
    icon: UserGroupIcon,
  },
  manajemenKelompokCaang: {
    title: "Manajemen Kelompok",
    href: "/manajemen-kelompok",
    icon: UserMultiple02Icon,
  },
  manajemenMagang: {
    title: "Manajemen Magang",
    href: "/manajemen-magang",
    icon: Briefcase02Icon,
  },
  manajemenAkun: {
    title: "Manajemen Akun",
    href: "/manajemen-akun",
    icon: UserSettings01Icon,
  },
  auditLogSistem: {
    title: "Audit Log Sistem",
    href: "/audit-log",
    icon: Audit01Icon,
  },
  manajemenStruktur: {
    title: "Manajemen Struktur",
    href: "/manajemen-struktur",
    icon: WorkflowSquare01Icon,
  },
} as const;

// Define which roles have access to which menu items
const roleMenuKeys: Record<string, (keyof typeof allMenuItems)[]> = {
  caang: ["dashboard", "kegiatan", "presensi", "tugas", "magang"],
  anggota: ["dashboard", "kegiatan", "presensi", "piket"],
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
    "pengaturanOr",
    "manajemenCaang",
    "manajemenKelompokCaang",
    "manajemenMagang",
    "kegiatan",
    "presensi",
    "piket",
  ],
  "super-admin": [
    "dashboard",
    "pengaturanOr",
    "manajemenCaang",
    "manajemenKelompokCaang",
    "manajemenMagang",
    "kegiatan",
    "presensi",
    "perizinan",
    "kedisiplinan",
    "piket",
    "manajemenStruktur",
    "manajemenAkun",
    "auditLogSistem",
  ],
};

type MenuKey = keyof typeof allMenuItems;

interface Section {
  title: string;
  keys: MenuKey[];
}

function isActiveLink(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

function BrandLink({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/dashboard"
      onClick={onClick}
      className="flex min-w-0 items-center gap-2.5"
    >
      <Image
        src="/images/logo-ukm-robotik-pnp.webp"
        alt="Logo UKM Robotik PNP"
        width={32}
        height={32}
        priority
        className="size-8 shrink-0 object-contain"
      />
      <span className="truncate font-display text-sm font-semibold tracking-tight text-foreground">
        ROBOTIK PNP
      </span>
    </Link>
  );
}

function NavLink({
  item,
  isActive,
  onClick,
}: {
  item: (typeof allMenuItems)[MenuKey];
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 overflow-hidden rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary-soft font-semibold text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {isActive && (
        <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" />
      )}
      <HugeiconsIcon
        icon={item.icon}
        size={18}
        className={cn(
          "shrink-0 transition-colors",
          isActive
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      />
      <span className="truncate">{item.title}</span>
    </Link>
  );
}

function SidebarNav({
  sections,
  loading,
  pathname,
  onNavigate,
}: {
  sections: Section[];
  loading: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  if (loading) {
    return (
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-2.5 px-3 py-2">
              <Skeleton className="size-5 rounded-md" />
              <Skeleton className="h-3.5 w-28" />
            </div>
          ))}
        </div>
      </nav>
    );
  }

  const hasMultipleSections =
    sections.filter((s) => s.keys.length > 0).length > 1;

  return (
    <nav className="flex-1 overflow-y-auto p-3">
      <div className="flex flex-col gap-4">
        {sections.map((section) => {
          if (section.keys.length === 0) return null;

          return (
            <div key={section.title} className="flex flex-col gap-1">
              {hasMultipleSections && (
                <p className="px-3 pb-1 text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                  {section.title}
                </p>
              )}
              {section.keys.map((key) => {
                const item = allMenuItems[key];
                return (
                  <NavLink
                    key={item.href}
                    item={item}
                    isActive={isActiveLink(pathname, item.href)}
                    onClick={onNavigate}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

function SettingsLink({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/settings"
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <HugeiconsIcon icon={Settings02Icon} size={18} className="shrink-0" />
      <span>Pengaturan</span>
    </Link>
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

  let menuKeys = (
    role && roleMenuKeys[role] ? roleMenuKeys[role] : ["dashboard"]
  ) as MenuKey[];

  // RBAC Gating: non-onboarded user should only see dashboard
  if (isOnboarded === false) {
    menuKeys = ["dashboard"];
  }

  const sections: Section[] = [
    {
      title: "Keanggotaan UKM",
      keys: (
        [
          "dashboard",
          "kegiatan",
          "presensi",
          "perizinan",
          "kedisiplinan",
          "tugas",
          "magang",
          "piket",
          "manajemenStruktur",
          "manajemenAkun",
          "auditLogSistem",
        ] as MenuKey[]
      ).filter((key) => menuKeys.includes(key)),
    },
    {
      title: "Open Recruitment",
      keys: (
        [
          "pengaturanOr",
          "manajemenCaang",
          "manajemenKelompokCaang",
          "manajemenMagang",
        ] as MenuKey[]
      ).filter((key) => menuKeys.includes(key)),
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-background lg:flex">
        <div className="flex h-14 items-center border-b border-border px-4 sm:h-16">
          <BrandLink />
        </div>

        <SidebarNav sections={sections} loading={loading} pathname={pathname} />

        <div className="border-t border-border p-3">
          <SettingsLink />
        </div>
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
              <BrandLink onClick={() => setIsMobileOpen(false)} />
            </div>

            <SidebarNav
              sections={sections}
              loading={loading}
              pathname={pathname}
              onNavigate={() => setIsMobileOpen(false)}
            />

            <div className="border-t border-border p-3">
              <SettingsLink onClick={() => setIsMobileOpen(false)} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
