"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

export function CtaSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      className="bg-card dark:bg-[#060d19] text-foreground dark:text-white py-16 sm:py-24 4k:py-40 relative overflow-hidden blueprint-grid-bg border-t border-border transition-colors duration-200"
      ref={ref}
    >
      {/* Top Tricolor Accent Stripe */}
      <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-dongker-surface via-pnp-orange to-dongker-ink" />

      {/* Ambient Glow Orb */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-0 right-0 w-100 sm:w-150 4k:w-[1000px] h-100 sm:h-150 4k:h-[1000px] rounded-full bg-pnp-orange/15 dark:bg-pnp-orange/20 blur-3xl pointer-events-none"
      />

      <div className="relative z-10 max-w-330 2xl:max-w-384 4k:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 4k:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 4k:gap-24 items-center">
          {/* Left: CTA text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="font-mono text-micro sm:text-xs 4k:text-lg font-semibold uppercase tracking-[2px] text-pnp-orange block mb-4">
              — BERGABUNG BERSAMA KAMI
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-5xl lg:text-6xl 4k:text-8xl uppercase leading-none mb-6 text-foreground dark:text-white">
              SIAP <span className="text-pnp-orange">BERKOMPETISI?</span>
            </h2>
            <p className="text-muted-foreground dark:text-slate-300 text-sm sm:text-base lg:text-lg 4k:text-2xl font-light leading-relaxed max-w-xl 4k:max-w-3xl mb-8 sm:mb-10">
              Jadilah bagian dari tim robotika terdepan di Sumatera Barat. Kami
              mencari mahasiswa PNP yang bersemangat, tekun, dan haus akan
              tantangan rekayasa mesin dan kecerdasan buatan.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-3 font-mono text-xs sm:text-sm 4k:text-xl font-semibold uppercase tracking-[1.5px] px-8 py-4 4k:px-12 4k:py-6 bg-dongker-surface text-white hover:bg-dongker-hover dark:bg-pnp-orange dark:hover:bg-pnp-orange/90 rounded-md shadow-lg transition-all group"
              >
                Daftar Sekarang
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={16}
                  className="group-hover:translate-x-1 transition-transform duration-200 4k:w-6 4k:h-6"
                />
              </Link>
              <Link
                href="/hubungi-kami"
                className="inline-flex items-center gap-3 font-mono text-xs sm:text-sm 4k:text-xl font-semibold uppercase tracking-[1.5px] px-8 py-4 4k:px-12 4k:py-6 bg-transparent border border-dongker-surface text-dongker-surface hover:bg-dongker-surface/10 dark:border-white/20 dark:text-white dark:hover:bg-white/10 rounded-md transition-all"
              >
                Hubungi Kami
              </Link>
            </div>
          </motion.div>

          {/* Right: Contact info card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full lg:w-80 4k:w-[450px] space-y-4"
          >
            <div className="bg-muted/40 dark:bg-white/5 border border-border dark:border-white/12 rounded-xl p-6 4k:p-8 backdrop-blur-xs shadow-blueprint">
              <p className="font-mono text-micro 4k:text-base font-semibold uppercase tracking-[2px] text-pnp-orange mb-4">
                KONTAK LANGSUNG
              </p>
              <div className="flex items-start gap-3">
                <HugeiconsIcon
                  icon={Mail01Icon}
                  size={18}
                  className="text-pnp-orange shrink-0 mt-0.5 4k:w-6 4k:h-6"
                />
                <div>
                  <p className="font-mono text-micro 4k:text-sm uppercase tracking-wider text-muted-foreground dark:text-slate-400 mb-1">
                    Email Resmi
                  </p>
                  <a
                    href="mailto:infokomrobotikpnp2024@gmail.com"
                    className="font-mono text-xs 4k:text-base text-foreground dark:text-white hover:text-pnp-orange transition-colors duration-200 break-all"
                  >
                    infokomrobotikpnp2024@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-muted/40 dark:bg-white/5 border border-border dark:border-white/12 rounded-xl p-6 4k:p-8 backdrop-blur-xs shadow-blueprint">
              <p className="font-mono text-micro 4k:text-sm uppercase tracking-wider text-muted-foreground dark:text-slate-400 mb-2 font-semibold">
                SEKRETARIAT
              </p>
              <p className="font-mono text-xs 4k:text-base text-foreground dark:text-slate-200 leading-relaxed">
                Gedung P Lt. 2,
                <br />
                Politeknik Negeri Padang,
                <br />
                Limau Manis, Padang
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
