"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

export interface BphMember {
  role: string;
  name: string;
  image: string;
  link: string;
  prodi?: string | null;
}

interface BphSectionProps {
  members: BphMember[];
}

export function BphSection({ members }: BphSectionProps) {
  return (
    <section className="bg-background text-foreground py-16 sm:py-24 4k:py-40 border-b border-border transition-colors duration-200">
      <div className="max-w-330 2xl:max-w-384 4k:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 4k:px-20">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 4k:mb-24">
          <span className="font-mono text-micro sm:text-xs 4k:text-base font-semibold uppercase tracking-[2px] text-pnp-orange block mb-2">
            — STRUKTUR ORGANISASI
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl 4k:text-6xl uppercase text-foreground">
            PENGURUS INTI <span className="text-pnp-orange">& PEMBINA</span>
          </h2>
          <div className="dashed-divider mt-4 max-w-md mx-auto" />
        </div>

        {/* BPH Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 4k:gap-10 mb-12 sm:mb-16 4k:mb-24 justify-center">
          {members.map((member, index) => (
            <motion.div
              key={`${member.role}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card dark:bg-[#112240] border border-border dark:border-white/12 rounded-xl overflow-hidden shadow-blueprint group hover:border-pnp-orange/40 hover:-translate-y-1 transition-all duration-300 relative flex flex-col"
            >
              {/* Left edge 4px accent line */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-dongker-surface dark:bg-pnp-orange/60 group-hover:bg-pnp-orange transition-colors z-20" />

              <div className="aspect-square relative overflow-hidden bg-muted">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-linear-to-t from-background/90 dark:from-[#112240] via-transparent to-transparent opacity-80" />
              </div>

              <div className="p-5 4k:p-8 flex flex-col items-center text-center -mt-8 relative z-10 flex-1">
                <span className="font-mono text-micro 4k:text-base uppercase tracking-wider text-orange-deep dark:text-pnp-orange font-semibold bg-orange-wash dark:bg-pnp-orange/15 px-3 py-1 border border-pnp-orange/30 rounded-full mb-3 shadow-xs">
                  {member.role}
                </span>

                <h3 className="font-display font-bold text-base sm:text-lg 4k:text-2xl text-foreground mb-1 group-hover:text-pnp-orange transition-colors">
                  {member.name}
                </h3>

                {member.prodi && (
                  <span className="font-mono text-micro 4k:text-base uppercase tracking-wider text-muted-foreground mt-auto pt-2 block">
                    {member.prodi}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="flex justify-center">
          <Link
            href="/keanggotaan"
            className="inline-flex items-center gap-3 font-mono text-xs sm:text-sm 4k:text-xl font-semibold uppercase tracking-[1.5px] px-8 py-4 4k:px-12 4k:py-6 bg-dongker-surface text-white hover:bg-dongker-hover dark:bg-pnp-orange dark:hover:bg-pnp-orange/90 rounded-md shadow-md transition-all group"
          >
            Lihat Direktori Seluruh Anggota & Divisi
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={18}
              className="group-hover:translate-x-1 transition-transform duration-200 4k:w-6 4k:h-6"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
