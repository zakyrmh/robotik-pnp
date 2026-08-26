"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Trophy, Users, Bot, Cpu, ShieldCheck } from "lucide-react";

interface HeroSectionProps {
  activeMemberCount?: number;
  totalAchievements?: number;
}

export function HeroSection({
  activeMemberCount = 60,
  totalAchievements = 40,
}: HeroSectionProps) {
  return (
    <section className="relative min-h-[90vh] bg-background text-foreground overflow-hidden flex items-center mt-6 sm:mt-0 py-16 sm:py-20 lg:py-28 xl:py-32 transition-colors duration-200">
      {/* Subtle ambient gradient highlights */}
      <div className="absolute top-1/4 right-0 w-96 sm:w-130 h-96 sm:h-130 rounded-full bg-primary/5 dark:bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 sm:w-110 h-80 sm:h-110 rounded-full bg-accent-strong/5 dark:bg-accent-strong/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-center">
          {/* Left Column: Typography & CTAs (7 cols) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-7">
            {/* Identity Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/80 dark:bg-card/40 backdrop-blur-xs text-xs font-body text-foreground shadow-2xs"
            >
              <span className="size-2 rounded-full bg-accent-strong animate-pulse" />
              <span className="font-medium text-foreground">
                Unit Kegiatan Mahasiswa
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="font-mono text-[11px] text-muted-foreground uppercase">
                Politeknik Negeri Padang
              </span>
            </motion.div>

            {/* Main Headline & Motto */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-3"
            >
              <h1 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-foreground leading-[1.08] text-balance">
                We Play with <span className="text-primary">Technology.</span>
              </h1>
              <p className="font-display font-semibold text-lg sm:text-xl md:text-2xl text-accent-strong italic">
                No Victory Without Sacrifice.
              </p>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-body text-muted-foreground text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl text-pretty"
            >
              Unit Kegiatan Mahasiswa di Politeknik Negeri Padang yang berfokus
              pada rekayasa mekatronika, sistem kendali, visi komputer, dan
              kecerdasan buatan melalui perancangan robot kompetisi tingkat
              regional dan nasional.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-3.5 pt-2"
            >
              <Link
                href="/divisi"
                className="inline-flex items-center justify-center gap-2 font-body font-medium text-sm px-6 py-3.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md shadow-xs transition-all duration-150 active:scale-[0.98] min-h-[44px] group"
              >
                <span>Lihat Divisi Robot</span>
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 font-body font-medium text-sm px-6 py-3.5 border border-border bg-card hover:bg-muted text-foreground rounded-md shadow-2xs transition-all duration-150 active:scale-[0.98] min-h-[44px]"
              >
                <span>Pendaftaran Anggota</span>
              </Link>
            </motion.div>
          </div>

          {/* Right Column: Visual Technical CAD & Blueprint (5 cols) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="lg:col-span-5 relative"
          >
            {/* Main Technical Spec Container */}
            <div className="relative border border-border bg-card rounded-xl p-5 sm:p-6 shadow-soft overflow-hidden">
              {/* Top Card Header */}
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-accent-strong" />
                  <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    CAD TELEMETRY & SPEC
                  </span>
                </div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-accent-strong bg-accent dark:bg-accent/20 px-2 py-0.5 rounded-full font-semibold">
                  SYS_ONLINE
                </span>
              </div>

              {/* Central Schematics Display */}
              <div className="aspect-4/3 bg-secondary/60 rounded-lg flex flex-col items-center justify-center overflow-hidden relative border border-border/80 p-6">
                <motion.div
                  animate={{ y: [-4, 4, -4] }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative flex items-center justify-center"
                >
                  <div className="absolute inset-0 blur-2xl opacity-30 bg-primary rounded-full" />
                  <Bot className="size-20 sm:size-24 text-primary relative z-10" />
                </motion.div>

                <div className="text-center mt-4 relative z-10">
                  <p className="font-mono text-xs uppercase tracking-widest font-bold text-foreground">
                    AUTONOMOUS ROBOT PLATFORM
                  </p>
                  <div className="flex items-center gap-2 justify-center mt-1">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                      ALL SYSTEMS OPERATIONAL
                    </span>
                  </div>
                </div>

                {/* Schematics Metadata Overlays */}
                <div className="absolute top-2.5 left-2.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  SPEC: KRI-STD
                </div>
                <div className="absolute top-2.5 right-2.5 font-mono text-[10px] text-accent-strong font-semibold uppercase tracking-wider">
                  REV_2026.1
                </div>
                <div className="absolute bottom-2.5 left-2.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  COORD: 0.9492° S
                </div>
                <div className="absolute bottom-2.5 right-2.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  PNP_PADANG
                </div>
              </div>

              {/* Bottom Quick Spec Bar */}
              <div className="mt-4 pt-3.5 border-t border-border grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Cpu className="size-3.5 text-primary shrink-0" />
                  <span className="font-mono text-[11px]">
                    Real-time RTOS / CV
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="size-3.5 text-accent-strong shrink-0" />
                  <span className="font-mono text-[11px]">
                    Puspresnas Certified
                  </span>
                </div>
              </div>
            </div>

            {/* Floating Metric Badges */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="absolute -bottom-4 -left-4 sm:-left-5 bg-card border border-border rounded-lg p-3 sm:p-3.5 shadow-soft flex items-center gap-3"
            >
              <div className="p-2 rounded-md bg-accent dark:bg-accent/20 text-accent-strong">
                <Trophy className="size-4 sm:size-5" />
              </div>
              <div>
                <p className="font-display text-lg sm:text-xl font-bold text-foreground leading-none">
                  {totalAchievements}+
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                  Prestasi Resmi
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.4 }}
              className="absolute -top-4 -right-4 sm:-right-5 bg-card border border-border rounded-lg p-3 sm:p-3.5 shadow-soft flex items-center gap-3"
            >
              <div className="p-2 rounded-md bg-secondary text-primary">
                <Users className="size-4 sm:size-5" />
              </div>
              <div>
                <p className="font-display text-lg sm:text-xl font-bold text-foreground leading-none">
                  {activeMemberCount}+
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                  Anggota Aktif
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
