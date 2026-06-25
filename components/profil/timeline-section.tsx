"use client";

import { motion } from "framer-motion";

export function TimelineSection() {
  const milestones = [
    {
      year: "2005",
      title: "Awal Mula",
      description: "Berawal dari sekelompok mahasiswa PNP yang menginisiasi komunitas robotik, hingga akhirnya resmi diakui sebagai Unit Kegiatan Mahasiswa formal kampus."
    },
    {
      year: "2010",
      title: "Fasilitas Workshop",
      description: "Peresmian ruang workshop khusus sebagai laboratorium pusat riset mandiri bagi anggota UKM untuk merancang dan merakit robot secara intensif."
    },
    {
      year: "2018",
      title: "Pencapaian Divisi",
      description: "UKM mulai membentuk 5 divisi kompetisi utama dan berhasil menembus panggung kompetisi nasional secara konsisten, membawa nama baik institusi."
    }
  ];

  return (
    <section className="bg-canvas-dark py-[80px] border-b border-hairline-dark relative">
      <div className="max-w-[1320px] mx-auto px-6">

        <div className="text-center mb-16">
          <span className="font-mono text-[12px] font-medium uppercase tracking-[1.5px] text-cyber-blue">
            Milestones
          </span>
          <h2 className="font-sans font-bold text-[28px] md:text-[40px] uppercase text-white mt-2">
            Sejarah Singkat
          </h2>
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Vertical Line */}
          <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-px bg-hairline-dark md:-translate-x-1/2" />

          <div className="flex flex-col gap-12 relative z-10">
            {milestones.map((milestone, index) => {
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className={`flex flex-col md:flex-row items-start md:items-center gap-8 ${
                    isEven ? "md:flex-row-reverse" : ""
                  }`}
                >
                  {/* Content Box */}
                  <div className={`md:w-1/2 pl-12 md:pl-0 ${isEven ? "md:text-left" : "md:text-right"}`}>
                    <div className={`bg-surface-card-dark border border-hairline-dark p-6 rounded-none relative`}>
                      <span className="font-mono text-[14px] font-medium text-cyber-blue mb-2 block">
                        {milestone.year}
                      </span>
                      <h3 className="font-sans font-bold text-[20px] text-white mb-3">
                        {milestone.title}
                      </h3>
                      <p className="text-white/70 text-[14px] font-light leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </div>

                  {/* Glowing Dot */}
                  <div className="absolute left-[20px] md:left-1/2 w-[12px] h-[12px] rounded-full bg-cyber-blue shadow-[0_0_12px_rgba(0,102,177,0.8)] md:-translate-x-1/2 transform -translate-x-1/2 mt-6 md:mt-0" />
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}