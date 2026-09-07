"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, Download, FileText } from "lucide-react";
import type { PublicCategoryWithQuota } from "@/lib/actions/event-public";
import { cn } from "@/lib/utils";

interface MrcFaqAccordionProps {
  categories: PublicCategoryWithQuota[];
}

const faqItems = [
  {
    question: "Bagaimana cara melakukan pembayaran biaya pendaftaran?",
    answer:
      "Pembayaran dilakukan secara otomatis melalui Midtrans Gateway saat mengisi form pendaftaran. Anda dapat menggunakan QRIS, Bank Transfer (Virtual Account), atau E-Wallet. Setelah sukses, E-Tiket & Kode Pendaftaran akan dikirimkan otomatis ke email tim Anda.",
  },
  {
    question: "Apakah peserta wajib mengunggah foto saat pendaftaran?",
    answer:
      "Ya, setiap anggota tim (Ketua, Anggota, dan Pembina) wajib mengunggah pas foto formal berpakaian rapi. Foto ini akan dicetak otomatis sebagai QR Kokarde Peserta untuk verifikasi fisik di lokasi lomba.",
  },
  {
    question:
      "Bagaimana jika modal pembayaran Midtrans tertutup sebelum bayar?",
    answer:
      "Tidak perlu khawatir. Link E-Tiket unik sudah dikirimkan ke email tim Anda. Buka link tersebut untuk melanjutkan pembayaran atau meminta bantuan Admin via WhatsApp.",
  },
  {
    question: "Apakah ada batasan usia atau jenjang pendidikan peserta?",
    answer:
      "Setiap kategori lomba memiliki ketentuan jenjang terpisah (misal: tingkat SMA/SMK sederajat atau Perguruan Tinggi). Silakan unduh Rulebook resmi masing-masing kategori di bawah ini.",
  },
];

export function MrcFaqAccordion({ categories }: MrcFaqAccordionProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="rulebook" className="space-y-8">
      {/* Rulebook Download Section */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <Download className="size-5 text-primary" />
          <div>
            <h3 className="font-display font-bold text-base text-foreground">
              Unduh Rulebook & Buku Panduan Teknis
            </h3>
            <p className="font-body text-xs text-muted-foreground">
              Unduh dokumen peraturan resmi untuk mempersiapkan spesifikasi
              robot tim Anda.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between gap-2 p-3.5 rounded-md border border-border/80 bg-muted/30 hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-md bg-primary-soft/60 dark:bg-primary-soft/30 flex items-center justify-center text-primary">
                  <FileText className="size-4" />
                </div>
                <div>
                  <p className="font-display font-semibold text-xs text-foreground">
                    Rulebook {cat.name}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    Versi Terakhir (PDF)
                  </p>
                </div>
              </div>

              <a
                href={`/docs/rulebook-${cat.slug}.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                download
                aria-label={`Unduh rulebook ${cat.name} (PDF)`}
                className="inline-flex items-center gap-1 min-h-[44px] font-body text-xs font-semibold px-3 py-1.5 rounded-md bg-background border border-border text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
              >
                <span>Unduh</span>
                <Download className="size-3 text-muted-foreground" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary bg-primary-soft/50 dark:bg-primary-soft/20 px-3 py-1 rounded-full border border-primary/20">
            Pertanyaan Umum
          </span>
          <h2 className="font-display font-bold text-balance">
            Frequently Asked Questions (FAQ)
          </h2>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-2xs space-y-3">
          {faqItems.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-md border border-border/70 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                  aria-controls={`mrc-faq-panel-${idx}`}
                  className="w-full min-h-[44px] flex items-center justify-between gap-2 p-4 bg-muted/30 hover:bg-muted/70 text-left font-display font-semibold text-sm sm:text-base text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="size-4 text-primary shrink-0" />
                    <span>{item.question}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform duration-200 shrink-0",
                      isOpen && "rotate-180 text-primary",
                    )}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`mrc-faq-panel-${idx}`}
                      role="region"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      <div className="p-4 pt-2 border-t border-border/40 font-body text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
