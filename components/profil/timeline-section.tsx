"use client";

import { motion } from "framer-motion";

export function TimelineSection() {
  const milestones = [
    {
      year: "2003",
      title: "Cikal Bakal Riset",
      description:
        "Keikutsertaan perdana mahasiswa Politeknik Negeri Padang dalam Kontes Robot Indonesia (KRI) di tingkat regional dan nasional.",
    },
    {
      year: "2005",
      title: "Pendirian Resmi UKM Robotik",
      description:
        "UKM Robotik PNP resmi berdiri pada tanggal 22 Juli 2005, diresmikan oleh Ir. Suhendrik Anwar, MT (Direktur PNP saat itu) sebagai wadah resmi riset robotika kampus.",
    },
    {
      year: "2015",
      title: "Ekspansi Divisi & Prestasi",
      description:
        "Pembentukan divisi robotik baru (KRAI, KRSBI, KRSTI, KRSRI) dan raihan trofi kompetisi di tingkat regional Sumatera hingga nasional.",
    },
  ];

  return (
    <section className="bg-mist-gray/40 dark:bg-dongker-ink/40 py-16 sm:py-24 4k:py-40 border-b border-border relative transition-colors duration-200">
      <div className="max-w-330 2xl:max-w-384 4k:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 4k:px-20">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 4k:mb-24">
          <span className="font-mono text-micro sm:text-xs 4k:text-base font-semibold uppercase tracking-[2px] text-pnp-orange block mb-2">
            — MILESTONES & REKAM JEJAK
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl 4k:text-6xl uppercase text-foreground">
            SEJARAH SINGKAT{" "}
            <span className="text-pnp-orange">UKM ROBOTIK PNP</span>
          </h2>
          <div className="dashed-divider mt-4 max-w-md mx-auto" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Vertical Line */}
          <div className="absolute left-5 md:left-1/2 top-4 bottom-4 w-0.5 bg-border dark:bg-white/10 md:-translate-x-1/2" />

          <div className="flex flex-col gap-10 sm:gap-12 4k:gap-16 relative z-10">
            {milestones.map((milestone, index) => {
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className={`flex flex-col md:flex-row items-start md:items-center gap-6 sm:gap-8 ${
                    isEven ? "md:flex-row-reverse" : ""
                  }`}
                >
                  {/* Content Box */}
                  <div
                    className={`w-full md:w-1/2 pl-12 md:pl-0 ${
                      isEven ? "md:text-left md:pl-8" : "md:text-right md:pr-8"
                    }`}
                  >
                    <div className="bg-card dark:bg-[#112240] border border-border dark:border-white/12 rounded-xl p-6 4k:p-10 shadow-blueprint relative overflow-hidden group hover:border-pnp-orange/40 transition-colors">
                      {/* Left edge 4px accent line */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 bg-pnp-orange" />

                      <span className="font-mono text-xs sm:text-sm 4k:text-lg font-semibold text-pnp-orange mb-2 block uppercase tracking-wider">
                        TAHUN {milestone.year}
                      </span>
                      <h3 className="font-display font-bold text-xl sm:text-2xl 4k:text-3xl text-foreground uppercase mb-3 group-hover:text-pnp-orange transition-colors">
                        {milestone.title}
                      </h3>
                      <p className="text-muted-foreground text-sm sm:text-base 4k:text-xl font-light leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </div>

                  {/* Glowing Dot */}
                  <div className="absolute left-5 md:left-1/2 w-4 h-4 4k:w-6 4k:h-6 rounded-full bg-pnp-orange shadow-[0_0_14px_rgba(249,115,22,0.8)] md:-translate-x-1/2 transform -translate-x-1/2 mt-7 md:mt-0" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
