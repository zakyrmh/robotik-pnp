"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageCircle,
  ExternalLink,
  ArrowLeft,
  Share2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { auth } from "@/lib/firebaseConfig";


interface FormData {
  userId: string;
  tugas: string;
  hari: string;
}

export default function VolunteerRegistration() {
  const [formData, setFormData] = useState<FormData>({
    userId: "",
    tugas: "",
    hari: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error" | "duplicate"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [showWhatsAppCard, setShowWhatsAppCard] = useState(false);

  const user = auth.currentUser;
  const WHATSAPP_GROUP_LINK =
    "https://chat.whatsapp.com/BCvwWKYwvpV1W3reHBzhCr?mode=ems_wa_t";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      userId: user?.uid || "", // langsung isi userId dari login
    }));
  };

  // cek duplicate berdasarkan userId
  const checkDuplicate = async (userId: string) => {
    const q = query(
      collection(db, "volunteer_mrc"),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

  const saveToFirebase = async (data: FormData) => {
    try {
      const docRef = await addDoc(collection(db, "volunteer_mrc"), {
        ...data,
        timestamp: new Date().toISOString(),
        createdAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding document:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setSubmitStatus("error");
      setErrorMessage("Anda harus login untuk mendaftar.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const isDuplicate = await checkDuplicate(user.uid);
      if (isDuplicate) {
        setSubmitStatus("duplicate");
        setErrorMessage("Anda sudah terdaftar sebagai volunteer.");
        return;
      }

      await saveToFirebase({
        userId: user.uid,
        tugas: formData.tugas,
        hari: formData.hari,
      });

      setSubmitStatus("success");
      setShowWhatsAppCard(true);
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage(
        "Terjadi kesalahan saat menyimpan data. Silakan coba lagi."
      );
      console.error("Error saving data:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinWhatsApp = () => {
    window.open(WHATSAPP_GROUP_LINK, "_blank");
  };

  const shareActivity = () => {
    if (navigator.share) {
      navigator.share({
        title: "Volunteer MRC IX",
        text: "Volunteer Minangkabau Robot Contest IX 2025",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link telah disalin ke clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center space-x-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Detail Aktivitas
            </h1>
          </div>
          <button
            onClick={shareActivity}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Share2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>
      <div className="max-w-2xl py-4 lg:py-8 mx-auto">
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
                volunteer. Setiap calon anggota UKM Robotik wajib mendaftar.
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
                <option value="liaison-officer">Liaison Officer (LO)</option>
                <option value="keamanan">Keamanan</option>
                <option value="pubdok">
                  Publikasi dan Dokumentasi (Pubdok)
                </option>
              </select>
            </div>
            {/* Jadwal */}
            <div>
              <label
                htmlFor="hari"
                className="block text-sm font-medium text-gray-900 mb-2 dark:text-white"
              >
                Pilihan Hari <span className="text-red-500">*</span>
              </label>
              <select
                id="hari"
                name="hari"
                required
                value={formData.hari}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition bg-white dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              >
                <option value="">Pilih Hari</option>
                <option value="sabtu">Sabtu, 25 Oktober 2025</option>
                <option value="minggu">Minggu, 26 Oktober 2025</option>
              </select>
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
