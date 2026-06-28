"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface HeroSectionProps {
  badge: string;
  title: string;
  subtitle: string;
  image: string;
}

export function HeroSection({
  badge,
  title,
  subtitle,
  image,
}: HeroSectionProps) {
  // Animasi masuk (entrance animation) dari halaman utama divisi
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const, staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="relative w-full bg-canvas-dark text-foreground pt-24 pb-16 overflow-hidden">
      {/* Dynamic Background Glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 70% 50%, var(--color-cyber-blue) 0%, transparent 60%)",
        }}
      />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Kolom Kiri: Identitas */}
          <div className="space-y-6">
            <motion.div variants={itemVariants} className="inline-block">
              <span className="px-3 py-1 font-jetbrains text-mono-eyebrow rounded-sm uppercase tracking-wider text-white bg-cyber-blue">
                {badge}
              </span>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h1 className="text-display-lg md:text-display-xl font-bold uppercase tracking-tight leading-none mb-4">
                {title}
              </h1>
              <div className="w-16 h-1 bg-crimson-red" />
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-body-md text-muted-foreground leading-relaxed max-w-lg"
            >
              {subtitle}
            </motion.p>
          </div>

          {/* Kolom Kanan: Aset Visual Utama */}
          <motion.div
            variants={itemVariants}
            className="relative h-[400px] lg:h-[500px] w-full"
          >
            <div className="absolute inset-0 border border-hairline-dark bg-surface-card-dark rounded-sm overflow-hidden relative w-full h-full">
              <Image
                src={image}
                alt={`Robot ${title}`}
                className="object-cover opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all duration-700 hover:scale-105"
                fill
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-canvas-dark via-transparent to-transparent opacity-80" />
            </div>

            {/* Dekorasi HUD Cyber */}
            <div className="absolute bottom-4 left-4 font-jetbrains text-xs text-cyber-blue uppercase tracking-widest opacity-60">
              SYS_ACTIVE :: {title.split("-")[0]}
            </div>
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-crimson-red opacity-80" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-crimson-red opacity-80" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
