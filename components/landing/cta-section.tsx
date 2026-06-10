"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  SmartPhone01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

export function CtaSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      className="bg-canvas-dark py-24 relative overflow-hidden border-t border-hairline-dark"
      ref={ref}
    >
      {/* Background elements */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,102,177,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,102,177,1) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(0,102,177,0.3) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-[1320px] mx-auto px-6">
        <div className="grid lg:grid-cols-[1fr_auto] gap-16 items-center">
          {/* Left: CTA text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="font-mono text-[11px] font-medium uppercase tracking-[2px] text-cyber-blue block mb-5">
              — Bergabung Bersama Kami
            </span>
            <h2 className="font-sans font-bold text-[48px] md:text-[60px] uppercase text-white leading-none mb-6">
              SIAP
              <br />
              <span className="text-cyber-blue">BERKOMPETISI?</span>
            </h2>
            <p className="text-white/50 text-base font-light leading-relaxed max-w-xl mb-10">
              Jadilah bagian dari tim robotika terdepan di Sumatera Barat. Kami
              mencari mahasiswa PNP yang bersemangat, tekun, dan haus akan
              tantangan rekayasa mesin dan kecerdasan buatan.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/keanggotaan"
                className="inline-flex items-center gap-3 font-mono text-[12px] font-medium uppercase tracking-[1.5px] px-8 py-4 bg-white text-canvas-dark hover:bg-transparent hover:text-white border border-white transition-all duration-200 group"
              >
                Daftar Sekarang
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={16}
                  className="group-hover:translate-x-1 transition-transform duration-200"
                />
              </Link>
              <Link
                href="/hubungi"
                className="inline-flex items-center gap-3 font-mono text-[12px] font-medium uppercase tracking-[1.5px] px-8 py-4 bg-transparent text-white border border-hairline-dark hover:border-cyber-blue hover:bg-cyber-blue/10 transition-all duration-200"
              >
                Hubungi Kami
              </Link>
            </div>
          </motion.div>

          {/* Right: Contact info card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:w-80 space-y-px"
          >
            <div className="bg-surface-card-dark border border-hairline-dark p-6">
              <p className="font-mono text-[10px] uppercase tracking-[2px] text-cyber-blue mb-4">
                Kontak Langsung
              </p>
              <div className="flex items-start gap-3">
                <HugeiconsIcon
                  icon={Mail01Icon}
                  size={18}
                  className="text-cyber-blue shrink-0 mt-0.5"
                />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[1px] text-white/40 mb-1">
                    Email
                  </p>
                  <a
                    href="mailto:robotika@pnp.ac.id"
                    className="font-mono text-[13px] text-white hover:text-cyber-blue transition-colors duration-200"
                  >
                    robotika@pnp.ac.id
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-surface-card-dark border border-hairline-dark p-6">
              <div className="flex items-start gap-3">
                <HugeiconsIcon
                  icon={SmartPhone01Icon}
                  size={18}
                  className="text-cyber-blue shrink-0 mt-0.5"
                />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[1px] text-white/40 mb-1">
                    WhatsApp
                  </p>
                  <a
                    href="https://wa.me/6281234567890"
                    className="font-mono text-[13px] text-white hover:text-cyber-blue transition-colors duration-200"
                  >
                    +62 812-3456-7890
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-surface-card-dark border border-hairline-dark p-6">
              <p className="font-mono text-[10px] uppercase tracking-[1px] text-white/40 mb-2">
                Sekretariat
              </p>
              <p className="font-mono text-[12px] text-white leading-relaxed">
                Gedung Teknik Elektro Lt. 2,
                <br />
                Politeknik Negeri Padang,
                <br />
                Limau Manis, Padang 25164
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
