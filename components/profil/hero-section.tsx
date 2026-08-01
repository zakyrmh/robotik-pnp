"use client";

import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative min-h-[65vh] 4k:min-h-[60vh] flex items-center justify-center bg-background text-foreground overflow-hidden border-b border-border py-16 sm:py-24 4k:py-40 blueprint-grid-bg transition-colors duration-200">
      {/* Top Tricolor Accent Stripe */}
      <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-dongker-surface via-pnp-orange to-dongker-ink" />

      {/* Ambient Orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.25, 0.12] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] right-[-5%] w-112.5 sm:w-150 4k:w-[1000px] h-112.5 sm:h-150 4k:h-[1000px] rounded-full bg-dongker-surface/10 dark:bg-dongker-surface/25 blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.22, 0.12] }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-[-15%] left-[-5%] w-100 sm:w-125 4k:w-[800px] h-100 sm:h-125 4k:h-[800px] rounded-full bg-pnp-orange/10 dark:bg-pnp-orange/20 blur-3xl pointer-events-none"
      />

      <div className="relative z-10 max-w-330 2xl:max-w-384 4k:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 4k:px-20 text-center flex flex-col items-center">
        {/* Eyebrow Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2.5 font-mono text-micro sm:text-xs 4k:text-base uppercase tracking-[2px] font-semibold text-orange-deep dark:text-pnp-orange bg-orange-wash dark:bg-pnp-orange/15 border border-pnp-orange/30 px-4 py-1.5 rounded-full shadow-xs mb-6"
        >
          <span className="w-2 h-2 4k:w-3 4k:h-3 rounded-full bg-pnp-orange animate-pulse" />
          IDENTITAS ORGANISASI // UKM-R PNP
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display font-bold text-3xl sm:text-5xl md:text-6xl lg:text-7xl 2xl:text-8xl 4k:text-9xl leading-[1.08] uppercase tracking-tight text-foreground mb-6 max-w-4xl 2xl:max-w-5xl 4k:max-w-7xl"
        >
          UNIT KEGIATAN MAHASISWA ROBOTIK{" "}
          <span className="text-pnp-orange">POLITEKNIK NEGERI PADANG</span>
        </motion.h1>

        {/* PNP Orange Accent Divider */}
        <div className="h-1 sm:h-1.5 4k:h-3 w-20 sm:w-28 4k:w-44 bg-pnp-orange rounded-full mb-6" />

        {/* Sub Headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-muted-foreground text-sm sm:text-base lg:text-lg 2xl:text-xl 4k:text-3xl font-light leading-relaxed max-w-3xl 4k:max-w-5xl"
        >
          Unit Kegiatan Mahasiwa Robotik selanjutnya disingkat UKM-R merupakan
          lembaga yang bergerak dibidang Robotik yang berkoordinasi dengan BEM
          POLITEKNIK NEGERI PADANG dalam bentuk semi otonom. Segala aktifitasnya
          adalah membentuk dan mengembangkan minat dan bakat masyarakat kampus
          untuk mengikuti perkembangan teknologi khususnya dalam dunia Robotika.
        </motion.p>
      </div>

      {/* Bottom Tricolor Accent Stripe */}
      <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-linear-to-r from-dongker-surface via-pnp-orange to-dongker-ink" />
    </section>
  );
}
