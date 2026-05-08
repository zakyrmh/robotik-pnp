"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = "Memuat data..." }: PageLoaderProps) {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-background">
      {/* Background Pattern - Menggunakan OKLCH foreground dengan opacity rendah */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex flex-col items-center gap-8"
      >
        {/* Logo dengan Glow Effect */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.5,
            type: "spring",
            stiffness: 200,
            damping: 15,
          }}
          className="relative"
        >
          <div className="absolute inset-0 blur-3xl opacity-20">
            <div className="w-24 h-24 bg-linear-to-r from-indigo-500 to-purple-600 rounded-full" />
          </div>
          <div className="relative w-20 h-20 rounded-2xl bg-card shadow-2xl p-4 ring-1 ring-border/50">
            <Image
              src="/images/logo-ukm-robotik-pnp.webp"
              alt="Robotik PNP"
              width={64}
              height={64}
              className="object-contain p-2"
              priority
            />
          </div>
        </motion.div>

        {/* Text Area */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
            Robotik PNP
          </h1>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
            {message}
          </p>
        </div>

        {/* Modern Progress Bar (Tailwind 4 Syntax) */}
        <div className="w-48 space-y-4">
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full"
              style={{ backgroundSize: "200% 100%" }}
              animate={{ backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </div>
          {/* Bouncing Dots */}
          <div className="flex items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
