"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = "Memuat data..." }: PageLoaderProps) {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-background text-foreground transition-colors duration-200">
      {/* Blueprint Grid & Technical Overlay */}
      <div className="absolute inset-0 blueprint-grid-bg opacity-40 pointer-events-none" />

      {/* Ambient Glow Orbs (Biru Dongker & Oranye PNP) */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-dongker-surface/10 dark:bg-dongker-surface/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 translate-y-1/2 w-72 h-72 rounded-full bg-pnp-orange/10 dark:bg-pnp-orange/15 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative flex flex-col items-center gap-6 px-4 text-center z-10"
      >
        {/* Logo Card with Blueprint Hairline Border */}
        <motion.div
          initial={{ scale: 0.8, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{
            duration: 0.5,
            type: "spring",
            stiffness: 220,
            damping: 18,
          }}
          className="relative"
        >
          <div className="absolute -inset-2 rounded-2xl bg-pnp-orange/20 blur-xl opacity-60 animate-pulse pointer-events-none" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-card border border-border dark:border-white/15 p-3.5 shadow-md flex items-center justify-center backdrop-blur-xs">
            <Image
              src="/images/logo-ukm-robotik-pnp.webp"
              alt="UKM Robotik PNP"
              width={64}
              height={64}
              className="object-contain p-1"
              priority
            />
          </div>
        </motion.div>

        {/* Text Area & Eyebrow */}
        <div className="flex flex-col items-center gap-2">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[2px] font-semibold text-pnp-orange bg-orange-wash dark:bg-pnp-orange/15 border border-pnp-orange/30 px-3 py-1 rounded-full pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-pnp-orange animate-pulse" />
            SYSTEM INITIALIZING
          </div>

          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-foreground uppercase">
            UKM ROBOTIK PNP
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-mono uppercase tracking-wider font-medium">
            {message}
          </p>
        </div>

        {/* Precision Progress Bar */}
        <div className="w-48 sm:w-56 space-y-3.5 mt-1">
          <div className="h-1.5 w-full bg-muted border border-border/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-dongker-surface via-pnp-orange to-dongker-surface rounded-full"
              style={{ backgroundSize: "200% 100%" }}
              animate={{ backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </div>

          {/* Bouncing PNP Orange Dots */}
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-pnp-orange"
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
