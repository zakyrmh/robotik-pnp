"use client";

import { motion } from "framer-motion";
import Link from "next/link";
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
        className="mb-16"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-block border border-hairline-dark px-3 py-1 bg-surface-card-dark rounded-sm mb-6"
        >
          <span className="font-mono text-[12px] uppercase tracking-[1.5px] font-medium text-cyber-blue">
            Divisi Riset &amp; Kompetisi
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="font-sans text-[40px] md:text-[64px] font-bold uppercase tracking-tight text-white mb-6"
        >
          Eksplorasi Divisi
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18 }}
          className="font-sans text-[16px] font-light leading-relaxed text-gray-400 max-w-2xl"
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
                "group block bg-surface-card-dark border border-hairline-dark rounded-sm p-8 transition-all duration-300 h-full",
                "hover:border-tech-navy hover:shadow-[0_0_12px_rgba(0,102,177,0.2)]",
                "relative overflow-hidden",
              )}
            >
              {/* Card Accent Strip */}
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-cyber-blue via-tech-navy to-crimson-red opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="mb-8">
                <span className="font-mono text-[28px] font-bold text-gray-600 opacity-30 group-hover:opacity-50 transition-opacity duration-300">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              <h2 className="font-sans text-[28px] font-bold uppercase mb-4 text-white group-hover:text-cyber-blue transition-colors duration-300">
                {div.name}
              </h2>

              <p className="font-sans text-[14px] font-light text-gray-400 line-clamp-3 mb-6">
                {div.description}
              </p>

              <div className="flex items-center text-cyber-blue font-mono text-[12px] uppercase tracking-[1.5px] font-medium group-hover:text-tech-navy transition-colors">
                <span>Akses Data Teknis</span>
                <span className="ml-2 transform group-hover:translate-x-2 transition-transform duration-300">
                  →
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}
