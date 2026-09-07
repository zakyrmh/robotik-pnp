"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, Mail, MapPin } from "lucide-react";

export function CtaSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      className="bg-background text-foreground py-16 sm:py-20 lg:py-24 border-t border-border transition-colors duration-200 relative overflow-hidden"
      ref={ref}
    >
      {/* Ambient background glow */}
      <div className="absolute top-1/2 -right-20 -translate-y-1/2 w-80 sm:w-120 h-80 sm:h-120 rounded-full bg-primary/5 dark:bg-primary/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-card border border-border rounded-2xl p-8 sm:p-10 lg:p-14 shadow-soft">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: CTA Pitch (7 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 space-y-5"
            >
              <span className="font-mono text-xs uppercase tracking-wider text-accent-strong font-semibold block">
                PELUANG BERGABUNG
              </span>

              <h2 className="font-display font-bold text-2xl sm:text-4xl lg:text-5xl tracking-tight text-foreground text-balance">
                Bergabung Bersama{" "}
                <span className="text-primary">UKM Robotik PNP</span>
              </h2>

              <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl text-pretty">
                Wadah terbuka bagi mahasiswa Politeknik Negeri Padang yang
                bertekad mendalami perancangan mekanik, sistem elektronika, dan
                kecerdasan buatan. Siapkan diri untuk berkolaborasi dan
                berkompetisi di arena nasional.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 font-body font-medium text-sm px-6 py-3.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md shadow-xs transition-all active:scale-[0.98] min-h-[44px] group"
                >
                  <span>Daftar Anggota Baru</span>
                  <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="/hubungi-kami"
                  className="inline-flex items-center justify-center gap-2 font-body font-medium text-sm px-6 py-3.5 border border-border bg-card hover:bg-muted text-foreground rounded-md shadow-2xs transition-all active:scale-[0.98] min-h-[44px]"
                >
                  <span>Hubungi Sekretariat</span>
                </Link>
              </div>
            </motion.div>

            {/* Right Column: Contact Cards (5 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="lg:col-span-5 space-y-4"
            >
              {/* Email card */}
              <div className="bg-secondary/60 border border-border rounded-xl p-5 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-lg bg-card border border-border flex items-center justify-center text-primary shrink-0 shadow-2xs">
                    <Mail className="size-4" />
                  </div>
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                      SUREL RESMI
                    </p>
                    <a
                      href="mailto:infokomrobotikpnp2024@gmail.com"
                      className="font-body text-sm font-medium text-foreground hover:text-primary transition-colors break-all mt-0.5 inline-block"
                    >
                      infokomrobotikpnp2024@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Secretariat Location Card */}
              <div className="bg-secondary/60 border border-border rounded-xl p-5 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-lg bg-card border border-border flex items-center justify-center text-accent-strong shrink-0 shadow-2xs">
                    <MapPin className="size-4" />
                  </div>
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                      SEKRETARIAT
                    </p>
                    <p className="font-body text-xs sm:text-sm text-foreground/90 leading-relaxed mt-0.5">
                      Gedung P Lantai 2, Politeknik Negeri Padang, Limau Manis,
                      Padang
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
