"use client";

import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  RocketIcon,
  Settings01Icon,
  ChampionIcon,
  UserGroupIcon
} from "@hugeicons/core-free-icons";

export function VisiMisiSection() {
  const missions = [
    {
      icon: Settings01Icon,
      text: "Menyelenggarakan pelatihan berkala untuk meningkatkan kemampuan teknis (hard skills) dan organisasi (soft skills) seluruh anggota."
    },
    {
      icon: RocketIcon,
      text: "Mengembangkan riset robotika yang berorientasi pada penyelesaian masalah nyata di industri dan masyarakat."
    },
    {
      icon: ChampionIcon,
      text: "Berpartisipasi aktif dan menargetkan prestasi optimal dalam Kontes Robot Indonesia (KRI) dan kompetisi teknologi lainnya."
    },
    {
      icon: UserGroupIcon,
      text: "Membangun jaringan kolaborasi yang kuat dengan alumni, akademisi, institusi eksternal, dan pihak industri."
    }
  ];

  return (
    <section className="bg-canvas-dark py-[80px] border-b border-hairline-dark relative">
      <div className="max-w-[1320px] mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24">

          {/* Visi */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8">
              <span className="font-mono text-[12px] font-medium uppercase tracking-[1.5px] text-cyber-blue">
                Arah Gerak
              </span>
              <h2 className="font-sans font-bold text-[40px] text-white mt-2 mb-6">
                VISI
              </h2>
              <div className="h-px w-24 bg-hairline-dark mb-8" />
            </div>

            <p className="text-white/80 text-[16px] font-light leading-relaxed border-l-2 border-cyber-blue pl-6 py-2">
              &quot;Menjadi Unit Kegiatan Mahasiswa berbasis riset teknologi robotika yang unggul, kompetitif, dan adaptif di tingkat nasional, serta mampu melahirkan inovasi yang bermanfaat bagi masyarakat.&quot;
            </p>
          </motion.div>

          {/* Misi */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="mb-8">
              <span className="font-mono text-[12px] font-medium uppercase tracking-[1.5px] text-cyber-blue">
                Langkah Strategis
              </span>
              <h2 className="font-sans font-bold text-[40px] text-white mt-2 mb-6">
                MISI
              </h2>
              <div className="h-px w-24 bg-hairline-dark mb-8" />
            </div>

            <div className="flex flex-col gap-6">
              {missions.map((mission, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 mt-1">
                    <HugeiconsIcon icon={mission.icon} size={24} className="text-cyber-blue" />
                  </div>
                  <p className="text-white/80 text-[16px] font-light leading-relaxed">
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