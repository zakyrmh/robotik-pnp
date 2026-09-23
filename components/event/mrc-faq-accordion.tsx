"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import type { PublicCategoryWithQuota } from "@/lib/actions/event-public";
import { cn } from "@/lib/utils";

interface MrcFaqAccordionProps {
  categories: PublicCategoryWithQuota[];
}

const faqItems = [
  {
    question: "Bagaimana cara membayar biaya pendaftaran?",
    answer:
      "Pembayaran dilakukan dengan cara transfer ke rekening panitia. Nomor rekeningnya (Bank Nagari dan Bank BRI) akan muncul di halaman pembayaran tim Anda setelah formulir pendaftaran selesai dikirim. Setelah transfer, jangan lupa kirim foto bukti pembayaran di halaman tersebut, supaya pendaftaran tim Anda bisa diperiksa panitia.",
  },
  {
    question:
      "Apakah pas foto dan kartu identitas wajib dikirim saat mendaftar?",
    answer:
      "Ya, pas foto wajib dikirim oleh semua peserta dari semua kategori lomba. Pas foto ini dipakai untuk membuat kartu peserta (QR Kokarde) yang dibawa saat lomba. Untuk foto kartu identitas (Kartu Pelajar atau Kartu Keluarga), hanya peserta kategori Line Follower Junior yang wajib mengirim, karena usianya perlu dipastikan sesuai ketentuan.",
  },
  {
    question: "Bukti pembayaran sudah saya kirim, berapa lama diproses?",
    answer:
      "Setelah bukti pembayaran Anda kirim, panitia akan memeriksa data dan memastikan dana transfer sudah masuk. Anda bisa memantau status pendaftaran di halaman pembayaran atau di E-Tiket tim. Jika dalam 1x24 jam kerja status belum berubah menjadi sah, silakan hubungi panitia melalui kontak yang tertera di halaman ini.",
  },
  {
    question: "Bagaimana cara mendapatkan E-Tiket dan QR Kokarde?",
    answer:
      "E-Tiket adalah bukti resmi pendaftaran tim Anda, dan QR Kokarde adalah kode/barcode untuk setiap anggota. Keduanya akan dikirim ke email tim yang Anda daftarkan setelah pembayaran dinyatakan sah. Simpan E-Tiket tersebut dengan baik, dan pastikan setiap anggota bisa menunjukkan QR Kokarde-nya saat pemeriksaan ulang di lokasi lomba.",
  },
  {
    question: "Halaman pembayaran tim saya tidak bisa dibuka lagi, bagaimana?",
    answer:
      "Kalau halaman pembayaran tidak bisa dibuka lagi, coba cek email tim yang Anda daftarkan (termasuk folder spam atau junk), karena tautan E-Tiket dan halaman pembayaran dikirim ke email tersebut. Jika tetap tidak ditemukan, hubungi panitia melalui kontak di halaman ini supaya bisa dibantu diperiksa ulang.",
  },
  {
    question: "Berapa jumlah maksimal anggota dalam satu tim?",
    answer:
      "Jumlah maksimal anggota berbeda-beda untuk setiap kategori lomba. Rinciannya bisa Anda lihat pada kartu kategori di bagian Cabang Perlombaan halaman ini, tepat di bawah keterangan biaya pendaftaran. Lengkapi data semua anggota tim Anda, supaya pendaftaran tidak tertunda saat diperiksa panitia.",
  },
  {
    question: "Browser apa yang harus dipakai untuk mendaftar?",
    answer:
      "Gunakan browser biasa yang sudah terpasang di HP atau komputer Anda, seperti Google Chrome, Mozilla Firefox, Microsoft Edge, atau Opera. Sangat penting untuk tidak membuka halaman pendaftaran dan pembayaran langsung dari dalam aplikasi, misalnya saat Anda menekan tautan yang dibagikan lewat Instagram, WhatsApp, atau aplikasi lain. Bila dibuka dari dalam aplikasi, proses pengiriman foto dan pembayaran biasanya gagal sehingga pendaftaran tidak bisa diselesaikan. Jika saat ini Anda sedang membuka halaman ini dari dalam aplikasi, salin tautannya dahulu, lalu buka di browser biasa.",
  },
  {
    question: "Format dan ukuran foto yang bisa dikirim apa saja?",
    answer:
      "Anda bisa mengirim foto dengan format JPG, PNG, atau WebP. Kalau Anda memakai iPhone, foto dengan format khusus iPhone (HEIC) juga bisa dikirim karena akan otomatis diubah oleh sistem. Pastikan foto yang Anda kirim jelas, tidak buram, dan tidak terpotong, karena foto yang tidak terbaca akan membuat pemeriksaan panitia terhambat.",
  },
  {
    question: "Apakah data pendaftaran masih bisa diubah setelah dikirim?",
    answer:
      "Data pendaftaran yang sudah dikirim tidak bisa Anda ubah sendiri lewat halaman pendaftaran. Jika ada kesalahan, seperti salah menulis nama, data anggota, atau foto yang perlu diganti, silakan hubungi panitia melalui kontak di halaman ini. Panitia bisa membantu memperbaikinya selama masa pendaftaran masih dibuka.",
  },
  {
    question: "Apakah ada batas usia untuk peserta?",
    answer:
      "Batas usia hanya berlaku untuk kategori Line Follower Junior, yaitu peserta maksimal berusia 19 tahun pada saat lomba berlangsung (31 Oktober 2026). Untuk kategori lainnya, seperti Line Follower Senior, Sumo Bot, dan Soccer Bot, tidak ada batas usia, jadi siapa saja boleh ikut, baik pelajar maupun mahasiswa.",
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
