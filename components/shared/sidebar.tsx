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
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

// Define which roles have access to which menu items
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
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sync mobile menu toggling from Header
  useEffect(() => {
    const handleToggle = () => setIsMobileOpen((prev) => !prev);
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  // Client-side mount flag
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const role = user?.role;
  const isOnboarded = user?.is_onboarded;

  let menuKeys = (role && roleMenuKeys[role]
    ? roleMenuKeys[role]
    : ["dashboard"]) as (keyof typeof allMenuItems)[];

  // RBAC Gating: non-onboarded user should only see dashboard
  if (isOnboarded === false) {
    menuKeys = ["dashboard"];
  }

  const sections = [
    {
      title: "KEANGGOTAAN UKM",
      keys: [
        "dashboard",
        "kegiatan",
        "absensi",
        "tugas",
        "magang",
        "piket",
        "manajemenAkun",
        "auditLogSistem",
      ].filter((key) => menuKeys.includes(key as keyof typeof allMenuItems)),
    },
    {
      title: "OPEN RECRUITMENT",
      keys: [
        "pengaturanOr",
        "manajemenCaang",
        "kegiatanAbsensiCaang",
        "manajemenKelompokCaang",
        "manajemenMagang",
      ].filter((key) => menuKeys.includes(key as keyof typeof allMenuItems)),
    },
  ];

  const hasMultipleSections = sections.filter((s) => s.keys.length > 0).length > 1;

  // Prevent flash or SSR mismatch
  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* ==========================================
          DESKTOP SIDEBAR (Static w-64, h-screen)
          ========================================== */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden h-screen w-64 flex-col border-r border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md lg:flex overflow-hidden">
        {/* Brand Logo Area */}
        <div className="flex h-16 items-center border-b border-zinc-200/50 dark:border-zinc-800/50 px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center shrink-0">
              <Image
                src="/images/logo-ukm-robotik-pnp.webp"
                alt="Logo UKM Robotik PNP"
                width={32}
                height={32}
                priority
                className="object-contain"
              />
            </div>
            <span className="font-mono text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
              ROBOTIK PNP
            </span>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 px-3 py-3">
                  <div className="h-5 w-5 animate-pulse rounded-none bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                  <div className="h-3 w-28 animate-pulse rounded-none bg-zinc-200 dark:bg-zinc-800" />
                </div>
              ))}
            </div>
          ) : (
            sections.map((section, sIndex) => {
              if (section.keys.length === 0) return null;

              return (
                <div key={section.title} className={cn("space-y-1.5", sIndex > 0 && "mt-6")}>
                  {hasMultipleSections && (
                    <div className="px-3 pb-2 text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                      {section.title}
                    </div>
                  )}
                  {section.keys.map((key) => {
                    const item = allMenuItems[key as keyof typeof allMenuItems];
                    const isActive =
                      item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group relative flex items-center gap-3 px-3 py-3 text-xs font-mono font-semibold uppercase tracking-widest transition-all rounded-none overflow-hidden",
                          isActive
                            ? "text-zinc-900 dark:text-zinc-50 font-bold"
                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:dark:text-zinc-50 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
                        )}
                      >
                        {isActive && (
                          <>
                            <motion.div
                              layoutId="active-bg"
                              className="absolute inset-0 bg-zinc-100/80 dark:bg-zinc-900/80 z-0"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                            <motion.div
                              layoutId="active-tricolor"
                              className="absolute left-0 top-0 bottom-0 w-[3px] bg-linear-to-b from-[#0066b1] via-[#1c69d4] to-[#e22718] z-10"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                          </>
                        )}
                        <div className="relative z-10 flex items-center gap-3 w-full">
                          <HugeiconsIcon
                            icon={item.icon}
                            size={18}
                            className={cn(
                              "transition-colors shrink-0",
                              isActive
                                ? "text-[#1c69d4] dark:text-[#0066b1]"
                                : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 group-hover:dark:text-zinc-50"
                            )}
                          />
                          <span className="whitespace-nowrap">{item.title}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            })
          )}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
          <Link
            href="/settings"
            className={cn(
              "group relative flex items-center gap-3 px-3 py-3 text-xs font-mono font-semibold uppercase tracking-widest transition-all rounded-none overflow-hidden text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:dark:text-zinc-50 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
            )}
          >
            <div className="relative z-10 flex items-center gap-3">
              <HugeiconsIcon
                icon={Settings02Icon}
                size={18}
                className="shrink-0 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 group-hover:dark:text-zinc-50 transition-colors"
              />
              <span className="whitespace-nowrap">PENGATURAN</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* ==========================================
          MOBILE SIDEBAR (Drawer Panel)
          ========================================== */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden cursor-pointer"
            />

            {/* Mobile Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200/50 dark:border-zinc-800/50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl lg:hidden overflow-hidden shadow-2xl"
            >
              {/* Logo Area */}
              <div className="flex h-16 items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/50 px-6">
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-3"
                >
                  <Image
                    src="/images/logo-ukm-robotik-pnp.webp"
                    alt="Logo UKM Robotik PNP"
                    width={32}
                    height={32}
                    priority
                  />
                  <span className="font-mono text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-50">
                    ROBOTIK PNP
                  </span>
                </Link>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 p-1 cursor-pointer"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={18} />
                </button>
              </div>

              {/* Navigation Menu */}
              <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="flex items-center gap-3 px-3 py-3">
                        <div className="h-5 w-5 animate-pulse rounded-none bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                        <div className="h-3 w-28 animate-pulse rounded-none bg-zinc-200 dark:bg-zinc-800" />
                      </div>
                    ))}
                  </div>
                ) : (
                  sections.map((section, sIndex) => {
                    if (section.keys.length === 0) return null;

                    return (
                      <div key={section.title} className={cn("space-y-1.5", sIndex > 0 && "mt-6")}>
                        {hasMultipleSections && (
                          <div className="px-3 pb-2 text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                            {section.title}
                          </div>
                        )}
                        {section.keys.map((key) => {
                          const item = allMenuItems[key as keyof typeof allMenuItems];
                          const isActive =
                            item.href === "/dashboard"
                              ? pathname === "/dashboard"
                              : pathname.startsWith(item.href);

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsMobileOpen(false)}
                              className={cn(
                                "group relative flex items-center gap-3 px-3 py-3 text-xs font-mono font-semibold uppercase tracking-widest transition-all rounded-none overflow-hidden",
                                isActive
                                  ? "text-zinc-900 dark:text-zinc-50 font-bold"
                                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:dark:text-zinc-50 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
                              )}
                            >
                              {isActive && (
                                <>
                                  <motion.div
                                    layoutId="active-bg-mobile"
                                    className="absolute inset-0 bg-zinc-100/80 dark:bg-zinc-900/80 z-0"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                  />
                                  <motion.div
                                    layoutId="active-tricolor-mobile"
                                    className="absolute left-0 top-0 bottom-0 w-[3px] bg-linear-to-b from-[#0066b1] via-[#1c69d4] to-[#e22718] z-10"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                  />
                                </>
                              )}
                              <div className="relative z-10 flex items-center gap-3 w-full">
                                <HugeiconsIcon
                                  icon={item.icon}
                                  size={18}
                                  className={cn(
                                    "transition-colors shrink-0",
                                    isActive
                                      ? "text-[#1c69d4] dark:text-[#0066b1]"
                                      : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 group-hover:dark:text-zinc-50"
                                  )}
                                />
                                <span className="whitespace-nowrap">{item.title}</span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </nav>

              {/* Mobile Settings Footer */}
              <div className="border-t border-zinc-200/50 dark:border-zinc-800/50 p-4">
                <Link
                  href="/settings"
                  onClick={() => setIsMobileOpen(false)}
                  className="group relative flex items-center gap-3 px-3 py-3 text-xs font-mono font-semibold uppercase tracking-widest transition-all rounded-none overflow-hidden text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:dark:text-zinc-50 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
                >
                  <HugeiconsIcon
                    icon={Settings02Icon}
                    size={18}
                    className="shrink-0 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 group-hover:dark:text-zinc-50 transition-colors"
                  />
                  <span className="whitespace-nowrap">PENGATURAN</span>
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
