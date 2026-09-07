"use client";

import { motion } from "framer-motion";
import {
  UserCheck,
  HeartHandshake,
  Cpu,
  Users,
  Award,
  Globe,
  Quote,
} from "lucide-react";

export function VisiMisiSection() {
  const missions = [
    {
      number: "1",
      icon: UserCheck,
      text: "Membentuk kader yang mampu mengemban amanah",
    },
    {
      number: "2",
      icon: HeartHandshake,
      text: "Menumbuh kembangkan rasa simpati dalam kalangan civitas akademika POLITEKNIK NEGERI PADANG terhadap kegiatan-kegiatan UKM-R",
    },
    {
      number: "3",
      icon: Cpu,
      text: "Mewarnai suasana kampus dengan kegaiatan yang menunjang perkembangan teknologi",
    },
    {
      number: "4",
      icon: Users,
      text: "Mempererat silahturahmi di kalangan masyarakat kampus",
    },
    {
      number: "5",
      icon: Award,
      text: "Membangun profesionalisme keorganisasian dalam berbagai kegiatan",
    },
    {
      number: "6",
      icon: Globe,
      text: "Dapat memberikan konstribusi pada masyarakat sekitar",
    },
  ];

  return (
    <section className="bg-background text-foreground py-16 sm:py-20 lg:py-24 border-b border-border relative transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Visi (5 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 flex flex-col"
          >
            <div className="mb-6">
              <span className="font-mono text-xs uppercase tracking-wider text-accent-strong font-semibold block mb-2">
                — ARAH GERAK ORGANISASI
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-foreground">
                VISI <span className="text-primary">UKM-R</span>
              </h2>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-2xs relative overflow-hidden flex flex-col justify-between group hover:border-primary/50 transition-all duration-200">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent-strong" />

              <Quote className="size-8 text-accent-strong/40 mb-4" />

              <p className="font-body text-foreground text-sm sm:text-base leading-relaxed italic border-l-2 border-accent-strong/60 pl-4 py-1">
                &quot;Sebagai wadah dan sarana pendidikan dalam pengembangan
                minat dan bakat dalam bidang teknologi secara berorganisasi,
                yang mengutamakan profesionalisme, kecerdasan dalam berfikir dan
                kreatif dalam bertindak.&quot;
              </p>

              <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  LANDASAN FILOSOFIS
                </span>
                <span className="size-2 rounded-full bg-accent-strong" />
              </div>
            </div>
          </motion.div>

          {/* Misi (7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="lg:col-span-7 flex flex-col"
          >
            <div className="mb-6">
              <span className="font-mono text-xs uppercase tracking-wider text-primary font-semibold block mb-2">
                — LANGKAH STRATEGIS ORGANISASI
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-foreground">
                MISI <span className="text-primary">UKM-R</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {missions.map((mission) => {
                const Icon = mission.icon;
                return (
                  <div
                    key={mission.number}
                    className="bg-card border border-border rounded-xl p-4 sm:p-4.5 shadow-2xs flex items-start gap-3.5 hover:border-primary/50 transition-all duration-200 group"
                  >
                    <div className="size-9 rounded-lg bg-secondary text-primary border border-border flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="size-4.5" />
                    </div>

                    <div className="flex items-start gap-2 pt-0.5">
                      <span className="font-mono font-bold text-xs sm:text-sm text-primary shrink-0">
                        {mission.number}.
                      </span>
                      <p className="font-body text-foreground/90 text-xs sm:text-sm leading-relaxed">
                        {mission.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
