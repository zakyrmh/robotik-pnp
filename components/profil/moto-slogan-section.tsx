"use client";

import { motion } from "framer-motion";

export function MotoSloganSection() {
  return (
    <section className="bg-mist-gray/40 dark:bg-dongker-ink/40 py-16 sm:py-24 4k:py-40 border-b border-border relative transition-colors duration-200">
      <div className="max-w-330 2xl:max-w-384 4k:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 4k:px-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 4k:gap-14">
          {/* Moto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card dark:bg-[#112240] border border-border dark:border-white/12 rounded-xl p-6 sm:p-8 4k:p-12 shadow-blueprint relative overflow-hidden group hover:border-pnp-orange/40 transition-all duration-300"
          >
            {/* Left edge 4px accent line */}
            <div className="absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 bg-pnp-orange" />

            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-micro sm:text-xs 4k:text-base font-semibold uppercase tracking-[2px] text-pnp-orange">
                — MOTO ORGANISASI
              </span>
              <span className="font-mono text-micro 4k:text-base uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-orange-wash dark:bg-pnp-orange/15 text-orange-deep dark:text-pnp-orange border border-pnp-orange/30">
                PRINSIP JUARA
              </span>
            </div>

            <h3 className="font-display font-bold text-xl sm:text-2xl 4k:text-4xl text-foreground uppercase mb-4 group-hover:text-pnp-orange transition-colors">
              &quot;No Victory Without Sacrifice&quot;
            </h3>

            <p className="text-muted-foreground text-sm sm:text-base 4k:text-xl font-light leading-relaxed">
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
            className="bg-card dark:bg-[#112240] border border-border dark:border-white/12 rounded-xl p-6 sm:p-8 4k:p-12 shadow-blueprint relative overflow-hidden group hover:border-pnp-orange/40 transition-all duration-300"
          >
            {/* Left edge 4px accent line */}
            <div className="absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 bg-dongker-surface dark:bg-pnp-orange/60 group-hover:bg-pnp-orange transition-colors" />

            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-micro sm:text-xs 4k:text-base font-semibold uppercase tracking-[2px] text-pnp-orange">
                — SLOGAN ORGANISASI
              </span>
              <span className="font-mono text-micro 4k:text-base uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-orange-wash dark:bg-pnp-orange/15 text-orange-deep dark:text-pnp-orange border border-pnp-orange/30">
                SPIRIT INOVASI
              </span>
            </div>

            <h3 className="font-display font-bold text-xl sm:text-2xl 4k:text-4xl text-foreground uppercase mb-4 group-hover:text-pnp-orange transition-colors">
              &quot;We Play With Technology&quot;
            </h3>

            <p className="text-muted-foreground text-sm sm:text-base 4k:text-xl font-light leading-relaxed">
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
