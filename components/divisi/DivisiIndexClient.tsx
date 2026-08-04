"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, CpuIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface Division {
  slug: string;
  name: string;
  description: string;
  badge_label: string;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function DivisiIndexClient({ divisions }: { divisions: Division[] }) {
  return (
    <>
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mb-12 sm:mb-16"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 bg-orange-wash dark:bg-pnp-orange/15 border border-pnp-orange/30 px-3.5 py-1.5 rounded-full mb-4 shadow-xs"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-pnp-orange animate-pulse" />
          <span className="font-mono text-micro uppercase tracking-[2px] font-semibold text-orange-deep dark:text-pnp-orange">
            DIVISI RISET &amp; KOMPETISI
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="font-display text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight text-foreground mb-4"
        >
          Eksplorasi Divisi
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18 }}
          className="font-sans text-sm sm:text-base text-muted-foreground font-normal leading-relaxed max-w-2xl"
        >
          Sistem klasifikasi riset terpusat UKM Robotik PNP. Jelajahi
          spesifikasi teknis, dokumentasi, dan rekam jejak dari setiap divisi
          robotika di bawah standar Kontes Robot Indonesia (KRI).
        </motion.p>
      </motion.div>

      {/* Grid Cards dengan stagger */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {divisions.map((div, i) => (
          <motion.div key={div.slug} variants={itemVariants}>
            <Link
              href={`/divisi/${div.slug}`}
              className={cn(
                "group block bg-card border border-border rounded-xl p-6 sm:p-8 transition-all duration-300 h-full flex flex-col justify-between",
                "hover:border-pnp-orange/60 hover:shadow-blueprint hover:-translate-y-1",
                "relative overflow-hidden",
              )}
            >
              {/* Card Top Accent Strip */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-dongker-surface via-pnp-orange to-dongker-ink opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-2xl sm:text-3xl font-bold text-muted-foreground/30 group-hover:text-pnp-orange/40 transition-colors">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="p-2 rounded-md bg-muted/60 text-muted-foreground group-hover:text-pnp-orange group-hover:bg-orange-wash/50 dark:group-hover:bg-pnp-orange/10 transition-colors">
                    <HugeiconsIcon icon={CpuIcon} size={18} />
                  </div>
                </div>

                <h2 className="font-display text-xl sm:text-2xl font-bold uppercase mb-3 text-foreground group-hover:text-pnp-orange transition-colors duration-300">
                  {div.name}
                </h2>

                <p className="font-sans text-xs sm:text-sm font-normal text-muted-foreground line-clamp-3 mb-6 leading-relaxed">
                  {div.description}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-pnp-orange font-mono text-micro uppercase tracking-[1.5px] font-semibold group-hover:translate-x-1 transition-transform pt-4 border-t border-border/40">
                <span>Lihat Profil Divisi</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}
