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

function AnimatedCounter({ value }: { value: string }) {
  return (
    <span className="font-sans font-bold text-[40px] leading-none text-white">
      {value}
    </span>
  );
}

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
      color: "#0066b1",
    },
    {
      icon: UserGroupIcon,
      value: `${activeMemberCount}+`,
      label: "Anggota Aktif",
      sublabel: `Tersebar di ${divisionCount} Divisi`,
      color: "#1c69d4",
    },
    {
      icon: BuildingIcon,
      value: `${divisionCount}`,
      label: "Divisi Robot",
      sublabel: "Aktif Berkompetisi",
      color: "#0066b1",
    },
    {
      icon: Calendar01Icon,
      value: `${yearsStanding}+`,
      label: "Tahun Berdiri",
      sublabel: "Pengalaman Rekayasa",
      color: "#e22718",
    },
  ];

  return (
    <section className="bg-canvas-dark border-t border-hairline-dark" ref={ref}>
      {/* Stats row */}
      <div className="max-w-[1320px] mx-auto px-6 py-20">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 mb-14"
        >
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[2px] text-cyber-blue">
              — Social Proof
            </span>
            <h2 className="font-sans font-bold text-[36px] md:text-[42px] uppercase text-white leading-none">
              Statistika & <span className="text-cyber-blue">Kekuatan</span>
            </h2>
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-hairline-dark">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-canvas-dark p-8 group hover:bg-surface-card-dark transition-colors duration-300 cursor-default"
              style={{ boxShadow: "inset 0 0 0 0 rgba(0,102,177,0.2)" }}
            >
              <div className="mb-4">
                <HugeiconsIcon
                  icon={stat.icon}
                  size={24}
                  style={{ color: stat.color }}
                />
              </div>
              <AnimatedCounter value={stat.value} />
              <p className="font-sans font-bold text-base text-white mt-2">
                {stat.label}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-white/40 mt-1">
                {stat.sublabel}
              </p>
              {/* Bottom accent line */}
              <div
                className="mt-4 h-[2px] w-0 group-hover:w-full transition-all duration-500"
                style={{
                  background: `linear-gradient(90deg, ${stat.color}, transparent)`,
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
