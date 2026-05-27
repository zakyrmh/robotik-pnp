"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  Calendar03Icon,
  CalendarCheckIn01Icon,
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
} from "@hugeicons/core-free-icons";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

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
  absensi: {
    title: "Absensi",
    href: "/absensi",
    icon: CalendarCheckIn01Icon,
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
  kegiatanAbsensiCaang: {
    title: "Kegiatan & Absensi Caang",
    href: "/kegiatan-absensi-caang",
    icon: CalendarAdd01Icon,
  },
  manajemenKelompokCaang: {
    title: "Manajemen Kelompok Caang",
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
} as const;

// Define which roles have access to which menu items (keys of allMenuItems)
const roleMenuKeys: Record<string, (keyof typeof allMenuItems)[]> = {
  caang: ["dashboard", "kegiatan", "absensi", "tugas", "magang"],
  anggota: ["dashboard", "kegiatan", "absensi", "piket"],
  "admin-komdis": ["dashboard", "kegiatan", "absensi", "piket"],
  "admin-or": [
    "dashboard",
    "pengaturanOr",
    "manajemenCaang",
    "kegiatanAbsensiCaang",
    "manajemenKelompokCaang",
    "manajemenMagang",
    "kegiatan",
    "absensi",
    "piket",
  ],
  "super-admin": [
    "dashboard",
    "pengaturanOr",
    "manajemenCaang",
    "kegiatanAbsensiCaang",
    "manajemenKelompokCaang",
    "manajemenMagang",
    "kegiatan",
    "absensi",
    "piket",
    "manajemenAkun",
    "auditLogSistem",
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const role = user?.role;
  const isOnboarded = user?.is_onboarded;

  let menuKeys = (role && roleMenuKeys[role]
    ? roleMenuKeys[role]
    : ["dashboard"]) as (keyof typeof allMenuItems)[];

  if (isOnboarded === false) {
    menuKeys = ["dashboard"];
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/50 bg-card/30 backdrop-blur-xl lg:flex">
      {/* Brand Logo */}
      <div className="flex h-16 items-center border-b border-border/50 px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-auto w-8 items-center gap-3">
            <Image
              src="/images/logo-ukm-robotik-pnp.webp"
              alt="Logo UKM Robotik PNP"
              width={150}
              height={150}
              priority
            />
          </div>
          <span className="font-bold tracking-tight text-foreground">
            Robotik PNP
          </span>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {loading ? (
          // Skeleton Loader while fetching user/role details
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
              >
                <div className="h-5 w-5 animate-pulse rounded-md bg-muted/60" />
                <div className="h-4 w-28 animate-pulse rounded-md bg-muted/60" />
              </div>
            ))}
          </div>
        ) : (
          menuKeys.map((key) => {
            const item = allMenuItems[key];
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  size={20}
                  className={cn(
                    "transition-colors",
                    isActive
                      ? "text-indigo-500"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                {item.title}
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                )}
              </Link>
            );
          })
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-border/50 p-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
        >
          <HugeiconsIcon icon={Settings02Icon} size={20} />
          Pengaturan
        </Link>
      </div>
    </aside>
  );
}

