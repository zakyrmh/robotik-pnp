"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, FilterIcon } from "@hugeicons/core-free-icons";

const gallery = [
  {
    id: 1,
    title: "Juara 1 KRAI Regional Sumatera",
    division: "KRAI",
    year: "2024",
    event: "KRAI Sumatera — Medan",
    rank: "Juara 1",
    rankColor: "#e22718",
    bg: "#0a0f24",
    accentColor: "#0066b1",
    wide: true,
  },
  {
    id: 2,
    title: "Runner-up KRSBI-B Nasional",
    division: "KRSBI-B",
    year: "2023",
    event: "KRSBI Nasional — Surabaya",
    rank: "Juara 2",
    rankColor: "#1c69d4",
    bg: "#131a3a",
    accentColor: "#1c69d4",
    wide: false,
  },
  {
    id: 3,
    title: "Best Design KRSTI 2023",
    division: "KRSTI",
    year: "2023",
    event: "KRSTI Nasional — Jakarta",
    rank: "Best Design",
    rankColor: "#1c69d4",
    bg: "#0a0f24",
    accentColor: "#1c69d4",
    wide: false,
  },
  {
    id: 4,
    title: "Medali Emas KRSRI Regional",
    division: "KRSRI",
    year: "2024",
    event: "KRSRI Regional — Padang",
    rank: "Emas",
    rankColor: "#e22718",
    bg: "#131a3a",
    accentColor: "#e22718",
    wide: false,
  },
  {
    id: 5,
    title: "Juara 3 KRSBI-H Nasional",
    division: "KRSBI-H",
    year: "2022",
    event: "KRSBI-H Nasional — Bandung",
    rank: "Juara 3",
    rankColor: "#0066b1",
    bg: "#0a0f24",
    accentColor: "#0066b1",
    wide: false,
  },
  {
    id: 6,
    title: "Harapan I KRAI Nasional",
    division: "KRAI",
    year: "2022",
    event: "KRAI Nasional — Yogyakarta",
    rank: "Harapan I",
    rankColor: "#0066b1",
    bg: "#131a3a",
    accentColor: "#0066b1",
    wide: true,
  },
];

const filters = ["Semua", "KRAI", "KRSBI-B", "KRSBI-H", "KRSTI", "KRSRI"];

function GalleryCard({
  item,
  index,
  inView,
}: {
  item: (typeof gallery)[0];
  index: number;
  inView: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      className={`group relative overflow-hidden border border-hairline-dark ${
        item.wide ? "md:col-span-2" : ""
      }`}
      style={{ background: item.bg }}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `linear-gradient(${item.accentColor}80 1px, transparent 1px), linear-gradient(90deg, ${item.accentColor}80 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(ellipse at top left, ${item.accentColor}20 0%, transparent 60%)`,
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 p-6 flex flex-col gap-4"
        style={{ minHeight: "200px" }}
      >
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div>
            <span
              className="font-mono text-[9px] uppercase tracking-[2px] px-2 py-0.5 border"
              style={{
                color: item.rankColor,
                borderColor: item.rankColor,
                background: `${item.rankColor}15`,
              }}
            >
              {item.rank}
            </span>
          </div>
          <span className="font-mono text-[10px] text-white/30 uppercase tracking-[1px]">
            {item.year}
          </span>
        </div>

        {/* Main info */}
        <div className="flex-1 flex flex-col justify-end">
          <p
            className="font-mono text-[10px] uppercase tracking-[1.5px] mb-2"
            style={{ color: item.accentColor }}
          >
            {item.division}
          </p>
          <h3 className="font-sans font-bold text-[20px] uppercase text-white leading-tight mb-2">
            {item.title}
          </h3>
          <p className="font-mono text-[10px] text-white/40 uppercase tracking-[1px]">
            {item.event}
          </p>
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500"
        style={{ background: item.accentColor }}
      />
    </motion.div>
  );
}

export function GallerySection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [activeFilter, setActiveFilter] = useState("Semua");

  const filtered =
    activeFilter === "Semua"
      ? gallery
      : gallery.filter((g) => g.division === activeFilter);

  return (
    <section
      className="bg-canvas-dark py-20 border-t border-hairline-dark"
      ref={ref}
    >
      <div className="max-w-[1320px] mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="font-mono text-[11px] font-medium uppercase tracking-[2px] text-cyber-blue block mb-3">
              — Galeri Prestasi
            </span>
            <h2 className="font-sans font-bold text-[36px] md:text-[42px] uppercase text-white leading-none">
              Showcase
              <br />
              <span className="text-cyber-blue">Robot & Trofi</span>
            </h2>
          </motion.div>

          {/* Filter bar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <HugeiconsIcon
              icon={FilterIcon}
              size={14}
              className="text-white/30"
            />
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`font-mono text-[10px] uppercase tracking-[1.5px] px-3 py-1.5 border transition-all duration-200 ${
                  activeFilter === f
                    ? "bg-cyber-blue border-cyber-blue text-white"
                    : "border-hairline-dark text-white/40 hover:border-cyber-blue hover:text-white/70"
                }`}
              >
                {f}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Gallery grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-hairline-dark">
          {filtered.map((item, i) => (
            <GalleryCard key={item.id} item={item} index={i} inView={inView} />
          ))}
        </div>

        {/* View all */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex justify-center mt-12"
        >
          <a
            href="/prestasi"
            className="inline-flex items-center gap-3 font-mono text-[12px] font-medium uppercase tracking-[1.5px] px-8 py-3.5 bg-white text-canvas-dark hover:bg-transparent hover:text-white border border-white transition-all duration-200 group"
          >
            Lihat Semua Prestasi
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={16}
              className="group-hover:translate-x-1 transition-transform duration-200"
            />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
