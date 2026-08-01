"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
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
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
            <div className="w-9 h-9 4k:w-12 4k:h-12 flex items-center justify-center shrink-0">
              <Image
                src="/images/logo-ukm-robotik-pnp.webp"
                alt="Logo UKM Robotik PNP"
                width={36}
                height={36}
                className="rounded-full object-cover h-auto w-auto"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-mono font-bold text-sm 4k:text-xl uppercase tracking-[2px] text-foreground transition-colors duration-300">
                Robotik
              </span>
              <span className="font-mono text-[10px] 4k:text-base uppercase tracking-[1.5px] text-pnp-orange font-semibold">
                PNP
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden lg:flex items-center gap-1 xl:gap-2 4k:gap-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-mono text-micro 4k:text-lg font-medium uppercase tracking-[1.5px] px-3.5 py-2 xl:px-4 4k:px-6 block transition-all duration-200 relative group text-muted-foreground hover:text-pnp-orange dark:hover:text-pnp-orange"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-3.5 right-3.5 xl:left-4 xl:right-4 h-0.5 bg-pnp-orange scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
                </Link>
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <Link
            href="/register"
            className="hidden lg:block font-mono text-micro 4k:text-base font-semibold uppercase tracking-[1.5px] px-5 py-2.5 4k:px-8 4k:py-4 bg-dongker-surface text-white hover:bg-dongker-hover dark:bg-pnp-orange dark:hover:bg-pnp-orange/90 rounded-md shadow-xs transition-all duration-200"
          >
            Bergabung
          </Link>

          {/* Mobile burger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-foreground transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <HugeiconsIcon icon={Cancel01Icon} size={22} />
            ) : (
              <HugeiconsIcon icon={Menu01Icon} size={22} />
            )}
          </button>
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
            className="fixed top-16 left-0 right-0 z-40 bg-card dark:bg-dongker-ink border-b border-border shadow-lg lg:hidden"
          >
            <ul className="flex flex-col py-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block font-mono text-xs font-medium uppercase tracking-[1.5px] px-6 py-3.5 text-foreground hover:text-pnp-orange hover:bg-muted transition-colors duration-150 border-b border-border/50 last:border-0"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
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
