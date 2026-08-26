"use client";

import { motion } from "framer-motion";
import { Flame, Sparkles } from "lucide-react";

export function MotoSloganSection() {
  return (
    <section className="bg-secondary/40 py-16 sm:py-20 lg:py-24 border-b border-border relative transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Moto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-2xs hover:border-primary/50 transition-all duration-200 relative overflow-hidden flex flex-col justify-between group"
          >
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent-strong" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-accent text-accent-strong dark:bg-accent/20 flex items-center justify-center">
                    <Flame className="size-4" />
                  </div>
                  <span className="font-mono text-xs uppercase tracking-wider text-accent-strong font-semibold">
                    — MOTO ORGANISASI
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md bg-accent text-accent-foreground dark:bg-accent/20 border border-border">
                  PRINSIP JUARA
                </span>
              </div>

              <h3 className="font-display font-bold text-xl sm:text-2xl text-foreground group-hover:text-primary transition-colors mb-3">
                &quot;No Victory Without Sacrifice&quot;
              </h3>

              <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed">
                Artinya &ldquo;Tidak Ada Kemenangan Tanpa Pengorbanan&rdquo;.
                Maknanya adalah tidak ada kemenangan yang diraih tanpa usaha dan
                pengorbanan karena untuk mencapai kemenangan kita harus berjuang
                tanpa henti dan tidak kenal lelah, walau harus mengorbankan
                tenaga dan waktu kita.
              </p>
            </div>
          </motion.div>

          {/* Slogan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-2xs hover:border-primary/50 transition-all duration-200 relative overflow-hidden flex flex-col justify-between group"
          >
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-secondary text-primary flex items-center justify-center">
                    <Sparkles className="size-4" />
                  </div>
                  <span className="font-mono text-xs uppercase tracking-wider text-primary font-semibold">
                    — SLOGAN ORGANISASI
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md bg-secondary text-foreground/80 border border-border">
                  SPIRIT INOVASI
                </span>
              </div>

              <h3 className="font-display font-bold text-xl sm:text-2xl text-foreground group-hover:text-primary transition-colors mb-3">
                &quot;We Play With Technology&quot;
              </h3>

              <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed">
                Artinya &ldquo;Kami Bermain/Berkecimpung di Dunia
                Teknologi&rdquo;. Slogan ini mencerminkan antusiasme,
                kreativitas, dan kesenangan seluruh anggota UKM Robotik PNP
                dalam mengeksplorasi, mempelajari, dan berkarya di bidang
                teknologi robotika.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
