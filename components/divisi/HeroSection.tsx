"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { CpuIcon } from "@hugeicons/core-free-icons";

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
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="relative w-full bg-background text-foreground pt-24 sm:pt-28 pb-16 overflow-hidden border-b border-border">
      {/* Background Radial Glow */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 75% 40%, rgba(249, 115, 22, 0.08) 0%, rgba(30, 58, 138, 0.08) 40%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Column: Information */}
          <div className="space-y-6">
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 bg-orange-wash dark:bg-pnp-orange/15 border border-pnp-orange/30 px-3.5 py-1.5 rounded-full font-mono text-micro uppercase font-semibold tracking-wider text-orange-deep dark:text-pnp-orange shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-pnp-orange animate-pulse" />
                {badge}
              </span>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold uppercase tracking-tight leading-none text-foreground mb-4">
                {title}
              </h1>
              <div className="w-16 h-1 bg-pnp-orange rounded-full" />
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="font-sans text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl font-normal"
            >
              {subtitle}
            </motion.p>
          </div>

          {/* Right Column: Visual Blueprint Card */}
          <motion.div
            variants={itemVariants}
            className="relative h-[320px] sm:h-[400px] lg:h-[460px] w-full rounded-xl border border-border bg-card overflow-hidden shadow-blueprint group"
          >
            <Image
              src={image}
              alt={`Robot ${title}`}
              className="object-cover opacity-95 group-hover:scale-105 transition-transform duration-700"
              fill
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

            {/* Precision HUD Overlay */}
            <div className="absolute bottom-4 left-4 font-mono text-xs text-pnp-orange uppercase tracking-widest bg-background/90 backdrop-blur-md px-3.5 py-1.5 rounded-md border border-border shadow-xs flex items-center gap-2 font-semibold">
              <HugeiconsIcon icon={CpuIcon} size={14} />
              <span>SYS_ACTIVE :: {title.split("-")[0]}</span>
            </div>

            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-pnp-orange opacity-80" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-pnp-orange opacity-80" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
