"use client";

import { motion } from "framer-motion";
import { Calendar } from "lucide-react";

export function TimelineSection() {
  const milestones = [
    {
      year: "14 - 15 Mei 2005",
      title: "Keikutsertaan Tim Robot Pertama",
      description:
        "Keikutsertaan tim robot pertama POLITEKNIK NEGERI PADANG yaitu tim Robot Bhandy Padang saat Kontes Robot Indonesia 14 s/d 15 Mei 2005 di Balairung Universitas Indonesia.",
    },
    {
      year: "22 Juli 2005",
      title: "Pendirian Resmi UKM-R",
      description:
        "Unit Kegiatan Mahasiswa Robotik berdiri pada tanggal 22 Juli 2005 di kampus POLITEKNIK NEGERI PADANG. UKM-R ini didirikan atas latar belakang keikutsertaan tim robot Bhandy Padang di KRI 2005 serta melihat perkembangan robotika di Politeknik Negeri Padang yang perlu dikembangkan lebih baik.",
    },
  ];

  return (
    <section className="bg-secondary/40 py-16 sm:py-20 lg:py-24 border-b border-border relative transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
          <span className="font-mono text-xs uppercase tracking-wider text-accent-strong font-semibold block mb-2">
            — MILESTONES & REKAM JEJAK SEJARAH
          </span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-foreground">
            SEJARAH SINGKAT{" "}
            <span className="text-primary">UKM ROBOTIK PNP</span>
          </h2>
          <p className="font-body text-sm text-muted-foreground mt-2">
            Awal mula berdirinya wadah riset dan inovasi teknologi robotika di
            Politeknik Negeri Padang.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Vertical Line */}
          <div className="absolute left-6 md:left-1/2 top-4 bottom-4 w-px bg-border md:-translate-x-1/2" />

          <div className="flex flex-col gap-8 sm:gap-10 relative z-10">
            {milestones.map((milestone, index) => {
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className={`flex flex-col md:flex-row items-start md:items-center gap-6 ${
                    isEven ? "md:flex-row-reverse" : ""
                  }`}
                >
                  {/* Content Box */}
                  <div
                    className={`w-full md:w-1/2 pl-14 md:pl-0 ${
                      isEven ? "md:text-left md:pl-8" : "md:text-right md:pr-8"
                    }`}
                  >
                    <div className="bg-card border border-border rounded-xl p-6 sm:p-7 shadow-2xs hover:border-primary/50 transition-all duration-200 relative overflow-hidden group">
                      {/* Top Accent Line */}
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary group-hover:bg-accent-strong transition-colors" />

                      <div
                        className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-accent-strong bg-accent dark:bg-accent/20 px-2.5 py-1 rounded-md border border-border mb-3 ${
                          isEven ? "" : "md:ml-auto"
                        }`}
                      >
                        <Calendar className="size-3.5" />
                        <span>{milestone.year}</span>
                      </div>

                      <h3 className="font-display font-bold text-lg sm:text-xl text-foreground group-hover:text-primary transition-colors mb-2">
                        {milestone.title}
                      </h3>

                      <p className="font-body text-sm text-muted-foreground leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </div>

                  {/* Indicator Dot */}
                  <div className="absolute left-6 md:left-1/2 size-4 rounded-full bg-accent-strong border-2 border-card shadow-sm md:-translate-x-1/2 transform -translate-x-1/2 mt-7 md:mt-0" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
