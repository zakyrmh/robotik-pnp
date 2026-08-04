"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Menu01Icon,
  Cancel01Icon,
  Sun01Icon,
  Moon01Icon,
} from "@hugeicons/core-free-icons";
import Image from "next/image";

const navLinks = [
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
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }, 0);
    return () => clearTimeout(timer);
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

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 h-16 4k:h-24 transition-all duration-300 ${
          scrolled
            ? "bg-background/95 dark:bg-dongker-ink/95 backdrop-blur-md border-b border-border shadow-xs"
            : "bg-background/80 dark:bg-dongker-ink/80 backdrop-blur-xs border-b border-border/40"
        }`}
      >
        {/* Tricolor top stripe */}
        <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-dongker-surface via-pnp-orange to-dongker-ink" />

        <div className="max-w-330 2xl:max-w-384 4k:max-w-[2200px] mx-auto h-full px-4 sm:px-6 lg:px-8 xl:px-12 4k:px-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 4k:gap-4 group">
            <div className="size-9 4k:size-12 flex items-center justify-center shrink-0 rounded-full border border-blueprint-border/60 dark:border-zinc-800 p-0.5 bg-background shadow-xs group-hover:border-pnp-orange transition-colors">
              <Image
                src="/images/logo-ukm-robotik-pnp.webp"
                alt="Logo UKM Robotik PNP"
                width={36}
                height={36}
                className="rounded-full object-cover size-full"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-mono font-bold text-sm 4k:text-xl uppercase tracking-[2px] text-foreground group-hover:text-pnp-orange transition-colors">
                Robotik
              </span>
              <span className="font-mono text-[10px] 4k:text-base uppercase tracking-[1.5px] text-pnp-orange font-semibold">
                PNP
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden lg:flex items-center gap-1 xl:gap-2 4k:gap-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`font-mono text-micro 4k:text-lg uppercase tracking-[1.5px] px-3.5 py-2 xl:px-4 4k:px-6 block transition-all duration-200 relative group ${
                      isActive
                        ? "text-pnp-orange font-bold"
                        : "text-muted-foreground font-medium hover:text-pnp-orange dark:hover:text-pnp-orange"
                    }`}
                  >
                    {link.label}
                    <span
                      className={`absolute bottom-0 left-3.5 right-3.5 xl:left-4 xl:right-4 h-0.5 bg-pnp-orange transition-transform duration-200 origin-left ${
                        isActive
                          ? "scale-x-100"
                          : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="size-9 4k:size-12 flex items-center justify-center rounded-md border border-border bg-background/80 hover:bg-muted text-foreground transition-all duration-200 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pnp-orange"
              aria-label="Ubah Tema Warna"
              title={
                theme === "light"
                  ? "Beralih ke Dark Mode"
                  : "Beralih ke Light Mode"
              }
            >
              {mounted ? (
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  <HugeiconsIcon
                    icon={theme === "light" ? Moon01Icon : Sun01Icon}
                    size={18}
                    className="text-foreground"
                  />
                </motion.div>
              ) : (
                <div className="size-4" />
              )}
            </motion.button>

            {/* CTA Button */}
            <Link
              href="/register"
              className="hidden lg:inline-flex items-center justify-center font-mono text-micro 4k:text-base font-semibold uppercase tracking-[1.5px] px-5 py-2.5 4k:px-8 4k:py-4 bg-dongker-surface text-white hover:bg-dongker-hover dark:bg-pnp-orange dark:hover:bg-pnp-orange/90 rounded-md shadow-xs transition-all duration-200"
            >
              Bergabung
            </Link>

            {/* Mobile burger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-foreground hover:bg-muted rounded-md transition-colors duration-200 cursor-pointer"
              aria-label="Toggle menu"
            >
              <HugeiconsIcon
                icon={mobileOpen ? Cancel01Icon : Menu01Icon}
                size={22}
              />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 bg-background/95 dark:bg-dongker-ink/98 backdrop-blur-md border-b border-border shadow-lg lg:hidden"
          >
            <ul className="flex flex-col py-3">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block font-mono text-xs uppercase tracking-[1.5px] px-6 py-3.5 transition-colors duration-150 border-b border-border/40 ${
                        isActive
                          ? "text-pnp-orange font-bold bg-pnp-orange/5"
                          : "text-foreground font-medium hover:text-pnp-orange hover:bg-muted"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
              {/* Mobile Theme Toggle Row */}
              <li className="px-6 py-3 border-b border-border/40 flex items-center justify-between font-mono text-xs font-medium uppercase tracking-[1.5px] text-muted-foreground">
                <span>MODE TEMA: {theme === "light" ? "LIGHT" : "DARK"}</span>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/60 text-foreground font-mono text-micro uppercase tracking-wider cursor-pointer hover:bg-muted"
                >
                  <HugeiconsIcon
                    icon={theme === "light" ? Moon01Icon : Sun01Icon}
                    size={16}
                  />
                  <span>{theme === "light" ? "DARK MODE" : "LIGHT MODE"}</span>
                </button>
              </li>
              <li className="px-6 pt-4 pb-2">
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block font-mono text-xs font-semibold uppercase tracking-[1.5px] px-5 py-3 bg-dongker-surface text-white text-center hover:bg-dongker-hover dark:bg-pnp-orange dark:hover:bg-pnp-orange/90 rounded-md shadow-xs transition-colors duration-200"
                >
                  Bergabung
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
