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
      "Pembayaran dilakukan secara otomatis melalui Payment Gateway dengan menggunakan QRIS Dinamik saat mengisi form pendaftaran. Setelah pembayaran sukses, E-Tiket & Kode Pendaftaran akan dikirimkan secara otomatis ke email tim Anda.",
  },
  {
    question: "Apakah peserta wajib mengunggah pas foto dan kartu identitas saat pendaftaran?",
    answer:
      "Setiap anggota tim wajib mengunggah pas foto formal untuk keperluan QR Kokarde Peserta. Khusus pendaftar kategori Line Follower Junior dan Line Follower Senior, peserta wajib mengunggah foto kartu identitas (Kartu Pelajar atau Kartu Keluarga). Untuk kategori Sumo Bot dan Soccer Bot, tidak diperlukan pengunggahan kartu identitas.",
  },
  {
    question:
      "Bagaimana jika modal pembayaran tertutup sebelum sempat membayar?",
    answer:
      "Silakan cek email tim Anda (pastikan juga mengecek folder spam/junk). Link E-Tiket unik pembayaran telah dikirimkan ke email tersebut. Anda dapat membukanya kembali untuk melanjutkan pembayaran atau menghubungi Admin untuk bantuan.",
  },
  {
    question: "Apakah ada batasan usia untuk peserta perlombaan?",
    answer:
      "Batasan usia berlaku khusus untuk kategori Line Follower: Line Follower Junior ditujukan untuk peserta di bawah usia 19 tahun, sedangkan Line Follower Senior ditujukan untuk peserta di atas usia 19 tahun.",
  },
];

export function MrcFaqAccordion({ categories }: MrcFaqAccordionProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="space-y-8 font-sans">
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
