"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

export function WorkshopGallerySection() {
  const photos = [
    {
      id: 1,
      src: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800&h=600",
      alt: "Suasana diskusi tim di area workshop",
      caption: "Diskusi Strategi & Perancangan Tim",
      colSpan: "col-span-1 md:col-span-2",
      rowSpan: "row-span-1",
    },
    {
      id: 2,
      src: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&q=80&w=800&h=800",
      alt: "Proses troubleshooting sirkuit elektronik",
      caption: "Troubleshooting & Soldering Sirkuit",
      colSpan: "col-span-1",
      rowSpan: "row-span-2",
    },
    {
      id: 3,
      src: "https://images.unsplash.com/photo-1580835239846-5bb9ce03c8c3?auto=format&fit=crop&q=80&w=800&h=600",
      alt: "Pemrograman robot",
      caption: "Pemrograman Microcontroller & AI",
      colSpan: "col-span-1",
      rowSpan: "row-span-1",
    },
    {
      id: 4,
      src: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800&h=600",
      alt: "Area lapangan uji coba",
      caption: "Uji Coba Pergerakan di Arena Robot",
      colSpan: "col-span-1 md:col-span-2",
      rowSpan: "row-span-1",
    },
  ];

  const [selectedPhoto, setSelectedPhoto] = useState<(typeof photos)[0] | null>(
    null,
  );

  return (
    <section className="bg-mist-gray/40 dark:bg-dongker-ink/40 py-16 sm:py-24 4k:py-40 transition-colors duration-200">
      <div className="max-w-330 2xl:max-w-384 4k:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 4k:px-20">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 4k:mb-24">
          <span className="font-mono text-micro sm:text-xs 4k:text-base font-semibold uppercase tracking-[2px] text-pnp-orange block mb-2">
            — EKOSISTEM RISET & AKTIVITAS
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl 4k:text-6xl uppercase text-foreground">
            GALERI <span className="text-pnp-orange">WORKSHOP</span>
          </h2>
          <div className="dashed-divider mt-4 max-w-md mx-auto" />
        </div>

        {/* Masonry Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[240px] sm:auto-rows-[280px] 4k:auto-rows-[420px] gap-4 sm:gap-6 4k:gap-10">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative overflow-hidden cursor-pointer group rounded-xl border border-border dark:border-white/12 shadow-blueprint ${photo.colSpan} ${photo.rowSpan}`}
              onClick={() => setSelectedPhoto(photo)}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-dongker-ink/0 group-hover:bg-dongker-ink/60 transition-colors duration-300 pointer-events-none" />

              <div className="absolute bottom-0 left-0 right-0 p-4 4k:p-8 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-linear-to-t from-dongker-ink/90 via-dongker-ink/50 to-transparent pointer-events-none">
                <span className="font-mono text-micro sm:text-xs 4k:text-lg uppercase tracking-[1.5px] font-semibold text-white pointer-events-auto">
                  {photo.caption}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {selectedPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-dongker-ink/90 backdrop-blur-md p-4 sm:p-8"
              onClick={() => setSelectedPhoto(null)}
            >
              <button
                className="absolute top-6 right-6 text-white/70 hover:text-pnp-orange transition-colors"
                onClick={() => setSelectedPhoto(null)}
                aria-label="Tutup foto"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={32} />
              </button>

              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative w-full max-w-5xl aspect-video border border-white/20 bg-dongker-ink rounded-xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={selectedPhoto.src}
                  alt={selectedPhoto.alt}
                  fill
                  className="object-contain"
                />

                <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-dongker-ink via-dongker-ink/80 to-transparent text-center">
                  <span className="font-mono text-xs sm:text-sm 4k:text-xl uppercase tracking-[1.5px] font-semibold text-white">
                    {selectedPhoto.caption}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
