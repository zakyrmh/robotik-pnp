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
  ArrowLeft01Icon,
  ArrowRight01Icon,
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
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sync mobile menu toggling from Header
  useEffect(() => {
    const handleToggle = () => setIsMobileOpen((prev) => !prev);
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  // Set mounted status on client load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Set CSS property and save layout configuration
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("sidebar-collapsed", String(isCollapsed));
      document.documentElement.style.setProperty(
        "--sidebar-width",
        isCollapsed ? "5rem" : "16rem"
      );
    }
  }, [isCollapsed, mounted]);

  const role = user?.role;
  const isOnboarded = user?.is_onboarded;

  let menuKeys = (role && roleMenuKeys[role]
    ? roleMenuKeys[role]
    : ["dashboard"]) as (keyof typeof allMenuItems)[];

  // RBAC Gating: non-onboarded user should only see dashboard
  if (isOnboarded === false) {
    menuKeys = ["dashboard"];
  }

  // Prevent flash or SSR issues
  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* ==========================================
          DESKTOP SIDEBAR
          ========================================== */}
      <motion.aside
        animate={{ width: isCollapsed ? "5rem" : "16rem" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border/40 bg-card/45 backdrop-blur-xl lg:flex overflow-hidden relative shadow-md"
      >
        {/* Brand Logo Area */}
        <div className={cn("flex h-16 items-center border-b border-border/40 px-6 transition-all", isCollapsed ? "justify-center px-0" : "")}>
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
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-mono text-sm font-bold uppercase tracking-widest text-foreground whitespace-nowrap"
              >
                ROBOTIK PNP
              </motion.span>
            )}
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-2 p-3 overflow-y-auto overflow-x-hidden">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className={cn("flex items-center gap-3 px-3 py-3", isCollapsed ? "justify-center" : "")}
                >
                  <div className="h-5 w-5 animate-pulse rounded-none bg-muted/60 shrink-0" />
                  {!isCollapsed && (
                    <div className="h-3 w-28 animate-pulse rounded-none bg-muted/60" />
                  )}
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
                    "group relative flex items-center gap-3 px-3 py-3 text-xs font-mono font-semibold uppercase tracking-widest transition-all rounded-none overflow-hidden",
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                  )}
                >
                  {isActive && (
                    <>
                      <motion.div
                        layoutId="active-bg"
                        className="absolute inset-0 bg-[#0066b1]/5 z-0"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                      <motion.div
                        layoutId="active-tricolor"
                        className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#0066b1] via-[#1c69d4] to-[#e22718] z-10"
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
                          ? "text-[#0066b1]"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="whitespace-nowrap"
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-border/40">
          <Link
            href="/settings"
            className={cn(
              "group relative flex items-center gap-3 px-3 py-3 text-xs font-mono font-semibold uppercase tracking-widest transition-all rounded-none overflow-hidden text-muted-foreground hover:text-foreground hover:bg-muted/20"
            )}
          >
            <div className="relative z-10 flex items-center gap-3">
              <HugeiconsIcon icon={Settings02Icon} size={18} className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="whitespace-nowrap"
                >
                  PENGATURAN
                </motion.span>
              )}
            </div>
          </Link>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex w-full items-center justify-center border-t border-border/40 py-4 hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-all font-mono text-xs uppercase tracking-widest gap-2 cursor-pointer mt-2"
          >
            <HugeiconsIcon
              icon={isCollapsed ? ArrowRight01Icon : ArrowLeft01Icon}
              size={18}
              className="shrink-0"
            />
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="whitespace-nowrap font-bold"
              >
                COLLAPSE
              </motion.span>
            )}
          </button>
        </div>
      </motion.aside>

      {/* ==========================================
          MOBILE SIDEBAR (DRAWER)
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
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border/40 bg-card/90 backdrop-blur-xl lg:hidden overflow-hidden shadow-2xl"
            >
              {/* Logo Area */}
              <div className="flex h-16 items-center justify-between border-b border-border/40 px-6">
                <Link href="/dashboard" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-3">
                  <Image
                    src="/images/logo-ukm-robotik-pnp.webp"
                    alt="Logo UKM Robotik PNP"
                    width={32}
                    height={32}
                    priority
                  />
                  <span className="font-mono text-sm font-bold uppercase tracking-widest text-foreground">
                    ROBOTIK PNP
                  </span>
                </Link>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="text-muted-foreground hover:text-foreground border border-border/60 hover:bg-muted/30 p-1 cursor-pointer"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={18} />
                </button>
              </div>

              {/* Navigation Menu */}
              <nav className="flex-1 space-y-2 p-3 overflow-y-auto">
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 px-3 py-3"
                      >
                        <div className="h-5 w-5 animate-pulse rounded-none bg-muted/60 shrink-0" />
                        <div className="h-3 w-28 animate-pulse rounded-none bg-muted/60" />
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
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          "group relative flex items-center gap-3 px-3 py-3 text-xs font-mono font-semibold uppercase tracking-widest transition-all rounded-none overflow-hidden",
                          isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                        )}
                      >
                        {isActive && (
                          <>
                            <motion.div
                              layoutId="active-bg-mobile"
                              className="absolute inset-0 bg-[#0066b1]/5 z-0"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                            <motion.div
                              layoutId="active-tricolor-mobile"
                              className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#0066b1] via-[#1c69d4] to-[#e22718] z-10"
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
                                ? "text-[#0066b1]"
                                : "text-muted-foreground group-hover:text-foreground"
                            )}
                          />
                          <span className="whitespace-nowrap">{item.title}</span>
                        </div>
                      </Link>
                    );
                  })
                )}
              </nav>

              {/* Mobile Settings Footer */}
              <div className="border-t border-border/40 p-3">
                <Link
                  href="/settings"
                  onClick={() => setIsMobileOpen(false)}
                  className="group relative flex items-center gap-3 px-3 py-3 text-xs font-mono font-semibold uppercase tracking-widest transition-all rounded-none overflow-hidden text-muted-foreground hover:text-foreground hover:bg-muted/20"
                >
                  <HugeiconsIcon icon={Settings02Icon} size={18} className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
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
