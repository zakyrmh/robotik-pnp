"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";

const steps = [
  {
    number: "01",
    phase: "Rekrutmen",
    title: "Pendaftaran & Seleksi Anggota",
    description:
      "Buka pendaftaran setiap awal semester ganjil. Calon anggota mengikuti seleksi berkas, tes dasar robotika, dan wawancara divisi.",
    duration: "September",
    statusLabel: "Rutin",
    details: [
      "Tes pengetahuan dasar",
      "Wawancara motivasi",
      "Seleksi divisi minat",
    ],
  },
  {
    number: "02",
    phase: "Pelatihan",
    title: "Workshop & Skill Building",
    description:
      "Pelatihan intensif dari anggota senior: pemrograman robot, elektronika, mekanikal, dan computer vision.",
    duration: "3 Bulan Penuh",
    statusLabel: "Intensif",
    details: ["Workshop elektronika", "Coding robot & AI", "Fabrikasi mekanik"],
  },
  {
    number: "03",
    phase: "Research & Development",
    title: "Perancangan Robot & Riset",
    description:
      "Pengembangan robot baru sesuai dengan regulasi kompetisi tahun berjalan. Riset teknologi terbaru untuk keunggulan kompetitif.",
    duration: "Oktober - Maret",
    statusLabel: "Riset",
    details: [
      "Desain mekanikal",
      "Perakitan prototipe",
      "Programming & sensor",
    ],
  },
  {
    number: "04",
    phase: "Kompetisi Nasional",
    title: "KRAI / KRSBI / KRSTI / KRSRI",
    description:
      "Tim terbaik dikirim ke kompetisi resmi Kemendikbudristek — bertanding di level regional hingga nasional.",
    duration: "April — Oktober",
    statusLabel: "Nasional",
    details: ["Kompetisi regional", "Babak nasional", "Representasi PNP"],
  },
  {
    number: "05",
    phase: "Evaluasi & Inovasi",
    title: "Review & Pengembangan Robot Baru",
    description:
      "Setelah kompetisi, tim melakukan evaluasi mendalam dan mulai mengembangkan generasi robot berikutnya untuk musim depan.",
    duration: "Juli - September",
    statusLabel: "Evaluasi",
    details: ["Laporan teknis", "Desain robot baru", "Transfer ilmu ke junior"],
  },
];

export function TimelineSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      className="bg-background text-foreground py-16 sm:py-20 4k:py-36 border-t border-border transition-colors duration-200"
      ref={ref}
    >
      <div className="max-w-330 2xl:max-w-384 4k:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 4k:px-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-10 4k:mb-16"
        >
          <span className="font-mono text-micro sm:text-xs 4k:text-lg font-semibold uppercase tracking-[2px] text-pnp-orange block mb-2">
            — ALUR KEGIATAN
          </span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl 4k:text-6xl uppercase text-foreground leading-none">
            SIKLUS TAHUNAN{" "}
            <span className="text-pnp-orange">UKM ROBOTIK PNP</span>
          </h2>
        </motion.div>

        {/* Section Divider */}
        <div className="dashed-divider mb-12 4k:mb-20" />

        {/* Timeline */}
        <div className="relative">
          {/* Vertical blueprint line */}
          <div className="absolute left-10.75 4k:left-[59px] top-4 bottom-4 w-0.5 bg-border dark:bg-white/10 hidden md:block" />

          <div className="flex flex-col gap-6 sm:gap-8 4k:gap-14">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -30 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex gap-6 md:gap-8 4k:gap-12 group"
              >
                {/* Step number badge */}
                <div className="shrink-0 relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 4k:w-32 4k:h-32 hidden md:flex items-center justify-center border border-border dark:border-white/15 bg-card dark:bg-[#112240] rounded-xl shadow-blueprint group-hover:border-pnp-orange/50 transition-colors">
                    <span className="font-mono font-bold text-2xl sm:text-3xl 4k:text-4xl text-dongker-surface dark:text-pnp-orange">
                      {step.number}
                    </span>
                  </div>
                </div>

                {/* Content card */}
                <div className="flex-1 border border-border dark:border-white/12 bg-card dark:bg-[#112240] rounded-xl p-6 sm:p-8 4k:p-12 shadow-blueprint group-hover:border-pnp-orange/40 transition-all duration-300 relative overflow-hidden">
                  {/* Left edge accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 bg-dongker-surface dark:bg-pnp-orange/60 group-hover:bg-pnp-orange transition-colors" />

                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        {/* Status Badge per DESIGN.md */}
                        <span className="font-mono text-micro 4k:text-base font-semibold uppercase tracking-wider px-2.5 py-0.5 4k:px-4 4k:py-1 rounded-full bg-orange-wash dark:bg-pnp-orange/15 text-orange-deep dark:text-pnp-orange border border-pnp-orange/30">
                          {step.statusLabel}
                        </span>
                        <span className="font-mono text-micro 4k:text-base uppercase tracking-wider text-muted-foreground font-semibold">
                          PHASE // {step.phase}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-xl sm:text-2xl 4k:text-4xl text-foreground uppercase leading-tight">
                        {step.title}
                      </h3>
                    </div>

                    <span className="font-mono text-micro 4k:text-base font-semibold uppercase tracking-wider text-pnp-orange bg-orange-wash/50 dark:bg-pnp-orange/10 px-3 py-1 4k:px-4 4k:py-2 rounded-full border border-pnp-orange/20 shrink-0 self-start sm:self-auto">
                      {step.duration}
                    </span>
                  </div>

                  <p className="text-muted-foreground text-sm sm:text-base 4k:text-xl font-light leading-relaxed mb-5">
                    {step.description}
                  </p>

                  {/* Details checklist */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2 pt-3 border-t border-border/50 dark:border-white/10">
                    {step.details.map((detail) => (
                      <div key={detail} className="flex items-center gap-2">
                        <HugeiconsIcon
                          icon={CheckmarkCircle01Icon}
                          size={14}
                          className="text-pnp-orange 4k:w-6 4k:h-6"
                        />
                        <span className="font-mono text-micro 4k:text-base uppercase tracking-wider text-muted-foreground font-medium">
                          {detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
