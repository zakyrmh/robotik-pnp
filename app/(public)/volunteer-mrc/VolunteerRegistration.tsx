"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

interface ProgramStudi {
  nama: string;
  jenjang: string;
}

interface Jurusan {
  nama: string;
  program_studi: ProgramStudi[];
}

interface JurusanProdiData {
  jurusan: Jurusan[];
}

interface FormData {
  nama: string;
  nim: string;
  jurusan: string;
  prodi: string;
  tugas: string;
  whatsapp: string;
}

export default function VolunteerRegistration() {
  const [formData, setFormData] = useState<FormData>({
    nama: "",
    nim: "",
    jurusan: "",
    prodi: "",
    tugas: "",
    whatsapp: "",
  });

  const [jurusanProdiData, setJurusanProdiData] =
    useState<JurusanProdiData | null>(null);
  const [availableProdi, setAvailableProdi] = useState<ProgramStudi[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error" | "duplicate"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [showWhatsAppCard, setShowWhatsAppCard] = useState(false);

  const WHATSAPP_GROUP_LINK =
    "https://chat.whatsapp.com/YOUR_GROUP_INVITE_CODE";

  useEffect(() => {
    fetch("/data/jurusanProdi.json")
      .then((res) => res.json())
      .then((data) => setJurusanProdiData(data))
      .catch((err) => console.error("Error loading data:", err));
  }, []);

  useEffect(() => {
    if (formData.jurusan && jurusanProdiData) {
      const selectedJurusan = jurusanProdiData.jurusan.find(
        (j) => j.nama === formData.jurusan
      );
      setAvailableProdi(selectedJurusan?.program_studi || []);
      setFormData((prev) => ({ ...prev, prodi: "" }));
    }
  }, [formData.jurusan, jurusanProdiData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const saveToFirebase = async (data: FormData) => {
    try {
      const docRef = await addDoc(collection(db, "volunteer_mrc"), {
        ...data,
        timestamp: new Date().toISOString(),
        createdAt: new Date(),
      });
      console.log("Document written with ID: ", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error adding document:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      await saveToFirebase(formData);

      setSubmitStatus("success");
      setShowWhatsAppCard(true);

      setFormData({
        nama: "",
        nim: "",
        jurusan: "",
        prodi: "",
        tugas: "",
        whatsapp: "",
      });
    } catch (error) {
      setSubmitStatus("error");

      const firebaseError = error as { code?: string; message?: string };

      if (firebaseError.code === "permission-denied") {
        setSubmitStatus("duplicate");
        setErrorMessage(
          "NIM ini sudah terdaftar. Setiap mahasiswa hanya dapat mendaftar sekali."
        );
      } else {
        setErrorMessage(
          "Terjadi kesalahan saat menyimpan data. Silakan coba lagi."
        );
      }

      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinWhatsApp = () => {
    window.open(WHATSAPP_GROUP_LINK, "_blank");
  };

  if (!jurusanProdiData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 dark:bg-slate-900">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4 dark:bg-slate-800 dark:border-slate-700"
        >
          <div className="h-2 bg-gradient-to-r from-red-500 via-orange-400 to-blue-500" />
          <div className="p-6">
            <h1 className="text-2xl font-normal text-gray-900 mb-2 dark:text-white">
              Pendaftaran Volunteer
            </h1>
            <h2 className="text-xl font-medium text-blue-600 mb-3 dark:text-blue-400">
              Minangkabau Robot Contest
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-300">
              UKM Robotik Politeknik Negeri Padang
            </p>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <p className="text-sm text-gray-700 dark:text-slate-300">
                Silakan isi formulir di bawah ini untuk mendaftar sebagai
                volunteer. Setiap mahasiswa hanya dapat mendaftar sekali
                menggunakan NIM.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-slate-800 dark:border-slate-700 mb-4"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nama */}
            <div>
              <label
                htmlFor="nama"
                className="block text-sm font-medium text-gray-900 mb-2 dark:text-white"
              >
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nama"
                name="nama"
                required
                value={formData.nama}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
                placeholder="Masukkan nama lengkap"
              />
            </div>

            {/* NIM */}
            <div>
              <label
                htmlFor="nim"
                className="block text-sm font-medium text-gray-900 mb-2 dark:text-white"
              >
                NIM <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nim"
                name="nim"
                required
                value={formData.nim}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
                placeholder="Masukkan NIM"
              />
            </div>

            {/* Jurusan */}
            <div>
              <label
                htmlFor="jurusan"
                className="block text-sm font-medium text-gray-900 mb-2 dark:text-white"
              >
                Jurusan <span className="text-red-500">*</span>
              </label>
              <select
                id="jurusan"
                name="jurusan"
                required
                value={formData.jurusan}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition bg-white dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              >
                <option value="">Pilih Jurusan</option>
                {jurusanProdiData.jurusan.map((j) => (
                  <option key={j.nama} value={j.nama}>
                    {j.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Program Studi */}
            <div>
              <label
                htmlFor="prodi"
                className="block text-sm font-medium text-gray-900 mb-2 dark:text-white"
              >
                Program Studi <span className="text-red-500">*</span>
              </label>
              <select
                id="prodi"
                name="prodi"
                required
                value={formData.prodi}
                onChange={handleChange}
                disabled={!formData.jurusan}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition bg-white disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:disabled:bg-slate-800"
              >
                <option value="">
                  {formData.jurusan
                    ? "Pilih Program Studi"
                    : "Pilih Jurusan terlebih dahulu"}
                </option>
                {availableProdi.map((p) => (
                  <option
                    key={`${p.jenjang} - ${p.nama}`}
                    value={`${p.jenjang} - ${p.nama}`}
                  >
                    {p.jenjang} - {p.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Tugas */}
            <div>
              <label
                htmlFor="tugas"
                className="block text-sm font-medium text-gray-900 mb-2 dark:text-white"
              >
                Pilihan Tugas <span className="text-red-500">*</span>
              </label>
              <select
                id="tugas"
                name="tugas"
                required
                value={formData.tugas}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition bg-white dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              >
                <option value="">Pilih Tugas</option>
                <option value="Liaison Officer">Liaison Officer (LO)</option>
                <option value="Keamanan">Keamanan</option>
              </select>
            </div>

            {/* WhatsApp */}
            <div>
              <label
                htmlFor="whatsapp"
                className="block text-sm font-medium text-gray-900 mb-2 dark:text-white"
              >
                Nomor WhatsApp <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="whatsapp"
                name="whatsapp"
                required
                value={formData.whatsapp}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
                placeholder="Contoh: 08123456789"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Gunakan format: 08xxxxxxxxxx
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  "Kirim"
                )}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Status Messages */}
        <AnimatePresence>
          {submitStatus === "success" && !showWhatsAppCard && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 dark:bg-green-950 dark:border-green-800"
            >
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5 dark:text-green-400" />
              <div>
                <h3 className="font-medium text-green-900 dark:text-green-100">
                  Pendaftaran Berhasil!
                </h3>
                <p className="text-sm text-green-700 mt-1 dark:text-green-200">
                  Data Anda telah tersimpan. Silakan bergabung dengan grup
                  WhatsApp.
                </p>
              </div>
            </motion.div>
          )}

          {(submitStatus === "error" || submitStatus === "duplicate") && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 dark:bg-red-950 dark:border-red-800"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5 dark:text-red-400" />
              <div>
                <h3 className="font-medium text-red-900 dark:text-red-100">
                  {submitStatus === "duplicate"
                    ? "Pendaftaran Gagal"
                    : "Terjadi Kesalahan"}
                </h3>
                <p className="text-sm text-red-700 mt-1 dark:text-red-200">
                  {errorMessage}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WhatsApp Group Card - Shown after successful registration */}
        <AnimatePresence>
          {showWhatsAppCard && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-lg border-2 border-green-300 overflow-hidden mb-4 dark:from-green-950 dark:to-emerald-950 dark:border-green-700"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-green-500 rounded-full p-3 flex-shrink-0 dark:bg-green-600">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-900 mb-2 dark:text-green-100">
                      Bergabung dengan Grup WhatsApp
                    </h3>
                    <p className="text-sm text-green-800 mb-4 dark:text-green-200">
                      Pendaftaran Anda berhasil! Silakan bergabung dengan grup
                      WhatsApp volunteer untuk mendapatkan informasi lebih
                      lanjut dan koordinasi acara.
                    </p>
                    <button
                      onClick={handleJoinWhatsApp}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-all transform hover:scale-105 shadow-md dark:bg-green-700 dark:hover:bg-green-800"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Gabung Grup WhatsApp
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-700 dark:text-green-300">
                    💡 <strong>Penting:</strong> Pastikan Anda bergabung dengan
                    grup untuk mendapatkan update terbaru mengenai acara dan
                    koordinasi tugas.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-center text-xs text-gray-500 dark:text-slate-400"
        >
          <p>Form ini dibuat oleh UKM Robotik Politeknik Negeri Padang</p>
        </motion.div>
      </div>
    </div>
  );
}
