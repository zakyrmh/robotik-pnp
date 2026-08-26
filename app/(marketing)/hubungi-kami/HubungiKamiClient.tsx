"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Mail,
  Send,
  Loader2,
  CheckCircle,
  Globe,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  InstagramIcon,
  YoutubeIcon,
  TiktokIcon,
} from "@hugeicons/core-free-icons";

export default function HubungiKamiClient() {
  const [formData, setFormData] = useState({
    fullName: "",
    organization: "",
    email: "",
    category: "",
    message: "",
    website: "", // Honeypot field
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus("success");
        setFormData({
          fullName: "",
          organization: "",
          email: "",
          category: "",
          message: "",
          website: "",
        });
      } else {
        setSubmitStatus("error");
        setErrorMessage(result.error || "Terjadi kesalahan.");
      }
    } catch {
      setSubmitStatus("error");
      setErrorMessage("Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="container mx-auto px-4 max-w-7xl pb-24">
      {/* Hero Section */}
      <section className="py-12 sm:py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card/80 dark:bg-card/40 backdrop-blur-xs text-xs font-mono text-accent-strong shadow-2xs">
            <span className="size-2 rounded-full bg-accent-strong animate-pulse" />
            <span className="font-semibold uppercase tracking-wider">
              Hubungi Kami
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight text-foreground leading-tight text-balance">
            Mari Berkolaborasi dan Terhubung
          </h1>

          <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto text-pretty">
            Memiliki pertanyaan seputar riset kami, kerja sama sponsor, atau
            tertarik mengundang UKM Robotik PNP dalam event Anda? Hubungi kami
            sekarang.
          </p>
        </motion.div>
      </section>

      {/* Content Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mt-4">
        {/* Left Column: Contact Cards & Map (5 cols) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="lg:col-span-5 space-y-6"
        >
          <div className="space-y-4">
            {/* Address Card */}
            <div className="bg-card border border-border p-5 sm:p-6 flex items-start gap-4 rounded-xl shadow-2xs hover:border-primary/50 transition-all duration-200 group relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-border group-hover:bg-primary transition-colors" />

              <div className="size-11 rounded-lg bg-secondary border border-border text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-2xs">
                <MapPin className="size-5" />
              </div>
              <div>
                <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  Alamat Sekretariat
                </h3>
                <p className="font-body text-sm text-foreground/90 leading-relaxed">
                  Gedung P Lt. 2, Kampus Politeknik Negeri Padang, Limau Manis,
                  Kec. Pauh, Kota Padang, Sumatera Barat.
                </p>
              </div>
            </div>

            {/* Email Card */}
            <a
              href="mailto:infokomrobotikpnp2024@gmail.com"
              className="bg-card border border-border p-5 sm:p-6 flex items-start gap-4 rounded-xl shadow-2xs hover:border-primary/50 transition-all duration-200 group cursor-pointer relative overflow-hidden block"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-border group-hover:bg-primary transition-colors" />

              <div className="flex items-start gap-4">
                <div className="size-11 rounded-lg bg-secondary border border-border text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-2xs">
                  <Mail className="size-5" />
                </div>
                <div>
                  <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                    Email Resmi
                  </h3>
                  <p className="font-body text-base font-semibold text-foreground group-hover:text-primary transition-colors break-all">
                    infokomrobotikpnp2024@gmail.com
                  </p>
                </div>
              </div>
            </a>

            {/* Social Media Card */}
            <div className="bg-card border border-border p-5 sm:p-6 flex items-start gap-4 rounded-xl shadow-2xs hover:border-primary/50 transition-all duration-200 group relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-border group-hover:bg-primary transition-colors" />

              <div className="size-11 rounded-lg bg-secondary border border-border text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-2xs">
                <Globe className="size-5" />
              </div>
              <div className="w-full">
                <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2.5">
                  Media Sosial Resmi
                </h3>
                <div className="flex items-center gap-3">
                  <Link
                    href="https://www.instagram.com/robotikpnp/"
                    className="size-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-2xs"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <HugeiconsIcon icon={InstagramIcon} size={18} />
                  </Link>
                  <Link
                    href="https://www.youtube.com/@robotikpnp"
                    className="size-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-2xs"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <HugeiconsIcon icon={YoutubeIcon} size={18} />
                  </Link>
                  <Link
                    href="https://www.tiktok.com/@robotikpnp"
                    className="size-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-2xs"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <HugeiconsIcon icon={TiktokIcon} size={18} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Google Maps Card */}
          <div className="bg-card border border-border p-2 rounded-xl h-[280px] sm:h-[300px] relative overflow-hidden shadow-2xs">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d443.50713584004745!2d100.46835127221689!3d-0.91458339006708!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2fd4b7bbfa1dfc99%3A0xf0984f8a51acdad!2s3FP9%2B47V%2C%20Limau%20Manis%2C%20Kec.%20Pauh%2C%20Kota%20Padang%2C%20Sumatera%20Barat%2025175!5e1!3m2!1sid!2sid!4v1782489926618!5m2!1sid!2sid"
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: "8px" }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </motion.div>

        {/* Right Column: Contact Form (7 cols) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="lg:col-span-7 bg-card border border-border rounded-2xl p-6 sm:p-8 lg:p-10 shadow-soft relative overflow-hidden"
        >
          {/* Top Accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent-strong" />

          <h2 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-tight text-foreground mb-6">
            Kirim Pesan
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:bg-card focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden transition-all shadow-2xs min-h-[42px]"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Instansi / Organisasi
                </label>
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:bg-card focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden transition-all shadow-2xs min-h-[42px]"
                  placeholder="Opsional"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Alamat Email *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:bg-card focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden transition-all shadow-2xs min-h-[42px]"
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Kategori Pesan *
              </label>
              <select
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 font-body text-sm text-foreground focus:bg-card focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden transition-all shadow-2xs min-h-[42px] cursor-pointer"
              >
                <option value="" disabled>
                  Pilih Kategori
                </option>
                <option value="Sponsorship & Kerja Sama">
                  Sponsorship & Kerja Sama
                </option>
                <option value="Undangan Event / Eksibisi">
                  Undangan Event / Eksibisi
                </option>
                <option value="Pertanyaan Seputar Rekrutmen">
                  Pertanyaan Seputar Rekrutmen (Caang)
                </option>
                <option value="Kritik & Saran / Lainnya">
                  Kritik & Saran / Lainnya
                </option>
              </select>
            </div>

            {/* Honeypot field for bot detection (hidden from human users) */}
            <div className="hidden" aria-hidden="true">
              <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Website
              </label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Isi Pesan *
              </label>
              <textarea
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleChange}
                className="w-full bg-secondary/50 border border-border rounded-lg p-4 font-body text-sm text-foreground placeholder:text-muted-foreground focus:bg-card focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden transition-all shadow-2xs resize-none"
                placeholder="Tuliskan pesan Anda di sini..."
              />
            </div>

            {submitStatus === "error" && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {submitStatus === "success" && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
                <CheckCircle className="size-4 shrink-0" />
                <span>Pesan Anda telah berhasil dikirim!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || submitStatus === "success"}
              className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-body font-medium text-sm px-6 py-3.5 rounded-lg shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[46px] cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : submitStatus === "success" ? (
                <>
                  <CheckCircle className="size-4" />
                  <span>Terkirim</span>
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  <span>Kirim Pesan</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </section>
    </div>
  );
}
