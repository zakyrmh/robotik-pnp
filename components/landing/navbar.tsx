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
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-hairline-light"
            : "bg-transparent"
        }`}
      >
        {/* Tricolor top stripe */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-cyber-blue via-tech-navy to-crimson-red" />

        <div className="max-w-[1320px] mx-auto h-full px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 flex items-center justify-center">
              <Image
                src="/images/logo-ukm-robotik-pnp.webp"
                alt="Logo UKM Robotik PNP"
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span
                className={`font-mono font-bold text-sm uppercase tracking-[2px] transition-colors duration-300 ${
                  scrolled ? "text-canvas-dark" : "text-white"
                }`}
              >
                Robotik
              </span>
              <span
                className={`font-mono text-[10px] uppercase tracking-[1.5px] transition-colors duration-300 ${
                  scrolled ? "text-cyber-blue" : "text-cyber-blue"
                }`}
              >
                PNP
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`font-mono text-[11px] font-medium uppercase tracking-[1.5px] px-4 py-2 block transition-all duration-200 relative group ${
                    scrolled
                      ? "text-canvas-dark hover:text-cyber-blue"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {link.label}
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-cyber-blue scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
                </Link>
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <Link
            href="/register"
            className={`hidden lg:block font-mono text-[11px] font-medium uppercase tracking-[1.5px] px-5 py-2.5 border transition-all duration-200 ${
              scrolled
                ? "bg-canvas-dark text-white border-canvas-dark hover:bg-transparent hover:text-canvas-dark"
                : "bg-white text-canvas-dark border-white hover:bg-transparent hover:text-white"
            }`}
          >
            Bergabung
          </Link>

          {/* Mobile burger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden p-2 transition-colors duration-200 ${
              scrolled ? "text-canvas-dark" : "text-white"
            }`}
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
            className="fixed top-16 left-0 right-0 z-40 bg-canvas-dark border-b border-hairline-dark lg:hidden"
          >
            <ul className="flex flex-col py-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block font-mono text-[11px] font-medium uppercase tracking-[1.5px] px-6 py-3.5 text-white/70 hover:text-white hover:bg-surface-card-dark transition-colors duration-150 border-b border-hairline-dark last:border-0"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="px-6 pt-4 pb-2">
                <Link
                  href="/keanggotaan"
                  onClick={() => setMobileOpen(false)}
                  className="block font-mono text-[11px] font-medium uppercase tracking-[1.5px] px-5 py-3 bg-white text-canvas-dark text-center hover:bg-cyber-blue hover:text-white transition-colors duration-200"
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
