"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Menu, X, Sun, Moon, ArrowRight, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLinkItem {
  href: string;
  label: string;
}

const navLinks: NavLinkItem[] = [
  { href: "/", label: "Beranda" },
  { href: "/profil", label: "Profil" },
  { href: "/divisi", label: "Divisi" },
  { href: "/prestasi", label: "Prestasi" },
  { href: "/keanggotaan", label: "Keanggotaan" },
  { href: "/artikel", label: "Artikel" },
  { href: "/hubungi-kami", label: "Hubungi Kami" },
];

export function LandingNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      const isDark =
        document.documentElement.classList.contains("dark") ||
        localStorage.getItem("theme") === "dark";
      setTheme(isDark ? "dark" : "light");
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
          scrolled
            ? "bg-background/90 dark:bg-background/95 backdrop-blur-md border-b border-border shadow-xs"
            : "bg-background/75 dark:bg-background/85 backdrop-blur-xs border-b border-border/60",
        )}
      >
        {/* Subtle engineering brand accent stripe */}
        <div className="h-0.5 w-full bg-linear-to-r from-primary via-accent-strong to-primary/40" />

        <div className="max-w-7xl mx-auto h-16 sm:h-18 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg py-1 pr-2"
          >
            <div className="relative size-9 sm:size-10 flex items-center justify-center shrink-0 rounded-lg border border-border bg-card p-1 shadow-2xs group-hover:border-primary transition-colors">
              <Image
                src="/images/logo-ukm-robotik-pnp.webp"
                alt="Logo UKM Robotik PNP"
                width={36}
                height={36}
                className="rounded-md object-contain size-full"
                priority
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display font-bold text-sm sm:text-base tracking-tight text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                UKM ROBOTIK
              </span>
              <span className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground font-medium">
                POLITEKNIK NEGERI PADANG
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Navigasi Utama"
            className="hidden lg:flex items-center gap-1"
          >
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative font-body text-sm font-medium px-3.5 py-2 rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  )}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions Cluster */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="size-9 sm:size-10 flex items-center justify-center rounded-md border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={
                theme === "light"
                  ? "Beralih ke Mode Gelap"
                  : "Beralih ke Mode Terang"
              }
              title={
                theme === "light"
                  ? "Beralih ke Dark Mode"
                  : "Beralih ke Light Mode"
              }
            >
              {mounted ? (
                <motion.div
                  key={theme}
                  initial={{ rotate: -45, opacity: 0, scale: 0.8 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === "light" ? (
                    <Moon className="size-4.5 text-foreground" />
                  ) : (
                    <Sun className="size-4.5 text-foreground" />
                  )}
                </motion.div>
              ) : (
                <div className="size-4.5" />
              )}
            </button>

            {/* Login SIM Button (Desktop) */}
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-1.5 font-body text-xs sm:text-sm font-medium px-3.5 py-2 rounded-md border border-border bg-card hover:bg-muted text-foreground transition-all duration-150 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogIn className="size-3.5 text-muted-foreground" />
              <span>Masuk SIM</span>
            </Link>

            {/* Main CTA Button (Desktop) */}
            <Link
              href="/register"
              className="hidden lg:inline-flex items-center gap-1.5 font-body text-sm font-medium px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>Bergabung</span>
              <ArrowRight className="size-3.5" />
            </Link>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden size-9 sm:size-10 flex items-center justify-center rounded-md border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={
                mobileOpen ? "Tutup menu navigasi" : "Buka menu navigasi"
              }
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="size-5 text-foreground" />
              ) : (
                <Menu className="size-5 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay & Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
              aria-hidden="true"
            />

            {/* Mobile Navigation Panel */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed top-16 sm:top-18 left-0 right-0 z-40 bg-background/98 backdrop-blur-xl border-b border-border shadow-soft lg:hidden max-h-[calc(100dvh-4.5rem)] overflow-y-auto"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">
                {/* Navigation Links */}
                <nav aria-label="Navigasi Mobile" className="space-y-1">
                  {navLinks.map((link) => {
                    const active = isLinkActive(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center justify-between font-body text-sm font-medium px-4 py-3 rounded-lg transition-colors min-h-[44px]",
                          active
                            ? "text-primary font-semibold bg-primary-soft/50 dark:bg-primary-soft/20 border border-primary/20"
                            : "text-foreground hover:bg-muted/70",
                        )}
                      >
                        <span>{link.label}</span>
                        {active && (
                          <span className="size-1.5 rounded-full bg-primary" />
                        )}
                      </Link>
                    );
                  })}
                </nav>

                {/* Divider */}
                <div className="divider" />

                {/* Mobile Theme Switcher Card */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                      {theme === "light" ? (
                        <Sun className="size-4 text-accent-strong" />
                      ) : (
                        <Moon className="size-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-body text-xs font-semibold text-foreground">
                        Mode Tampilan
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground uppercase">
                        {theme === "light" ? "Light Mode" : "Dark Mode"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="font-body text-xs font-medium px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    Ganti Tema
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 font-body text-sm font-medium px-4 py-3 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-center transition-colors min-h-[44px]"
                  >
                    <LogIn className="size-4 text-muted-foreground" />
                    <span>Masuk SIM Robotik</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 font-body text-sm font-medium px-4 py-3 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-center shadow-xs transition-colors min-h-[44px]"
                  >
                    <span>Daftar Calon Anggota</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
