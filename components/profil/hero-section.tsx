"use client";

import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center bg-canvas-dark overflow-hidden border-b border-hairline-dark">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity"
          style={{ backgroundImage: 'url("/images/logo-ukm-robotik-pnp.webp")' }}
        />
        {/* Dark overlay to ensure text readability according to guidelines */}
        <div className="absolute inset-0 bg-linear-to-b from-canvas-dark/80 via-canvas-dark/60 to-canvas-dark" />
      </div>

      {/* Background Tech Elements */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1320px] mx-auto px-6 py-20 text-center flex flex-col items-center">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="h-[2px] w-12 bg-linear-to-r from-cyber-blue to-tech-navy" />
          <span className="font-mono text-[12px] font-medium uppercase tracking-[1.5px] text-cyber-blue">
            Identitas Organisasi
          </span>
          <div className="h-[2px] w-12 bg-linear-to-r from-tech-navy to-cyber-blue" />
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-sans font-bold text-[40px] md:text-[64px] leading-[1.1] uppercase text-white mb-8 max-w-4xl"
        >
          Dapur Inovasi & Pusat Riset Teknologi Robotika <span className="text-cyber-blue">Politeknik Negeri Padang</span>
        </motion.h1>

        {/* Sub headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-white/70 text-[16px] font-light leading-relaxed max-w-3xl"
        >
          Wadah bagi mahasiswa kreatif, solutif, dan inovatif untuk mengeksplorasi potensi di bidang robotika, otomatisasi, dan kecerdasan buatan demi mengharumkan nama institusi di kancah nasional maupun internasional.
        </motion.p>
      </div>

      {/* Bottom tricolor divider */}
      <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-linear-to-r from-cyber-blue via-tech-navy to-crimson-red" />
    </section>
  );
}