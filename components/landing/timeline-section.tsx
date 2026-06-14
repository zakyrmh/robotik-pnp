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
    status: "recurring",
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
    status: "training",
    details: ["Workshop elektronika", "Coding robot & AI", "Fabrikasi mekanik"],
  },
  {
    number: "03",
    phase: "Research & Development",
    title: "Perancangan Robot & Riset",
    description:
      "Pengembangan robot baru sesuai dengan regulasi kompetisi tahun berjalan. Riset teknologi terbaru untuk keunggulan kompetitif.",
    duration: "Oktober - Maret",
    status: "competition",
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
    status: "national",
    details: ["Kompetisi regional", "Babak nasional", "Representasi PNP"],
  },
  {
    number: "05",
    phase: "Evaluasi & Inovasi",
    title: "Review & Pengembangan Robot Baru",
    description:
      "Setelah kompetisi, tim melakukan evaluasi mendalam dan mulai mengembangkan generasi robot berikutnya untuk musim depan.",
    duration: "Juli - September",
    status: "done",
    details: ["Laporan teknis", "Desain robot baru", "Transfer ilmu ke junior"],
  },
];

const statusColors: Record<string, string> = {
  recurring: "#0066b1",
  training: "#1c69d4",
  competition: "#0066b1",
  national: "#e22718",
  done: "#22c55e",
};

const statusLabels: Record<string, string> = {
  recurring: "Rutin",
  training: "Intensif",
  competition: "Internal",
  national: "Nasional",
  done: "Evaluasi",
};

export function TimelineSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      className="bg-surface-soft-light py-20 border-t border-hairline-light"
      ref={ref}
    >
      <div className="max-w-[1320px] mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <span className="font-mono text-[11px] font-medium uppercase tracking-[2px] text-cyber-blue block mb-3">
            — Alur Kegiatan
          </span>
          <h2 className="font-sans font-bold text-[36px] md:text-[42px] uppercase text-canvas-dark leading-none">
            Siklus Tahunan
            <br />
            <span className="text-cyber-blue">UKM Robotika</span>
          </h2>
        </motion.div>

        {/* Tricolor divider */}
        <div className="h-[3px] bg-linear-to-r from-cyber-blue via-tech-navy to-crimson-red mb-14" />

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[47px] top-0 bottom-0 w-px bg-hairline-light hidden md:block" />

          <div className="flex flex-col gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -30 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex gap-8 group"
              >
                {/* Step number circle */}
                <div className="shrink-0 relative">
                  <div
                    className="w-[96px] h-[96px] hidden md:flex items-center justify-center border-2 border-hairline-light bg-white group-hover:border-cyber-blue transition-colors duration-300"
                    style={{ borderRadius: "0" }}
                  >
                    <span
                      className="font-mono font-bold text-[28px]"
                      style={{ color: statusColors[step.status] }}
                    >
                      {step.number}
                    </span>
                  </div>
                  {/* Dot on line */}
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 hidden md:block"
                    style={{ background: statusColors[step.status] }}
                  />
                </div>

                {/* Content card */}
                <div className="flex-1 border border-hairline-light bg-white p-6 group-hover:border-cyber-blue group-hover:shadow-[0_0_12px_rgba(0,102,177,0.1)] transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="font-mono text-[9px] uppercase tracking-[2px] px-2 py-0.5 border"
                          style={{
                            color: statusColors[step.status],
                            borderColor: statusColors[step.status],
                            background: `${statusColors[step.status]}12`,
                          }}
                        >
                          {statusLabels[step.status]}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-canvas-dark/40">
                          {step.phase}
                        </span>
                      </div>
                      <h3 className="font-sans font-bold text-[20px] text-canvas-dark uppercase leading-tight">
                        {step.title}
                      </h3>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[1px] text-cyber-blue whitespace-nowrap shrink-0 border border-cyber-blue/20 px-3 py-1.5">
                      {step.duration}
                    </span>
                  </div>

                  <p className="text-canvas-dark/60 text-sm font-light leading-relaxed mb-5">
                    {step.description}
                  </p>

                  {/* Details checklist */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {step.details.map((detail) => (
                      <div key={detail} className="flex items-center gap-2">
                        <HugeiconsIcon
                          icon={CheckmarkCircle01Icon}
                          size={14}
                          style={{ color: statusColors[step.status] }}
                        />
                        <span className="font-mono text-[10px] uppercase tracking-[1px] text-canvas-dark/50">
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
