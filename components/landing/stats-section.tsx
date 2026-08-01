"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChampionIcon,
  UserGroupIcon,
  BuildingIcon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons";

interface StatsSectionProps {
  totalAchievements?: number;
  activeMemberCount?: number;
  divisionCount?: number;
  yearsStanding?: number;
}

export function StatsSection({
  totalAchievements = 40,
  activeMemberCount = 60,
  divisionCount = 5,
  yearsStanding = 21,
}: StatsSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const stats = [
    {
      icon: ChampionIcon,
      value: `${totalAchievements}+`,
      label: "Total Prestasi",
      sublabel: "Nasional & Regional",
      isAccent: true,
    },
    {
      icon: UserGroupIcon,
      value: `${activeMemberCount}+`,
      label: "Anggota Aktif",
      sublabel: `Tersebar di ${divisionCount} Divisi`,
      isAccent: false,
    },
    {
      icon: BuildingIcon,
      value: `${divisionCount}`,
      label: "Divisi Robot",
      sublabel: "Aktif Berkompetisi",
      isAccent: false,
    },
    {
      icon: Calendar01Icon,
      value: `${yearsStanding}+`,
      label: "Tahun Berdiri",
      sublabel: "Pengalaman Rekayasa",
      isAccent: true,
    },
  ];

  return (
    <section
      className="bg-background text-foreground py-16 sm:py-20 4k:py-36 border-t border-border transition-colors duration-200"
      ref={ref}
    >
      <div className="max-w-330 2xl:max-w-384 4k:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 4k:px-20">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-2 mb-10 sm:mb-12 4k:mb-20"
        >
          <span className="font-mono text-micro sm:text-xs 4k:text-lg font-semibold uppercase tracking-[2px] text-pnp-orange">
            — SOCIAL PROOF & METRICS
          </span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl 4k:text-6xl uppercase text-foreground">
            STATISTIKA & <span className="text-pnp-orange">PETA KEKUATAN</span>
          </h2>
          <div className="dashed-divider mt-4" />
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 4k:gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-card dark:bg-[#112240] border border-border dark:border-white/12 rounded-xl p-6 sm:p-8 4k:p-12 shadow-blueprint hover:border-pnp-orange/40 transition-all duration-300 relative group overflow-hidden"
            >
              {/* Left edge 4px vertical accent */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 transition-colors duration-300 ${
                  stat.isAccent
                    ? "bg-pnp-orange"
                    : "bg-dongker-surface group-hover:bg-pnp-orange dark:bg-pnp-orange/60"
                }`}
              />

              <div className="flex items-center justify-between mb-4 4k:mb-8">
                <div className="p-3 4k:p-5 rounded-lg bg-orange-wash dark:bg-pnp-orange/15 text-pnp-orange">
                  <HugeiconsIcon
                    icon={stat.icon}
                    size={24}
                    className="4k:w-10 4k:h-10"
                  />
                </div>
                <span className="font-mono text-micro 4k:text-base uppercase tracking-widest text-muted-foreground font-semibold">
                  METRIC_0{i + 1}
                </span>
              </div>

              <div className="font-display font-bold text-4xl sm:text-5xl 4k:text-7xl text-foreground group-hover:text-pnp-orange transition-colors">
                {stat.value}
              </div>

              <p className="font-sans font-semibold text-base sm:text-lg 4k:text-2xl text-foreground mt-3 4k:mt-5">
                {stat.label}
              </p>
              <p className="font-mono text-micro 4k:text-base uppercase tracking-wider text-muted-foreground mt-1">
                {stat.sublabel}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
