"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";

interface DBDivision {
  slug: string;
  name: string;
  short_description: string;
  badge_label: string | null;
  badge_color: string | null;
  accent_color: string | null;
  sort_order: number;
  tags: string[];
}

interface DivisionsSectionProps {
  divisions?: DBDivision[];
}

const defaultDivisions = [
  {
    id: "krai",
    code: "KRAI",
    name: "Kontes Robot ABU Indonesia",
    divisionNum: "Divisi 01",
    categoryTag: "Flagship / Mekatronika Daya",
    description:
      "Perancangan robot beroda dan berkaki untuk menyelesaikan misi bertempo tinggi pada arena ABU Robocon.",
    skills: [
      "Mekanisme Pelempar",
      "Pneumatik",
      "Kontrol Otomatis",
      "Navigasi Lapangan",
    ],
  },
  {
    id: "krsbi-b",
    code: "KRSBI-B",
    name: "Sepak Bola Robot Beroda",
    divisionNum: "Divisi 02",
    categoryTag: "Autonomous / Multi-Agent",
    description:
      "Robot beroda otonom yang bermain sepak bola secara terkoordinasi memanfaatkan visi komputer dan komunikasi nirkabel tim.",
    skills: [
      "Computer Vision",
      "Omni-directional Drive",
      "Algoritma Lokomosi",
      "Koordinasi Tim",
    ],
  },
  {
    id: "krsbi-h",
    code: "KRSBI-H",
    name: "Sepak Bola Robot Humanoid",
    divisionNum: "Divisi 03",
    categoryTag: "Humanoid / Bipedal",
    description:
      "Pengembangan robot berkaki dua dengan kendali kestabilan dinamis saat berjalan, menendang bola, dan mendeteksi objek.",
    skills: [
      "Bipedal Walking",
      "Inverse Kinematics",
      "Balance Control",
      "Pengolahan Citra",
    ],
  },
  {
    id: "krsti",
    code: "KRSTI",
    name: "Kontes Robot Seni Tari Indonesia",
    divisionNum: "Divisi 04",
    categoryTag: "Humanoid / Art & Culture",
    description:
      "Robot humanoid yang menarikan tarian tradisional Indonesia dengan sinkronisasi musik dan akurasi gerakan multi-axis.",
    skills: [
      "Motion Planning",
      "Sinkronisasi Audio",
      "Kendali Servo Presisi",
      "Kinematika Gerak",
    ],
  },
  {
    id: "krsri",
    code: "KRSRI",
    name: "Kontes Robot SAR Indonesia",
    divisionNum: "Divisi 05",
    categoryTag: "Autonomous / Rescue",
    description:
      "Robot otonom penelusur medan labirin simulasi bencana untuk mencari korban dan memadamkan titik api.",
    skills: [
      "Sensor Fusion",
      "Pemetaan Labirin (SLAM)",
      "Deteksi Api & Korban",
      "Navigasi Otonom",
    ],
  },
];

export function DivisionsSection({
  divisions: dbDivisions,
}: DivisionsSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const renderedDivisions =
    dbDivisions && dbDivisions.length > 0
      ? defaultDivisions.map((defDiv) => {
          const matched = dbDivisions.find((d) => d.slug === defDiv.id);
          if (!matched) return defDiv;
          return {
            ...defDiv,
            description: matched.short_description || defDiv.description,
            skills: matched.tags?.length > 0 ? matched.tags : defDiv.skills,
            categoryTag: matched.badge_label || defDiv.categoryTag,
          };
        })
      : defaultDivisions;

  return (
    <section
      className="bg-background py-16 sm:py-20 lg:py-24 border-t border-border transition-colors duration-200"
      ref={ref}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <span className="font-mono text-xs uppercase tracking-wider text-accent-strong font-semibold block mb-2">
              DIVISI KOMPETISI
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl tracking-tight text-foreground">
              5 Divisi Robot Kontes Robot Indonesia (KRI)
            </h2>
            <p className="font-body text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed">
              Setiap divisi berfokus pada spesialisasi rekayasa tertentu sesuai
              regulasi kompetisi tahunan Puspresnas Kemendikbudristek.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="shrink-0"
          >
            <Link
              href="/divisi"
              className="inline-flex items-center gap-2 font-body font-medium text-sm text-primary hover:text-primary-hover transition-colors group"
            >
              <span>Jelajahi Semua Divisi</span>
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Divisions Grid (3 columns on desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderedDivisions.map((div, i) => (
            <motion.div
              key={div.id}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="bg-card border border-border rounded-xl p-6 sm:p-7 shadow-2xs hover:border-primary/50 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Subtle top accent */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-border group-hover:bg-primary transition-colors" />

              <div>
                {/* Header meta */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block mb-0.5">
                      {div.divisionNum}
                    </span>
                    <h3 className="font-display font-bold text-xl sm:text-2xl text-foreground group-hover:text-primary transition-colors">
                      {div.code}
                    </h3>
                  </div>

                  <span className="font-mono text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md bg-accent text-accent-foreground dark:bg-accent/20 border border-border shrink-0 text-right">
                    {div.categoryTag}
                  </span>
                </div>

                {/* Subtitle / Long Name */}
                <p className="font-body text-xs font-medium text-foreground/80 mb-3">
                  {div.name}
                </p>

                {/* Description */}
                <p className="font-body text-sm text-muted-foreground leading-relaxed mb-6">
                  {div.description}
                </p>
              </div>

              <div>
                {/* Engineering Focus Badges */}
                <div className="mb-6 pt-4 border-t border-border/70">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-medium">
                    Fokus Rekayasa:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {div.skills.map((skill) => (
                      <span
                        key={skill}
                        className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-secondary text-foreground/90 border border-border"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA Link */}
                <Link
                  href={`/divisi/${div.id}`}
                  className="inline-flex items-center gap-1.5 font-body text-xs font-semibold text-primary group-hover:text-primary-hover transition-colors"
                >
                  <span>Spesifikasi Divisi</span>
                  <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}

          {/* Closing Card (Completing 6-grid layout on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 5 * 0.08 }}
            className="bg-primary/5 dark:bg-primary/10 border border-dashed border-primary/30 rounded-xl p-6 sm:p-7 flex flex-col justify-between"
          >
            <div>
              <div className="size-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center mb-4">
                <Layers className="size-5" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-2">
                Tertarik Bergabung?
              </h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">
                Pilih divisi yang sesuai dengan minat dan keahlian Anda, mulai
                dari mekanik, elektronika kontrol, hingga computer vision dan
                AI.
              </p>
            </div>

            <div className="pt-6">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 w-full font-body font-medium text-sm px-4 py-3 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md shadow-xs transition-all active:scale-[0.98] min-h-[44px]"
              >
                <span>Pendaftaran Calon Anggota</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
