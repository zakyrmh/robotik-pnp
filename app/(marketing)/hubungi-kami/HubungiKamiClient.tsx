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
  Hash,
  Info,
} from "lucide-react";
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
      <section className="py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto space-y-6"
        >
          <span className="inline-block px-3 py-1 bg-cyber-blue/10 text-cyber-blue font-jetbrains text-mono-eyebrow rounded-sm uppercase tracking-wider">
            Hubungi Kami
          </span>
          <h1 className="text-display-lg md:text-display-xl font-bold uppercase tracking-tight text-foreground leading-tight">
            Mari Berkolaborasi dan Terhubung
          </h1>
          <p className="text-body-md text-muted-foreground">
            Memiliki pertanyaan seputar riset kami, kerja sama sponsor, atau
            tertarik mengundang UKM Robotik PNP dalam event Anda? Hubungi kami
            sekarang.
          </p>
        </motion.div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <div className="bg-surface-card-dark border border-hairline-dark p-6 flex items-start gap-4 rounded-sm hover:border-cyber-blue/50 transition-colors group">
              <div className="w-12 h-12 bg-cyber-blue/10 rounded-sm flex items-center justify-center text-cyber-blue shrink-0 group-hover:bg-cyber-blue group-hover:text-white transition-colors">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-jetbrains text-mono-eyebrow text-muted-foreground uppercase mb-2">
                  Alamat Sekretariat
                </h3>
                <p className="text-foreground text-sm leading-relaxed">
                  Gedung Pusat Kegiatan Mahasiswa (PKM) Lt. 2, Kampus Politeknik
                  Negeri Padang, Limau Manis, Kec. Pauh, Kota Padang, Sumatera
                  Barat.
                </p>
              </div>
            </div>

            <a
              href="mailto:robotik@pnp.ac.id"
              className="bg-surface-card-dark border border-hairline-dark p-6 flex items-start gap-4 rounded-sm hover:border-cyber-blue/50 transition-colors group cursor-pointer"
            >
              <div className="w-12 h-12 bg-cyber-blue/10 rounded-sm flex items-center justify-center text-cyber-blue shrink-0 group-hover:bg-cyber-blue group-hover:text-white transition-colors">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-jetbrains text-mono-eyebrow text-muted-foreground uppercase mb-2">
                  Email Resmi
                </h3>
                <p className="text-foreground text-lg font-bold group-hover:text-cyber-blue transition-colors">
                  robotik@pnp.ac.id
                </p>
              </div>
            </a>

            <div className="bg-surface-card-dark border border-hairline-dark p-6 flex items-start gap-4 rounded-sm hover:border-cyber-blue/50 transition-colors group">
              <div className="w-12 h-12 bg-cyber-blue/10 rounded-sm flex items-center justify-center text-cyber-blue shrink-0 group-hover:bg-cyber-blue group-hover:text-white transition-colors">
                <Globe className="w-6 h-6" />
              </div>
              <div className="w-full">
                <h3 className="font-jetbrains text-mono-eyebrow text-muted-foreground uppercase mb-3">
                  Media Sosial Resmi
                </h3>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="w-10 h-10 border border-hairline-dark rounded-sm flex items-center justify-center text-muted-foreground hover:bg-cyber-blue hover:text-white hover:border-cyber-blue transition-colors"
                  >
                    <Hash className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 border border-hairline-dark rounded-sm flex items-center justify-center text-muted-foreground hover:bg-cyber-blue hover:text-white hover:border-cyber-blue transition-colors"
                  >
                    <Info className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-card-dark border border-hairline-dark p-2 rounded-sm h-[300px] relative overflow-hidden group">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.3100492018326!2d100.45742541475396!3d-0.9145624993336338!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2fd4b7be9e52a171%3A0x609ef1cc57a38e32!2sPoliteknik%20Negeri%20Padang!5e0!3m2!1sen!2sid!4v1689234857398!5m2!1sen!2sid"
              width="100%"
              height="100%"
              style={{
                border: 0,
                filter: "grayscale(100%) invert(90%) contrast(1.2)",
              }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-sm opacity-80 group-hover:opacity-100 group-hover:filter-none transition-all duration-700"
            ></iframe>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-surface-card-dark border border-hairline-dark rounded-none p-8"
        >
          <h2 className="text-display-md font-bold uppercase mb-8">
            Kirim Pesan
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 group">
                <label className="font-jetbrains text-mono-eyebrow text-muted-foreground uppercase">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full bg-canvas-dark border border-hairline-dark rounded-none px-4 py-3 text-sm focus:border-cyber-blue focus:shadow-[0_0_8px_rgba(0,102,177,0.3)] focus:outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2 group">
                <label className="font-jetbrains text-mono-eyebrow text-muted-foreground uppercase">
                  Instansi / Organisasi
                </label>
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  className="w-full bg-canvas-dark border border-hairline-dark rounded-none px-4 py-3 text-sm focus:border-cyber-blue focus:shadow-[0_0_8px_rgba(0,102,177,0.3)] focus:outline-none transition-all"
                  placeholder="Opsional"
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="font-jetbrains text-mono-eyebrow text-muted-foreground uppercase">
                Alamat Email *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-canvas-dark border border-hairline-dark rounded-none px-4 py-3 text-sm focus:border-cyber-blue focus:shadow-[0_0_8px_rgba(0,102,177,0.3)] focus:outline-none transition-all"
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2 group">
              <label className="font-jetbrains text-mono-eyebrow text-muted-foreground uppercase">
                Kategori Pesan *
              </label>
              <select
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-canvas-dark border border-hairline-dark rounded-none px-4 py-3 text-sm focus:border-cyber-blue focus:shadow-[0_0_8px_rgba(0,102,177,0.3)] focus:outline-none transition-all appearance-none"
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
              <label className="font-jetbrains text-mono-eyebrow text-muted-foreground uppercase">
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

            <div className="space-y-2 group">
              <label className="font-jetbrains text-mono-eyebrow text-muted-foreground uppercase">
                Isi Pesan *
              </label>
              <textarea
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleChange}
                className="w-full bg-canvas-dark border border-hairline-dark rounded-none px-4 py-3 text-sm focus:border-cyber-blue focus:shadow-[0_0_8px_rgba(0,102,177,0.3)] focus:outline-none transition-all resize-none"
                placeholder="Tuliskan pesan Anda di sini..."
              />
            </div>

            {submitStatus === "error" && (
              <div className="p-4 bg-crimson-red/10 border border-crimson-red/50 text-crimson-red text-sm">
                {errorMessage}
              </div>
            )}

            {submitStatus === "success" && (
              <div className="p-4 bg-green-500/10 border border-green-500/50 text-green-500 text-sm flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Pesan Anda telah berhasil
                dikirim!
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || submitStatus === "success"}
              className="w-full bg-primary text-primary-foreground font-jetbrains text-mono-button px-6 py-4 rounded-none hover:bg-cyber-blue hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-cyber-blue"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Mengirim...
                </>
              ) : submitStatus === "success" ? (
                <>
                  <CheckCircle className="w-4 h-4" /> Terkirim
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Kirim Pesan
                </>
              )}
            </button>
          </form>
        </motion.div>
      </section>
    </div>
  );
}
