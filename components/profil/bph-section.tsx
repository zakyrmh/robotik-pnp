"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Linkedin01Icon } from "@hugeicons/core-free-icons";

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
    <section className="bg-canvas-dark py-20 border-b border-hairline-dark">
      <div className="max-w-330 mx-auto px-6">
        <div className="text-center mb-16">
          <span className="font-mono text-[12px] font-medium uppercase tracking-[1.5px] text-cyber-blue">
            Struktur Formal
          </span>
          <h2 className="font-sans font-bold text-[28px] md:text-[40px] uppercase text-white mt-2">
            Pengurus Inti
          </h2>
        </div>

        {/* BPH Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 justify-center">
          {members.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-surface-card-dark border border-hairline-dark rounded-sm overflow-hidden group hover:shadow-[0_0_12px_rgba(0,102,177,0.2)] hover:-translate-y-1 transition-all duration-300"
            >
              <div className="aspect-square relative overflow-hidden">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-linear-to-t from-canvas-dark to-transparent opacity-80" />
              </div>
              <div className="p-5 flex flex-col items-center text-center -mt-10 relative z-10">
                <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-cyber-blue mb-2 bg-canvas-dark px-2 py-1 border border-hairline-dark inline-block">
                  {member.role}
                </span>
                <h3 className="font-sans font-bold text-[16px] text-white mb-1">
                  {member.name}
                </h3>
                {member.prodi && (
                  <span className="font-mono text-[11px] text-white/40 mb-3 block">
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
            className="inline-flex items-center gap-3 font-mono text-[14px] font-medium uppercase tracking-[1.5px] px-8 py-4 bg-transparent text-white border border-white hover:border-cyber-blue hover:bg-cyber-blue/10 transition-all duration-200 group rounded-none"
          >
            Lihat Direktori Seluruh Anggota & Divisi
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={18}
              className="group-hover:translate-x-1 transition-transform duration-200"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
