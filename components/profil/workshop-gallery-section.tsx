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
      caption: "Tim merancang strategi",
      colSpan: "col-span-1 md:col-span-2",
      rowSpan: "row-span-1"
    },
    {
      id: 2,
      src: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&q=80&w=800&h=800",
      alt: "Proses troubleshooting sirkuit elektronik",
      caption: "Troubleshooting sirkuit",
      colSpan: "col-span-1",
      rowSpan: "row-span-2"
    },
    {
      id: 3,
      src: "https://images.unsplash.com/photo-1580835239846-5bb9ce03c8c3?auto=format&fit=crop&q=80&w=800&h=600",
      alt: "Pemrograman robot",
      caption: "Pemrograman robot",
      colSpan: "col-span-1",
      rowSpan: "row-span-1"
    },
    {
      id: 4,
      src: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800&h=600",
      alt: "Area lapangan uji coba",
      caption: "Uji coba pergerakan",
      colSpan: "col-span-1 md:col-span-2",
      rowSpan: "row-span-1"
    }
  ];

  const [selectedPhoto, setSelectedPhoto] = useState<typeof photos[0] | null>(null);

  return (
    <section className="bg-canvas-light py-[80px]">
      <div className="max-w-[1320px] mx-auto px-6">

        <div className="text-center mb-16">
          <span className="font-mono text-[12px] font-medium uppercase tracking-[1.5px] text-cyber-blue">
            Ekosistem Riset
          </span>
          <h2 className="font-sans font-bold text-[28px] md:text-[40px] uppercase text-canvas-dark mt-2">
            Galeri Workshop
          </h2>
        </div>

        {/* Masonry Grid Layout (Simulated with CSS Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[250px] gap-4">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative overflow-hidden cursor-pointer group rounded-none border border-hairline-light ${photo.colSpan} ${photo.rowSpan}`}
              onClick={() => setSelectedPhoto(photo)}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-canvas-dark/0 group-hover:bg-canvas-dark/40 transition-colors duration-300 pointer-events-none" />

              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-linear-to-t from-canvas-dark to-transparent pointer-events-none">
                <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-white pointer-events-auto">
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
              className="fixed inset-0 z-50 flex items-center justify-center bg-canvas-dark/95 p-4 md:p-8"
              onClick={() => setSelectedPhoto(null)}
            >
              <button
                className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
                onClick={() => setSelectedPhoto(null)}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={32} />
              </button>

              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative w-full max-w-5xl aspect-video border border-hairline-dark bg-surface-card-dark"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={selectedPhoto.src}
                  alt={selectedPhoto.alt}
                  fill
                  className="object-contain"
                />

                <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-canvas-dark to-transparent text-center">
                  <span className="font-mono text-[12px] uppercase tracking-[1.5px] text-white">
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