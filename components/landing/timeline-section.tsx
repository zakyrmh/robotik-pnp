"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CheckCircle2 } from "lucide-react";

const steps = [
  {
    number: "01",
    phase: "Rekrutmen & Seleksi",
    title: "Pendaftaran & Seleksi Anggota Baru",
    description:
      "Pendaftaran terbuka untuk mahasiswa baru dan tingkat awal. Seleksi berkas, tes dasar logika pemrograman/elektronika, dan wawancara peminatan divisi.",
    duration: "September",
    details: [
      "Seleksi Berkas & Minat",
      "Tes Logika & Elektronika",
      "Wawancara Motivasi",
    ],
  },
  {
    number: "02",
    phase: "Pelatihan Terpadu",
    title: "Workshop & Skill Building Intensif",
    description:
      "Pelatihan intensif 3 bulan oleh anggota senior. Praktik perancangan skematik & PCB, coding mikrokontroler, dan fabrikasi mekanik.",
    duration: "Oktober – Desember",
    details: [
      "Perancangan Skematik & PCB",
      "Pemrograman Mikrokontroler",
      "Fabrikasi & Perakitan Mekanik",
    ],
  },
  {
    number: "03",
    phase: "Riset & Fabrikasi",
    title: "Riset Prototipe & Integrasi Sistem",
    description:
      "Bedah regulasi resmi KRI tahun berjalan. Perakitan rangka mekanik, integrasi sensor daya, dan pemrograman strategi robot.",
    duration: "Januari – Maret",
    details: [
      "Bedah Regulasi Resmi KRI",
      "Integrasi Sensor & Aktuator",
      "Strategi & Algoritma Robot",
    ],
  },
  {
    number: "04",
    phase: "Kompetisi Nasional",
    title: "Uji Coba & Kejuaraan KRI",
    description:
      "Uji coba lapangan simulasi tanding. Pengiriman tim delegasi ke ajang KRI tingkat Wilayah 1 dan Nasional Kemendikbudristek.",
    duration: "April – Oktober",
    details: [
      "Simulasi Tanding Lapangan",
      "KRI Tingkat Wilayah 1",
      "Babak Final Nasional KRI",
    ],
  },
  {
    number: "05",
    phase: "Evaluasi & Alih Teknologi",
    title: "Review Teknis & Transfer Pengetahuan",
    description:
      "Penyusunan laporan performa teknis robot. Dokumentasi sistem, perbaikan modul prototipe, dan transfer ilmu ke calon generasi baru.",
    duration: "November – Desember",
    details: [
      "Laporan Evaluasi Performa",
      "Dokumentasi Skematik & Kode",
      "Transfer Pengetahuan ke Anggota Baru",
    ],
  },
];

export function TimelineSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      className="bg-secondary/40 text-foreground py-16 sm:py-20 lg:py-24 border-t border-border transition-colors duration-200"
      ref={ref}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mb-12 sm:mb-14"
        >
          <span className="font-mono text-xs uppercase tracking-wider text-accent-strong font-semibold block mb-2">
            SIKLUS KERJA
          </span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl tracking-tight text-foreground">
            Alur Kerja Rekayasa & Kompetisi Tahunan
          </h2>
          <p className="font-body text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed">
            Tahapan operasional anggota dari masa rekrutmen hingga kejuaraan
            nasional.
          </p>
        </motion.div>

        {/* Timeline List */}
        <div className="relative">
          {/* Vertical indicator line (desktop/tablet) */}
          <div className="absolute left-6.5 top-6 bottom-6 w-px bg-border hidden sm:block" />

          <div className="space-y-6 sm:space-y-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start group relative"
              >
                {/* Step badge */}
                <div className="shrink-0 relative z-10">
                  <div className="size-13 rounded-xl border border-border bg-card shadow-2xs flex items-center justify-center group-hover:border-primary transition-colors">
                    <span className="font-mono font-bold text-base sm:text-lg text-primary">
                      {step.number}
                    </span>
                  </div>
                </div>

                {/* Content card */}
                <div className="flex-1 bg-card border border-border rounded-xl p-6 sm:p-7 shadow-2xs hover:border-primary/50 transition-all duration-200 w-full relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-accent-strong font-semibold px-2.5 py-0.5 rounded-md bg-accent dark:bg-accent/20 border border-border">
                        {step.phase}
                      </span>
                      <h3 className="font-display font-bold text-lg sm:text-xl text-foreground">
                        {step.title}
                      </h3>
                    </div>

                    <span className="font-mono text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md border border-border shrink-0 self-start sm:self-auto">
                      {step.duration}
                    </span>
                  </div>

                  <p className="font-body text-sm text-muted-foreground leading-relaxed mb-4">
                    {step.description}
                  </p>

                  {/* Highlights checklist */}
                  <div className="flex flex-wrap gap-x-5 gap-y-2 pt-3.5 border-t border-border/70">
                    {step.details.map((detail) => (
                      <div
                        key={detail}
                        className="flex items-center gap-1.5 text-xs text-foreground/90"
                      >
                        <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                        <span className="font-body">{detail}</span>
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
