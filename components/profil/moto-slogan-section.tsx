"use client";

import { motion } from "framer-motion";

export function MotoSloganSection() {
  return (
    <section className="bg-canvas-dark py-[80px] border-b border-hairline-dark relative">
      {/* Background grid representation */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-[1320px] mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Moto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-surface-card-dark border border-hairline-dark p-8 rounded-none relative"
          >
            <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-cyber-blue" />
            <span className="font-mono text-[12px] font-medium uppercase tracking-[1.5px] text-cyber-blue">
              Moto Organisasi
            </span>
            <h3 className="font-sans font-bold text-[24px] text-white mt-2 mb-4">
              &quot;No Victory Without Sacrifice&quot;
            </h3>
            <p className="text-white/70 text-[14px] font-light leading-relaxed">
              Artinya &ldquo;Tidak Ada Kemenangan Tanpa Pengorbanan&rdquo;.
              Maknanya adalah tidak ada kemenangan yang diraih tanpa usaha dan
              pengorbanan karena untuk mencapai kemenangan kita harus berjuang
              tanpa henti dan tidak kenal lelah, walau harus mengorbankan tenaga
              dan waktu kita.
            </p>
          </motion.div>

          {/* Slogan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="bg-surface-card-dark border border-hairline-dark p-8 rounded-none relative"
          >
            <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-cyber-blue" />
            <span className="font-mono text-[12px] font-medium uppercase tracking-[1.5px] text-cyber-blue">
              Slogan Organisasi
            </span>
            <h3 className="font-sans font-bold text-[24px] text-white mt-2 mb-4">
              &quot;We Play With Technology&quot;
            </h3>
            <p className="text-white/70 text-[14px] font-light leading-relaxed">
              Artinya &ldquo;Kami Bermain/Berkecimpung di Dunia
              Teknologi&rdquo;. Slogan ini mencerminkan antusiasme, kreativitas,
              dan kesenangan seluruh anggota UKM Robotik PNP dalam
              mengeksplorasi, mempelajari, dan berkarya di bidang teknologi
              robotika.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
