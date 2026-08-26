"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
    <section className="bg-background text-foreground py-16 sm:py-20 lg:py-24 border-b border-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
          <span className="font-mono text-xs uppercase tracking-wider text-accent-strong font-semibold block mb-2">
            — STRUKTUR ORGANISASI
          </span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-foreground">
            PENGURUS INTI <span className="text-primary">& PEMBINA</span>
          </h2>
          <p className="font-body text-sm text-muted-foreground mt-2">
            Pimpinan dan penanggung jawab arah gerak Unit Kegiatan Mahasiswa
            Robotik.
          </p>
        </div>

        {/* BPH Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 sm:mb-14">
          {members.map((member, index) => (
            <motion.div
              key={`${member.role}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="bg-card border border-border rounded-xl overflow-hidden shadow-2xs hover:border-primary/50 transition-all duration-200 flex flex-col group relative"
            >
              {/* Top Accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-border group-hover:bg-primary transition-colors z-20" />

              <div className="aspect-square relative overflow-hidden bg-secondary">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover group-hover:scale-103 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-linear-to-t from-card via-transparent to-transparent opacity-80" />
              </div>

              <div className="p-5 flex flex-col items-center text-center -mt-6 relative z-10 flex-1">
                <span className="font-mono text-[10px] uppercase tracking-wider font-semibold bg-accent text-accent-foreground dark:bg-accent/20 px-2.5 py-1 border border-border rounded-md mb-2.5 shadow-2xs">
                  {member.role}
                </span>

                <h3 className="font-display font-bold text-base text-foreground group-hover:text-primary transition-colors mb-1">
                  {member.name}
                </h3>

                {member.prodi && (
                  <span className="font-body text-xs text-muted-foreground mt-auto pt-1.5 block">
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
            className="inline-flex items-center justify-center gap-2 font-body font-medium text-sm px-6 py-3.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md shadow-xs transition-all active:scale-[0.98] min-h-[44px] group"
          >
            <span>Lihat Direktori Seluruh Anggota & Divisi</span>
            <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
