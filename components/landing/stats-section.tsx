"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Trophy, Users, Layers, Calendar } from "lucide-react";

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
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const stats = [
    {
      icon: Trophy,
      value: `${totalAchievements}+`,
      label: "Prestasi Resmi",
      sublabel: "Juara Tingkat Wilayah & Nasional KRI",
      accent: true,
    },
    {
      icon: Users,
      value: `${activeMemberCount}+`,
      label: "Anggota Aktif",
      sublabel: "Mahasiswa Lintas Jurusan Rekayasa",
      accent: false,
    },
    {
      icon: Layers,
      value: `${divisionCount}`,
      label: "Divisi Robot",
      sublabel: "Divisi Kompetisi Resmi Puspresnas",
      accent: false,
    },
    {
      icon: Calendar,
      value: `${yearsStanding}+ Tahun`,
      label: "Pengalaman Riset",
      sublabel: "Berdiri dan Berkompetisi Sejak 2005",
      accent: true,
    },
  ];

  return (
    <section
      className="bg-secondary/40 text-foreground py-16 sm:py-20 lg:py-24 border-t border-border transition-colors duration-200"
      ref={ref}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mb-12 sm:mb-14"
        >
          <span className="font-mono text-xs uppercase tracking-wider text-accent-strong font-semibold block mb-2">
            REKAM JEJAK & METRIK
          </span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl tracking-tight text-foreground">
            Statistika & Rekam Jejak Riset
          </h2>
          <p className="font-body text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed">
            Data operasional dan rekam prestasi kontinyu UKM Robotik Politeknik
            Negeri Padang di kancah nasional.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="bg-card border border-border rounded-xl p-6 shadow-2xs hover:border-primary/50 transition-all duration-200 relative group overflow-hidden flex flex-col justify-between"
              >
                {/* Accent top line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-0.5 ${
                    stat.accent ? "bg-accent-strong" : "bg-primary"
                  }`}
                />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-2.5 rounded-lg border border-border ${
                        stat.accent
                          ? "bg-accent text-accent-strong dark:bg-accent/20"
                          : "bg-secondary text-primary"
                      }`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                      0{i + 1}
                    </span>
                  </div>

                  <div className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-foreground font-mono tabular-nums">
                    {stat.value}
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-border/70">
                  <p className="font-body font-semibold text-sm sm:text-base text-foreground">
                    {stat.label}
                  </p>
                  <p className="font-body text-xs text-muted-foreground mt-0.5 leading-normal">
                    {stat.sublabel}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
