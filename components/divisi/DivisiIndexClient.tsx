"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Cpu, Layers } from "lucide-react";
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
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card/80 dark:bg-card/40 backdrop-blur-xs text-xs font-mono text-accent-strong shadow-2xs mb-4"
        >
          <span className="size-2 rounded-full bg-accent-strong animate-pulse" />
          <span className="font-semibold uppercase tracking-wider">
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
          className="font-body text-sm sm:text-base text-muted-foreground font-normal leading-relaxed max-w-2xl text-pretty"
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
                "group block bg-card border border-border rounded-xl p-6 sm:p-7 transition-all duration-200 h-full flex flex-col justify-between shadow-2xs",
                "hover:border-primary/50 hover:shadow-soft hover:-translate-y-0.5",
                "relative overflow-hidden",
              )}
            >
              {/* Card Top Accent Strip */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-border group-hover:bg-primary transition-colors duration-200" />

              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-2xl sm:text-3xl font-bold text-muted-foreground/30 group-hover:text-primary/40 transition-colors">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="size-9 rounded-lg bg-secondary border border-border text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Cpu className="size-4.5" />
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="font-display text-xl sm:text-2xl font-bold uppercase text-foreground group-hover:text-primary transition-colors duration-200">
                    {div.name}
                  </h2>
                </div>

                {div.badge_label && (
                  <span className="inline-block font-mono text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-accent text-accent-foreground dark:bg-accent/20 border border-border mb-3">
                    {div.badge_label}
                  </span>
                )}

                <p className="font-body text-xs sm:text-sm font-normal text-muted-foreground line-clamp-3 mb-6 leading-relaxed">
                  {div.description}
                </p>
              </div>

              <div className="flex items-center justify-between text-primary font-body text-xs font-semibold group-hover:text-primary-hover transition-colors pt-4 border-t border-border/70">
                <span>Lihat Profil Divisi</span>
                <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>
        ))}

        {/* Join / Recruitment Info Card to balance the grid on desktop */}
        <motion.div variants={itemVariants}>
          <div className="bg-primary/5 dark:bg-primary/10 border border-dashed border-primary/30 rounded-xl p-6 sm:p-7 h-full flex flex-col justify-between">
            <div>
              <div className="size-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center mb-4">
                <Layers className="size-4.5" />
              </div>
              <h2 className="font-display font-bold text-xl uppercase text-foreground mb-2">
                Tertarik Bergabung?
              </h2>
              <p className="font-body text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Pilih divisi yang sesuai dengan minat dan keahlian Anda, mulai
                dari mekanik, elektronika kontrol, hingga computer vision dan
                kecerdasan buatan.
              </p>
            </div>

            <div className="pt-6">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 w-full font-body font-medium text-xs sm:text-sm px-4 py-3 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md shadow-xs transition-all active:scale-[0.98] min-h-[44px]"
              >
                <span>Pendaftaran Calon Anggota</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
