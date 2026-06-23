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
    <section className="relative min-h-screen bg-canvas-dark overflow-hidden flex items-center">
      {/* Animated grid background */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,102,177,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,102,177,1) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Glowing orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(0,102,177,0.4) 0%, transparent 70%)",
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(226,39,24,0.3) 0%, transparent 70%)",
        }}
      />

      {/* Diagonal accent lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-0 w-px h-[200px] bg-linear-to-b from-transparent via-cyber-blue/40 to-transparent" />
        <div className="absolute top-1/3 right-12 w-px h-[150px] bg-linear-to-b from-transparent via-cyber-blue/20 to-transparent" />
      </div>

      <div className="relative z-10 max-w-[1320px] mx-auto px-6 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <div>
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="h-[2px] w-10 bg-linear-to-r from-cyber-blue to-tech-navy" />
              <span className="font-mono text-[11px] font-medium uppercase tracking-[2px] text-cyber-blue">
                UKM Robotika — Politeknik Negeri Padang
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-sans font-bold text-[56px] md:text-[72px] leading-none uppercase text-white mb-6"
            >
              MESIN.
              <br />
              <span className="text-cyber-blue">LOGIKA.</span>
              <br />
              JUARA.
            </motion.h1>

            {/* Sub headline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-white/60 text-base font-light leading-relaxed max-w-xl mb-10"
            >
              Unit Kegiatan Mahasiswa Robotika PNP adalah pusat inovasi rekayasa
              robot terdepan di Sumatera Barat — membawa misi meraih podium
              nasional di KRAI, KRSBI-B, KRSBI-H, KRSTI, dan KRSRI setiap
              tahunnya.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                href="/divisi"
                className="inline-flex items-center gap-3 font-mono text-[12px] font-medium uppercase tracking-[1.5px] px-7 py-3.5 bg-white text-canvas-dark hover:bg-transparent hover:text-white border border-white transition-all duration-200 group"
              >
                Jelajahi Divisi
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={16}
                  className="group-hover:translate-x-1 transition-transform duration-200"
                />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-3 font-mono text-[12px] font-medium uppercase tracking-[1.5px] px-7 py-3.5 bg-transparent text-white border border-hairline-dark hover:border-cyber-blue hover:bg-cyber-blue/10 transition-all duration-200"
              >
                Bergabung Sekarang
              </Link>
            </motion.div>
          </div>

          {/* Right: Visual panel */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            {/* Main visual card */}
            <div className="relative border border-hairline-dark bg-surface-card-dark p-1">
              {/* Corner accents */}
              <div className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-cyber-blue" />
              <div className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-cyber-blue" />
              <div className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-crimson-red" />
              <div className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-crimson-red" />

              {/* SVG Robot Illustration */}
              <div className="aspect-4/3 bg-canvas-dark flex items-center justify-center overflow-hidden relative">
                {/* Circuit pattern bg */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(0,102,177,0.8) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0,102,177,0.8) 1px, transparent 1px)
                    `,
                    backgroundSize: "32px 32px",
                  }}
                />

                {/* Glowing robot icon */}
                <div className="relative z-10 flex flex-col items-center gap-6">
                  <motion.div
                    animate={{ y: [-8, 8, -8] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="relative"
                  >
                    <div
                      className="absolute inset-0 blur-2xl opacity-50"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(0,102,177,0.8) 0%, transparent 70%)",
                      }}
                    />
                    <HugeiconsIcon
                      icon={RobotIcon}
                      size={120}
                      className="text-cyber-blue relative z-10 drop-shadow-[0_0_20px_rgba(0,102,177,0.8)]"
                    />
                  </motion.div>
                  <div className="text-center">
                    <p className="font-mono text-[10px] uppercase tracking-[2px] text-cyber-blue">
                      System Online
                    </p>
                    <div className="flex items-center gap-2 justify-center mt-1.5">
                      <motion.div
                        animate={{ opacity: [1, 0.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-[#22c55e]"
                      />
                      <span className="font-mono text-[10px] text-white/40 uppercase tracking-[1px]">
                        All Units Operational
                      </span>
                    </div>
                  </div>
                </div>

                {/* Corner data tags */}
                <div className="absolute top-3 left-3 font-mono text-[9px] text-cyber-blue/60 uppercase tracking-wider">
                  SYS/ROBOT_V2
                </div>
                <div className="absolute top-3 right-3 font-mono text-[9px] text-white/30 uppercase tracking-wider">
                  ONLINE
                </div>
                <div className="absolute bottom-3 left-3 font-mono text-[9px] text-white/30 uppercase tracking-wider">
                  LAT: -0.9492
                </div>
                <div className="absolute bottom-3 right-3 font-mono text-[9px] text-crimson-red/60 uppercase tracking-wider">
                  PADANG
                </div>
              </div>
            </div>

            {/* Floating stat cards */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="absolute -bottom-6 -left-6 bg-surface-card-dark border border-hairline-dark p-4 flex items-center gap-3"
            >
              <HugeiconsIcon
                icon={ChampionIcon}
                size={20}
                className="text-cyber-blue"
              />
              <div>
                <p className="font-mono text-[20px] font-bold text-white leading-none">
                  {totalAchievements}+
                </p>
                <p className="font-mono text-[9px] uppercase tracking-[1.5px] text-white/40 mt-0.5">
                  Total Prestasi
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="absolute -top-6 -right-6 bg-surface-card-dark border border-hairline-dark p-4 flex items-center gap-3"
            >
              <HugeiconsIcon
                icon={UserGroupIcon}
                size={20}
                className="text-cyber-blue"
              />
              <div>
                <p className="font-mono text-[20px] font-bold text-white leading-none">
                  {activeMemberCount}+
                </p>
                <p className="font-mono text-[9px] uppercase tracking-[1.5px] text-white/40 mt-0.5">
                  Anggota Aktif
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute -bottom-6 md:-bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="font-mono text-[9px] uppercase tracking-[2px] text-white/30">
            Gulir Ke Bawah
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-px h-8 bg-linear-to-b from-cyber-blue/60 to-transparent"
          />
        </motion.div>
      </div>

      {/* Bottom tricolor divider */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-cyber-blue via-tech-navy to-crimson-red" />
    </section>
  );
}
