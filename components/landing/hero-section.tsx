"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  ChampionIcon,
  RobotIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

interface HeroSectionProps {
  activeMemberCount?: number;
  totalAchievements?: number;
}

export function HeroSection({
  activeMemberCount = 60,
  totalAchievements = 40,
}: HeroSectionProps) {
  return (
    <section className="relative min-h-[90vh] 4k:min-h-[85vh] bg-background text-foreground overflow-hidden flex items-center py-16 sm:py-20 lg:py-28 xl:py-32 4k:py-48 blueprint-grid-bg transition-colors duration-200">
      {/* Ambient Orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] right-[-5%] w-112.5 sm:w-150 4k:w-[1000px] h-112.5 sm:h-150 4k:h-[1000px] rounded-full bg-dongker-surface/10 dark:bg-dongker-surface/25 blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-[-15%] left-[-5%] w-100 sm:w-125 4k:w-[800px] h-100 sm:h-125 4k:h-[800px] rounded-full bg-pnp-orange/10 dark:bg-pnp-orange/20 blur-3xl pointer-events-none"
      />

      <div className="relative z-10 max-w-330 2xl:max-w-384 4k:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 4k:px-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 4k:gap-20 items-center">
          {/* Left: Text content (7 cols) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 4k:space-y-12">
            {/* Eyebrow Status Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2.5 font-mono text-micro sm:text-xs 4k:text-base uppercase tracking-[2px] font-semibold text-orange-deep dark:text-pnp-orange bg-orange-wash dark:bg-pnp-orange/15 border border-pnp-orange/30 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-xs"
            >
              <span className="w-2 h-2 4k:w-3 4k:h-3 rounded-full bg-pnp-orange animate-pulse" />
              UKM ROBOTIKA // POLITEKNIK NEGERI PADANG
            </motion.div>

            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <h1 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl lg:text-7xl 2xl:text-8xl 4k:text-9xl leading-[1.05] uppercase tracking-tight text-foreground">
                MESIN.
                <br />
                <span className="text-pnp-orange">LOGIKA.</span>
                <br />
                JUARA.
              </h1>
              {/* PNP Orange Accent Divider */}
              <div className="h-1 sm:h-1.5 4k:h-3 w-16 sm:w-24 4k:w-40 bg-pnp-orange rounded-full mt-4 sm:mt-6" />
            </motion.div>

            {/* Sub Headline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-muted-foreground text-sm sm:text-base lg:text-lg 2xl:text-xl 4k:text-3xl font-light leading-relaxed max-w-xl 2xl:max-w-2xl 4k:max-w-4xl"
            >
              Unit Kegiatan Mahasiswa Robotik Politeknik Negeri Padang adalah
              wadah pengembangan bakat, minat, dan rekayasa teknologi robotika.
              Bersama motto &quot;No Victory Without Sacrifice&quot; dan slogan
              &quot;We Play With Technology&quot;, kami berkomitmen mencetak
              juara nasional.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-wrap gap-4 pt-2"
            >
              <Link
                href="/divisi"
                className="inline-flex items-center gap-3 font-mono text-xs sm:text-sm 4k:text-xl font-semibold uppercase tracking-[1.5px] px-6 py-3.5 sm:px-8 sm:py-4 4k:px-12 4k:py-6 bg-dongker-surface text-white hover:bg-dongker-hover dark:bg-pnp-orange dark:hover:bg-pnp-orange/90 rounded-md shadow-md transition-all group"
              >
                Jelajahi Divisi
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  className="group-hover:translate-x-1 transition-transform duration-200"
                />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-3 font-mono text-xs sm:text-sm 4k:text-xl font-semibold uppercase tracking-[1.5px] px-6 py-3.5 sm:px-8 sm:py-4 4k:px-12 4k:py-6 bg-transparent border border-dongker-surface text-dongker-surface hover:bg-dongker-surface/10 dark:border-white/20 dark:text-white dark:hover:bg-white/10 rounded-md transition-all"
              >
                Bergabung Sekarang
              </Link>
            </motion.div>
          </div>

          {/* Right: Visual panel (5 cols) */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-5 relative hidden lg:block"
          >
            {/* Main Visual Blueprint Card */}
            <div className="relative border border-border dark:border-white/15 bg-card dark:bg-[#112240] rounded-xl p-5 4k:p-8 shadow-blueprint overflow-hidden">
              {/* Left edge 4px vertical accent */}
              <div className="absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 bg-pnp-orange" />

              {/* Header card info */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/60 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pnp-orange" />
                  <span className="font-mono text-micro 4k:text-base uppercase tracking-widest text-muted-foreground font-semibold">
                    BLUEPRINT ARCHITECTURE
                  </span>
                </div>
                <span className="font-mono text-micro 4k:text-base uppercase tracking-wider text-pnp-orange bg-orange-wash dark:bg-pnp-orange/15 px-2.5 py-0.5 rounded-full font-semibold">
                  SYS_ONLINE
                </span>
              </div>

              {/* Robot Illustration Container */}
              <div className="aspect-4/3 bg-muted/40 dark:bg-dongker-ink/60 rounded-lg flex items-center justify-center overflow-hidden relative border border-border/50 dark:border-white/10">
                <div className="blueprint-grid-bg absolute inset-0 opacity-60" />

                <div className="relative z-10 flex flex-col items-center gap-5">
                  <motion.div
                    animate={{ y: [-6, 6, -6] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="relative"
                  >
                    <div className="absolute inset-0 blur-xl opacity-40 bg-pnp-orange/50 rounded-full" />
                    <HugeiconsIcon
                      icon={RobotIcon}
                      size={90}
                      className="text-dongker-surface dark:text-pnp-orange relative z-10 4k:w-36 4k:h-36"
                    />
                  </motion.div>

                  <div className="text-center">
                    <p className="font-mono text-micro 4k:text-base uppercase tracking-[2px] font-bold text-foreground">
                      SYSTEM TELEMETRY
                    </p>
                    <div className="flex items-center gap-2 justify-center mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-mono text-micro 4k:text-sm text-muted-foreground uppercase tracking-wider">
                        ALL UNITS OPERATIONAL
                      </span>
                    </div>
                  </div>
                </div>

                {/* Technical Corner Metadata */}
                <div className="absolute top-3 left-3 font-mono text-micro 4k:text-sm text-muted-foreground/70 uppercase tracking-wider">
                  SYS/ROBOT_V2.0
                </div>
                <div className="absolute top-3 right-3 font-mono text-micro 4k:text-sm text-pnp-orange font-semibold uppercase tracking-wider">
                  PORTAL_2026
                </div>
                <div className="absolute bottom-3 left-3 font-mono text-micro 4k:text-sm text-muted-foreground/70 uppercase tracking-wider">
                  LAT: -0.9492
                </div>
                <div className="absolute bottom-3 right-3 font-mono text-micro 4k:text-sm text-muted-foreground/70 uppercase tracking-wider">
                  PNP_PADANG
                </div>
              </div>
            </div>

            {/* Floating Stat Badges */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="absolute -bottom-5 -left-5 bg-card dark:bg-[#112240] border border-border dark:border-white/15 rounded-lg p-3.5 sm:p-4 4k:p-6 shadow-blueprint flex items-center gap-3.5"
            >
              <div className="p-2 sm:p-2.5 rounded-md bg-orange-wash dark:bg-pnp-orange/15 text-pnp-orange">
                <HugeiconsIcon
                  icon={ChampionIcon}
                  size={20}
                  className="4k:w-8 4k:h-8"
                />
              </div>
              <div>
                <p className="font-display text-xl 4k:text-3xl font-bold text-foreground leading-none">
                  {totalAchievements}+
                </p>
                <p className="font-mono text-micro 4k:text-base uppercase tracking-wider text-muted-foreground mt-0.5">
                  Total Prestasi
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="absolute -top-5 -right-5 bg-card dark:bg-[#112240] border border-border dark:border-white/15 rounded-lg p-3.5 sm:p-4 4k:p-6 shadow-blueprint flex items-center gap-3.5"
            >
              <div className="p-2 sm:p-2.5 rounded-md bg-muted dark:bg-white/10 text-dongker-surface dark:text-pnp-orange">
                <HugeiconsIcon
                  icon={UserGroupIcon}
                  size={20}
                  className="4k:w-8 4k:h-8"
                />
              </div>
              <div>
                <p className="font-display text-xl 4k:text-3xl font-bold text-foreground leading-none">
                  {activeMemberCount}+
                </p>
                <p className="font-mono text-micro 4k:text-base uppercase tracking-wider text-muted-foreground mt-0.5">
                  Anggota Aktif
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Tricolor Accent Stripe */}
      <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-linear-to-r from-dongker-surface via-pnp-orange to-dongker-ink" />
    </section>
  );
}
