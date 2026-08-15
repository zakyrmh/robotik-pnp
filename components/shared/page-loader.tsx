"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = "Memuat data..." }: PageLoaderProps) {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-background text-foreground">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative flex flex-col items-center gap-6 px-4 text-center z-10"
      >
        {/* Logo Card */}
        <motion.div
          initial={{ scale: 0.8, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{
            duration: 0.5,
            type: "spring",
            stiffness: 220,
            damping: 18,
          }}
          className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl border border-border bg-card p-3.5 shadow-soft"
        >
          <Image
            src="/images/logo-ukm-robotik-pnp.webp"
            alt="UKM Robotik PNP"
            width={64}
            height={64}
            className="h-auto w-auto object-contain p-1"
            priority
          />
        </motion.div>

        {/* Text Area */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-display text-lg sm:text-xl font-semibold tracking-tight">
            UKM Robotik PNP
          </h1>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        {/* Indeterminate Progress Bar */}
        <div className="mt-1 w-48 sm:w-56">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted border border-border">
            <motion.div
              className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-primary"
              animate={{ x: ["-120%", "420%"] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
