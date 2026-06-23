"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

interface DBDivision {
  slug: string;
  name: string;
  short_description: string;
  badge_label: string | null;
  badge_color: string | null;
  accent_color: string | null;
  sort_order: number;
  tags: string[];
}

interface DivisionsSectionProps {
  divisions?: DBDivision[];
}

const longNameMap: Record<string, string> = {
  krai: "Kontes Robot ABU Indonesia",
  "krsbi-b": "Sepak Bola Robot Beroda",
  "krsbi-h": "Sepak Bola Robot Humanoid",
  krsti: "Kontes Robot Seni Tari Indonesia",
  krsri: "Kontes Robot SAR Indonesia",
};

const defaultDivisions = [
  {
    id: "krai",
    code: "KRAI",
    name: "Kontes Robot ABU Indonesia",
    category: "Divisi 01",
    description:
      "Robot beroda maupun berkaki yang bertempur dalam arena ABU Robocon — tantangan teknis tertinggi di skala Asia.",
    skills: ["Kontrol Otomatis", "Navigasi Lapangan", "Strategi Tim"],
    accent: "#0066b1",
    tag: "Flagship",
    tagColor: "#e22718",
  },
  {
    id: "krsbi-b",
    code: "KRSBI-B",
    name: "Sepak Bola Robot Beroda",
    category: "Divisi 02",
    description:
      "Robot beroda yang bermain sepak bola sesungguhnya, dengan sistem visi komputer dan koordinasi tim real-time.",
    skills: ["Computer Vision", "Locomotion", "Ball Control"],
    accent: "#1c69d4",
    tag: "Populer",
    tagColor: "#1c69d4",
  },
  {
    id: "krsbi-h",
    code: "KRSBI-H",
    name: "Sepak Bola Robot Humanoid",
    category: "Divisi 03",
    description:
      "Robot humanoid bipedal yang bergerak layaknya manusia and bertanding dalam pertandingan sepak bola 5 lawan 5.",
    skills: ["Bipedal Walking", "Balance Control", "AI Decision"],
    accent: "#0066b1",
    tag: "Humanoid",
    tagColor: "#0066b1",
  },
  {
    id: "krsti",
    code: "KRSTI",
    name: "Kontes Robot Seni Tari Indonesia",
    category: "Divisi 04",
    description:
      "Robot humanoid yang menarikan tari tradisional Indonesia dengan sinkronisasi musik dan gerakan presisi milimeter.",
    skills: ["Motion Planning", "Rhythm Sync", "Servo Control"],
    accent: "#1c69d4",
    tag: "Budaya",
    tagColor: "#1c69d4",
  },
  {
    id: "krsri",
    code: "KRSRI",
    name: "Kontes Robot SAR Indonesia",
    category: "Divisi 05",
    description:
      "Robot pencari dan penyelamat korban bencana — mensimulasikan operasi SAR nyata di medan rusak dan berantakan.",
    skills: ["SLAM Navigation", "Sensor Fusion", "Autonomous SAR"],
    accent: "#e22718",
    tag: "SAR",
    tagColor: "#e22718",
  },
];

export function DivisionsSection({
  divisions: dbDivisions,
}: DivisionsSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const renderedDivisions =
    dbDivisions && dbDivisions.length > 0
      ? dbDivisions.map((div) => ({
          id: div.slug,
          code: div.name,
          name: longNameMap[div.slug] || div.name,
          category: `Divisi ${String(div.sort_order).padStart(2, "0")}`,
          description: div.short_description,
          skills: div.tags,
          accent: div.accent_color || "#0066b1",
          tag: div.badge_label || "Robot",
          tagColor: div.badge_color || "#0066b1",
        }))
      : defaultDivisions;

  return (
    <section className="bg-surface-soft-light py-20" ref={ref}>
      <div className="max-w-[1320px] mx-auto px-6">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="font-mono text-[11px] font-medium uppercase tracking-[2px] text-cyber-blue block mb-3">
              — Eksplorasi Divisi
            </span>
            <h2 className="font-sans font-bold text-[36px] md:text-[42px] uppercase text-canvas-dark leading-none">
              5 Divisi
              <br />
              <span className="text-cyber-blue">Robot Kompetisi</span>
            </h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-canvas-dark/60 text-base font-light leading-relaxed max-w-md"
          >
            Setiap divisi membawa tantangan rekayasa yang unik — dari robot
            humanoid menari hingga unit SAR otonom di medan bencana.
          </motion.p>
        </div>

        {/* Tricolor divider */}
        <div className="h-[3px] bg-linear-to-r from-cyber-blue via-tech-navy to-crimson-red mb-14" />

        {/* Divisions grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-hairline-light">
          {renderedDivisions.map((div, i) => (
            <motion.div
              key={div.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`bg-white group hover:bg-canvas-dark transition-all duration-400 cursor-default relative flex flex-col ${
                i === 4 ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              {/* Top accent */}
              <div
                className="h-[3px] w-0 group-hover:w-full transition-all duration-500"
                style={{ background: div.accent }}
              />

              <div className="p-8 flex flex-col flex-1">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[2px] text-cyber-blue group-hover:text-cyber-blue mb-1">
                      {div.category}
                    </p>
                    <h3 className="font-sans font-bold text-[28px] uppercase text-canvas-dark group-hover:text-white leading-none transition-colors duration-400">
                      {div.code}
                    </h3>
                  </div>
                  <span
                    className="font-mono text-[9px] uppercase tracking-[1.5px] px-2 py-1 border"
                    style={{
                      color: div.tagColor,
                      borderColor: div.tagColor,
                      background: `${div.tagColor}15`,
                    }}
                  >
                    {div.tag}
                  </span>
                </div>

                {/* Full name */}
                <p className="font-mono text-[10px] uppercase tracking-[1px] text-canvas-dark/40 group-hover:text-white/40 mb-4 transition-colors duration-400">
                  {div.name}
                </p>

                {/* Description */}
                <p className="text-canvas-dark/60 group-hover:text-white/60 text-sm font-light leading-relaxed mb-6 flex-1 transition-colors duration-400">
                  {div.description}
                </p>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {div.skills.map((skill) => (
                    <span
                      key={skill}
                      className="font-mono text-[9px] uppercase tracking-[1px] px-2.5 py-1 border border-hairline-light group-hover:border-hairline-dark text-canvas-dark/50 group-hover:text-white/40 transition-all duration-400"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  href={`/divisi/${div.id}`}
                  className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[1.5px] text-cyber-blue hover:gap-4 transition-all duration-200 mt-auto group/link"
                >
                  Lihat Detail
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={14}
                    className="group-hover/link:translate-x-1 transition-transform duration-200"
                  />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View all CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex justify-center mt-12"
        >
          <Link
            href="/divisi"
            className="inline-flex items-center gap-3 font-mono text-[12px] font-medium uppercase tracking-[1.5px] px-8 py-3.5 bg-canvas-dark text-white hover:bg-transparent hover:text-canvas-dark border border-canvas-dark transition-all duration-200 group"
          >
            Lihat Semua Divisi
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={16}
              className="group-hover:translate-x-1 transition-transform duration-200"
            />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
