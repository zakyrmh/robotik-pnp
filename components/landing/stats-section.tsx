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

const stats = [
  {
    icon: ChampionIcon,
    value: "47+",
    label: "Total Prestasi",
    sublabel: "Nasional & Regional",
    color: "#0066b1",
  },
  {
    icon: UserGroupIcon,
    value: "120+",
    label: "Anggota Aktif",
    sublabel: "Tersebar di 5 Divisi",
    color: "#1c69d4",
  },
  {
    icon: BuildingIcon,
    value: "5",
    label: "Divisi Robot",
    sublabel: "Aktif Berkompetisi",
    color: "#0066b1",
  },
  {
    icon: Calendar01Icon,
    value: "10+",
    label: "Tahun Berdiri",
    sublabel: "Pengalaman Rekayasa",
    color: "#e22718",
  },
];

const partners = [
  "PENS",
  "ITS",
  "UGM",
  "ITB",
  "UNAND",
  "POLMED",
  "POLBAN",
  "KEMENRISTEKDIKTI",
];

function AnimatedCounter({ value }: { value: string }) {
  return (
    <span className="font-sans font-bold text-[40px] leading-none text-white">
      {value}
    </span>
  );
}

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

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

        {/* Map/strength section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 border border-hairline-dark bg-surface-card-dark p-8"
        >
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            {/* Left: Map dots visualization */}
            <div className="flex-1">
              <p className="font-mono text-[11px] uppercase tracking-[2px] text-cyber-blue mb-4">
                — Peta Kehadiran Kompetisi
              </p>
              <h3 className="font-sans font-bold text-[24px] uppercase text-white mb-6">
                Jejak Kompetisi Nasional
              </h3>

              {/* Simple dot map of Indonesia regions */}
              <div className="relative h-[160px] bg-canvas-dark border border-hairline-dark overflow-hidden">
                <div
                  className="absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage: `radial-gradient(circle, rgba(0,102,177,1) 1px, transparent 1px)`,
                    backgroundSize: "16px 16px",
                  }}
                />
                {/* Competition location dots */}
                {[
                  {
                    x: "12%",
                    y: "55%",
                    label: "Padang",
                    active: true,
                    color: "#0066b1",
                  },
                  {
                    x: "28%",
                    y: "48%",
                    label: "Medan",
                    active: false,
                    color: "#0066b1",
                  },
                  {
                    x: "45%",
                    y: "60%",
                    label: "Jakarta",
                    active: true,
                    color: "#1c69d4",
                  },
                  {
                    x: "54%",
                    y: "62%",
                    label: "Bandung",
                    active: true,
                    color: "#1c69d4",
                  },
                  {
                    x: "63%",
                    y: "58%",
                    label: "Yogyakarta",
                    active: true,
                    color: "#0066b1",
                  },
                  {
                    x: "72%",
                    y: "55%",
                    label: "Surabaya",
                    active: true,
                    color: "#e22718",
                  },
                  {
                    x: "85%",
                    y: "50%",
                    label: "Makassar",
                    active: false,
                    color: "#0066b1",
                  },
                ].map((dot, idx) => (
                  <div
                    key={dot.label}
                    className="absolute flex flex-col items-center gap-1"
                    style={{
                      left: dot.x,
                      top: dot.y,
                      transform: "translate(-50%,-50%)",
                    }}
                  >
                    <motion.div
                      animate={
                        dot.active
                          ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }
                          : {}
                      }
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: (idx * 0.4) % 2,
                      }}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: dot.color,
                        boxShadow: `0 0 8px ${dot.color}`,
                      }}
                    />
                    <span className="font-mono text-[8px] uppercase tracking-wider text-white/40 whitespace-nowrap">
                      {dot.label}
                    </span>
                  </div>
                ))}
                {/* Connecting lines (SVG) */}
                <svg
                  className="absolute inset-0 w-full h-full opacity-20"
                  preserveAspectRatio="none"
                >
                  <polyline
                    points="12,88 28,77 45,96 54,99 63,93 72,88 85,80"
                    fill="none"
                    stroke="#0066b1"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                </svg>
              </div>
            </div>

            {/* Right: Partners */}
            <div className="lg:w-72 shrink-0">
              <p className="font-mono text-[11px] uppercase tracking-[2px] text-cyber-blue mb-4">
                — Mitra & Kompetitor
              </p>
              <div className="grid grid-cols-2 gap-2">
                {partners.map((partner) => (
                  <div
                    key={partner}
                    className="border border-hairline-dark px-3 py-2 hover:border-cyber-blue transition-colors duration-200 cursor-default"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-white/50 hover:text-white/80 transition-colors duration-200">
                      {partner}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
