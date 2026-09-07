"use client";

import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative min-h-[55vh] sm:min-h-[60vh] flex items-center justify-center bg-background text-foreground overflow-hidden border-b border-border mt-6 sm:mt-0 py-16 sm:py-20 lg:py-24 transition-colors duration-200">
      {/* Ambient background highlights */}
      <div className="absolute top-1/4 right-1/4 w-80 sm:w-120 h-80 sm:h-120 rounded-full bg-primary/5 dark:bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-accent-strong/5 dark:bg-accent-strong/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        {/* Eyebrow Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card/80 dark:bg-card/40 backdrop-blur-xs text-xs font-mono text-foreground shadow-2xs mb-6"
        >
          <span className="size-2 rounded-full bg-accent-strong animate-pulse" />
          <span className="font-semibold text-accent-strong uppercase tracking-wider">
            IDENTITAS ORGANISASI // UKM-R PNP
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display font-bold text-3xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-foreground leading-[1.1] uppercase mb-6 max-w-4xl text-balance"
        >
          UNIT KEGIATAN MAHASISWA ROBOTIK{" "}
          <span className="text-primary">POLITEKNIK NEGERI PADANG</span>
        </motion.h1>

        {/* Accent Divider */}
        <div className="h-1 w-16 sm:w-20 bg-accent-strong rounded-full mb-6" />

        {/* Sub Headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-body text-muted-foreground text-sm sm:text-base lg:text-lg leading-relaxed max-w-3xl text-pretty"
        >
          Unit Kegiatan Mahasiwa Robotik selanjutnya disingkat UKM-R merupakan
          lembaga yang bergerak dibidang Robotik yang berkoordinasi dengan BEM
          POLITEKNIK NEGERI PADANG dalam bentuk semi otonom. Segala aktifitasnya
          adalah membentuk dan mengembangkan minat dan bakat masyarakat kampus
          untuk mengikuti perkembangan teknologi khususnya dalam dunia Robotika.
        </motion.p>
      </div>
    </section>
  );
}
