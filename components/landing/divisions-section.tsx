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
    tag: "Flagship",
  },
  {
    id: "krsbi-b",
    code: "KRSBI-B",
    name: "Sepak Bola Robot Beroda",
    category: "Divisi 02",
    description:
      "Robot beroda yang bermain sepak bola sesungguhnya, dengan sistem visi komputer dan koordinasi tim real-time.",
    skills: ["Computer Vision", "Locomotion", "Ball Control"],
    tag: "Populer",
  },
  {
    id: "krsbi-h",
    code: "KRSBI-H",
    name: "Sepak Bola Robot Humanoid",
    category: "Divisi 03",
    description:
      "Robot humanoid bipedal yang bergerak layaknya manusia dan bertanding dalam pertandingan sepak bola 5 lawan 5.",
    skills: ["Bipedal Walking", "Balance Control", "AI Decision"],
    tag: "Humanoid",
  },
  {
    id: "krsti",
    code: "KRSTI",
    name: "Kontes Robot Seni Tari Indonesia",
    category: "Divisi 04",
    description:
      "Robot humanoid yang menarikan tari tradisional Indonesia dengan sinkronisasi musik dan gerakan presisi milimeter.",
    skills: ["Motion Planning", "Rhythm Sync", "Servo Control"],
    tag: "Budaya",
  },
  {
    id: "krsri",
    code: "KRSRI",
    name: "Kontes Robot SAR Indonesia",
    category: "Divisi 05",
    description:
      "Robot pencari dan penyelamat korban bencana — mensimulasikan operasi SAR nyata di medan rusak dan berantakan.",
    skills: ["SLAM Navigation", "Sensor Fusion", "Autonomous SAR"],
    tag: "SAR",
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
          tag: div.badge_label || "Robot",
        }))
      : defaultDivisions;

  return (
    <section
      className="bg-mist-gray/40 dark:bg-dongker-ink/40 py-16 sm:py-20 4k:py-36 border-t border-border transition-colors duration-200"
      ref={ref}
    >
      <div className="max-w-330 2xl:max-w-384 4k:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 4k:px-20">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 4k:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="font-mono text-micro sm:text-xs 4k:text-lg font-semibold uppercase tracking-[2px] text-pnp-orange block mb-2">
              — EKSPLORASI DIVISI
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl 4k:text-6xl uppercase text-foreground leading-none">
              5 DIVISI <span className="text-pnp-orange">ROBOT KOMPETISI</span>
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground text-sm sm:text-base 4k:text-2xl font-light leading-relaxed max-w-md 4k:max-w-xl"
          >
            Setiap divisi membawa tantangan rekayasa unik — dari robot humanoid
            bipedal hingga unit SAR otonom di medan bencana.
          </motion.p>
        </div>

        {/* Section Divider */}
        <div className="dashed-divider mb-12 4k:mb-20" />

        {/* Divisions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 4k:gap-12">
          {renderedDivisions.map((div, i) => (
            <motion.div
              key={div.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`bg-card dark:bg-[#112240] border border-border dark:border-white/12 rounded-xl p-6 sm:p-8 4k:p-12 shadow-blueprint hover:border-pnp-orange/40 transition-all duration-300 relative flex flex-col group overflow-hidden ${
                i === 4 ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              {/* Left edge 4px vertical accent */}
              <div className="absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 bg-dongker-surface dark:bg-pnp-orange/60 group-hover:bg-pnp-orange transition-colors duration-300" />

              <div className="flex flex-col flex-1">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="font-mono text-micro 4k:text-base uppercase tracking-widest text-pnp-orange font-semibold block mb-1">
                      {div.category}
                    </span>
                    <h3 className="font-display font-bold text-2xl 4k:text-4xl uppercase text-foreground group-hover:text-pnp-orange transition-colors">
                      {div.code}
                    </h3>
                  </div>

                  {/* Status Badge per DESIGN.md */}
                  <span className="font-mono text-micro 4k:text-base uppercase tracking-wider font-semibold px-2.5 py-1 4k:px-4 4k:py-2 rounded-full bg-orange-wash dark:bg-pnp-orange/15 text-orange-deep dark:text-pnp-orange border border-pnp-orange/30">
                    {div.tag}
                  </span>
                </div>

                {/* Full name */}
                <p className="font-mono text-micro 4k:text-base uppercase tracking-wider text-muted-foreground mb-4 font-medium">
                  {div.name}
                </p>

                {/* Description */}
                <p className="text-muted-foreground text-sm sm:text-base 4k:text-xl font-light leading-relaxed mb-6 flex-1">
                  {div.description}
                </p>

                {/* Skills Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {div.skills.map((skill) => (
                    <span
                      key={skill}
                      className="font-mono text-micro 4k:text-base uppercase tracking-wider px-2.5 py-1 4k:px-4 4k:py-2 rounded-md bg-muted dark:bg-white/5 text-muted-foreground dark:text-slate-300 border border-border dark:border-white/10 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* CTA Link */}
                <Link
                  href={`/divisi/${div.id}`}
                  className="inline-flex items-center gap-2 font-mono text-xs 4k:text-lg font-semibold uppercase tracking-wider text-pnp-orange hover:text-dongker-surface dark:hover:text-white transition-all mt-auto group/link"
                >
                  Lihat Detail
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={14}
                    className="group-hover/link:translate-x-1 transition-transform duration-200 4k:w-6 4k:h-6"
                  />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex justify-center mt-12 4k:mt-20"
        >
          <Link
            href="/divisi"
            className="inline-flex items-center gap-3 font-mono text-xs sm:text-sm 4k:text-xl font-semibold uppercase tracking-[1.5px] px-8 py-3.5 4k:px-12 4k:py-6 bg-dongker-surface text-white hover:bg-dongker-hover dark:bg-pnp-orange dark:hover:bg-pnp-orange/90 rounded-md shadow-md transition-all group"
          >
            Lihat Semua Divisi
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={16}
              className="group-hover:translate-x-1 transition-transform duration-200 4k:w-6 4k:h-6"
            />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
