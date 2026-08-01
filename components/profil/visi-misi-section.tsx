"use client";

import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  RocketIcon,
  Settings01Icon,
  ChampionIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

export function VisiMisiSection() {
  const missions = [
    {
      icon: Settings01Icon,
      text: "Menyelenggarakan pelatihan berkala untuk meningkatkan kemampuan teknis (hard skills) dan organisasi (soft skills) seluruh anggota.",
    },
    {
      icon: RocketIcon,
      text: "Mengembangkan riset robotika yang berorientasi pada penyelesaian masalah nyata di industri dan masyarakat.",
    },
    {
      icon: ChampionIcon,
      text: "Berpartisipasi aktif dan menargetkan prestasi optimal dalam Kontes Robot Indonesia (KRI) dan kompetisi teknologi lainnya.",
    },
    {
      icon: UserGroupIcon,
      text: "Membangun jaringan kolaborasi yang kuat dengan alumni, akademisi, institusi eksternal, dan pihak industri.",
    },
  ];

  return (
    <section className="bg-background text-foreground py-16 sm:py-24 4k:py-40 border-b border-border relative transition-colors duration-200">
      <div className="max-w-330 2xl:max-w-384 4k:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 4k:px-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 4k:gap-24">
          {/* Visi */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col"
          >
            <div className="mb-6">
              <span className="font-mono text-micro sm:text-xs 4k:text-base font-semibold uppercase tracking-[2px] text-pnp-orange block mb-2">
                — ARAH GERAK
              </span>
              <h2 className="font-display font-bold text-3xl sm:text-4xl 4k:text-6xl text-foreground uppercase">
                VISI <span className="text-pnp-orange">ORGANISASI</span>
              </h2>
            </div>

            <div className="bg-card dark:bg-[#112240] border border-border dark:border-white/12 rounded-xl p-6 sm:p-8 4k:p-12 shadow-blueprint relative overflow-hidden flex-1 flex flex-col justify-center">
              <div className="absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 bg-pnp-orange" />
              <p className="text-foreground dark:text-slate-100 text-base sm:text-lg 4k:text-2xl font-normal leading-relaxed italic border-l-2 border-pnp-orange/40 pl-4 sm:pl-6 py-2">
                &quot;Menjadi Unit Kegiatan Mahasiswa berbasis riset teknologi
                robotika yang unggul, kompetitif, dan adaptif di tingkat
                nasional, serta mampu melahirkan inovasi yang bermanfaat bagi
                masyarakat.&quot;
              </p>
            </div>
          </motion.div>

          {/* Misi */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="mb-6">
              <span className="font-mono text-micro sm:text-xs 4k:text-base font-semibold uppercase tracking-[2px] text-pnp-orange block mb-2">
                — LANGKAH STRATEGIS
              </span>
              <h2 className="font-display font-bold text-3xl sm:text-4xl 4k:text-6xl text-foreground uppercase">
                MISI <span className="text-pnp-orange">UTAMA</span>
              </h2>
            </div>

            <div className="flex flex-col gap-4 4k:gap-6">
              {missions.map((mission, index) => (
                <div
                  key={index}
                  className="bg-card dark:bg-[#112240] border border-border dark:border-white/12 rounded-xl p-4 sm:p-5 4k:p-8 shadow-blueprint flex items-start gap-4 hover:border-pnp-orange/40 transition-colors"
                >
                  <div className="p-2.5 4k:p-4 rounded-lg bg-orange-wash dark:bg-pnp-orange/15 text-pnp-orange shrink-0">
                    <HugeiconsIcon
                      icon={mission.icon}
                      size={20}
                      className="4k:w-8 4k:h-8"
                    />
                  </div>
                  <p className="text-muted-foreground text-sm sm:text-base 4k:text-xl font-light leading-relaxed">
                    {mission.text}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
