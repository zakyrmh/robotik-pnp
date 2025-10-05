"use client";

import { useState } from "react";
import {
  Loader2,
  Calendar,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { auth } from "@/lib/firebaseConfig";

interface FormData {
  userId: string;
  pilihanPertama: string;
  pilihanKedua: string;
  hari: string;
  alasan: string;
}

interface VolunteerRegistrationProps {
  onRegistrationSuccess?: () => void;
  onRegistrationError?: (message: string) => void;
}

const BIDANG_OPTIONS = [
  { value: "LO", label: "Liaison Officer (LO)" },
  { value: "PDD", label: "Publikasi, Desain, dan Dokumentasi (PDD)" },
  { value: "Keamanan", label: "Keamanan" },
  { value: "Admin", label: "Admin" },
];

const HARI_OPTIONS = [
  {
    value: "both",
    label: "Sabtu (25) dan Minggu (26) Oktober 2025",
    requireReason: false,
  },
  { value: "sabtu", label: "Sabtu (25) Oktober 2025", requireReason: true },
  { value: "minggu", label: "Minggu (26) Oktober 2025", requireReason: true },
];

// Kuota maksimal per bidang (tidak ditampilkan ke user)
const MAX_QUOTA: Record<string, number> = {
  LO: 999999, // Unlimited
  PDD: 5,
  Keamanan: 8,
  Admin: 2,
};

export default function VolunteerRegistration({
  onRegistrationSuccess,
  onRegistrationError,
}: VolunteerRegistrationProps = {}) {
  const [formData, setFormData] = useState<FormData>({
    userId: "",
    pilihanPertama: "",
    pilihanKedua: "",
    hari: "",
    alasan: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const user = auth.currentUser;

  const needsReason = HARI_OPTIONS.find(
    (opt) => opt.value === formData.hari
  )?.requireReason;

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Count words for alasan field
    if (name === "alasan") {
      const words = value.trim().split(/\s+/).filter((word) => word.length > 0);
      setWordCount(words.length);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      userId: user?.uid || "",
    }));
  };

  // Check duplicate based on userId
  const checkDuplicate = async (userId: string) => {
    const q = query(
      collection(db, "volunteer_mrc_ix"),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

  // Hitung kuota yang sudah terisi per bidang
  const getQuotaCounts = async () => {
    const snapshot = await getDocs(collection(db, "volunteer_mrc_ix"));
    const counts: Record<string, number> = {
      LO: 0,
      PDD: 0,
      Keamanan: 0,
      Admin: 0,
    };

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.bidangDitempatkan) {
        counts[data.bidangDitempatkan] =
          (counts[data.bidangDitempatkan] || 0) + 1;
      }
    });

    return counts;
  };

  // Alokasi bidang otomatis berdasarkan kuota
  const allocateBidang = async (
    pilihan1: string,
    pilihan2: string
  ): Promise<string> => {
    const counts = await getQuotaCounts();

    // Cek pilihan pertama
    if (pilihan1 === "LO" || counts[pilihan1] < MAX_QUOTA[pilihan1]) {
      return pilihan1;
    }

    // Cek pilihan kedua
    if (pilihan2 === "LO" || counts[pilihan2] < MAX_QUOTA[pilihan2]) {
      return pilihan2;
    }

    // Fallback ke LO jika kedua pilihan penuh
    return "LO";
  };

  const saveToFirebase = async (data: FormData, bidangDitempatkan: string) => {
    try {
      const docRef = await addDoc(collection(db, "volunteer_mrc_ix"), {
        userId: data.userId,
        pilihanPertama: data.pilihanPertama,
        pilihanKedua: data.pilihanKedua,
        bidangDitempatkan: bidangDitempatkan,
        hari: data.hari,
        alasan: data.alasan || null,
        timestamp: new Date().toISOString(),
        createdAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding document:", error);
      throw error;
    }
  };

  const validateForm = () => {
    if (
      !formData.pilihanPertama ||
      !formData.pilihanKedua ||
      !formData.hari
    ) {
      return { valid: false, message: "Semua field wajib diisi." };
    }

    if (formData.pilihanPertama === formData.pilihanKedua) {
      return {
        valid: false,
        message: "Pilihan pertama dan kedua tidak boleh sama.",
      };
    }

    // Validate alasan if needed
    if (needsReason) {
      if (!formData.alasan.trim()) {
        return {
          valid: false,
          message: "Alasan wajib diisi jika memilih hanya satu hari tugas.",
        };
      }

      const words = formData.alasan
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0);
      if (words.length > 200) {
        return { valid: false, message: "Alasan maksimal 200 kata." };
      }
    }

    return { valid: true, message: "" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      onRegistrationError?.("Anda harus login untuk mendaftar.");
      return;
    }

    const validation = validateForm();
    if (!validation.valid) {
      onRegistrationError?.(validation.message);
      return;
    }

    setIsSubmitting(true);

    try {
      const isDuplicate = await checkDuplicate(user.uid);
      if (isDuplicate) {
        onRegistrationError?.("Anda sudah terdaftar sebagai volunteer.");
        setIsSubmitting(false);
        return;
      }

      // Alokasi bidang otomatis
      const bidangDitempatkan = await allocateBidang(
        formData.pilihanPertama,
        formData.pilihanKedua
      );

      await saveToFirebase(
        {
          userId: user.uid,
          pilihanPertama: formData.pilihanPertama,
          pilihanKedua: formData.pilihanKedua,
          hari: formData.hari,
          alasan: formData.alasan,
        },
        bidangDitempatkan
      );

      onRegistrationSuccess?.();
    } catch (error) {
      console.error("Error saving data:", error);
      onRegistrationError?.(
        "Terjadi kesalahan saat menyimpan data. Silakan coba lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl py-4 lg:py-8 mx-auto px-4">
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
            Minangkabau Robot Contest IX
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            UKM Robotik Politeknik Negeri Padang
          </p>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
            <p className="text-sm text-gray-700 dark:text-slate-300 mb-3">
              Silakan isi formulir di bawah ini untuk mendaftar sebagai
              volunteer. Setiap calon anggota UKM Robotik wajib mendaftar.
            </p>
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-3 py-2 rounded-lg">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">
                Hasil penempatan diumumkan: 13 Oktober 2025, 15.00 WIB
              </span>
            </div>
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
        <div className="space-y-6">
          {/* Pilihan Pertama */}
          <div>
            <label
              htmlFor="pilihanPertama"
              className="block text-sm font-medium text-gray-900 mb-2 dark:text-white"
            >
              Pilihan Bidang Pertama <span className="text-red-500">*</span>
            </label>
            <select
              id="pilihanPertama"
              name="pilihanPertama"
              required
              value={formData.pilihanPertama}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition bg-white dark:bg-slate-900 dark:border-slate-600 dark:text-white"
            >
              <option value="">Pilih Bidang</option>
              {BIDANG_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Pilihan Kedua */}
          <div>
            <label
              htmlFor="pilihanKedua"
              className="block text-sm font-medium text-gray-900 mb-2 dark:text-white"
            >
              Pilihan Bidang Kedua <span className="text-red-500">*</span>
            </label>
            <select
              id="pilihanKedua"
              name="pilihanKedua"
              required
              value={formData.pilihanKedua}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition bg-white dark:bg-slate-900 dark:border-slate-600 dark:text-white"
            >
              <option value="">Pilih Bidang</option>
              {BIDANG_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1.5 dark:text-slate-400">
              Pilih bidang yang berbeda dari pilihan pertama
            </p>
          </div>

          {/* Jadwal */}
          <div>
            <label
              htmlFor="hari"
              className="block text-sm font-medium text-gray-900 mb-2 dark:text-white"
            >
              Pilihan Hari Tugas <span className="text-red-500">*</span>
            </label>
            <select
              id="hari"
              name="hari"
              required
              value={formData.hari}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition bg-white dark:bg-slate-900 dark:border-slate-600 dark:text-white"
            >
              <option value="">Pilih Hari</option>
              {HARI_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Alasan - Conditional */}
          <AnimatePresence>
            {needsReason && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label
                  htmlFor="alasan"
                  className="block text-sm font-medium text-gray-900 mb-2 dark:text-white"
                >
                  Alasan <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="alasan"
                  name="alasan"
                  required={needsReason}
                  value={formData.alasan}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Jelaskan alasan Anda tidak bisa hadir di kedua hari..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition bg-white dark:bg-slate-900 dark:border-slate-600 dark:text-white resize-none"
                />
                <div className="flex justify-between items-center mt-1.5">
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Wajib diisi untuk pilihan satu hari
                  </p>
                  <p
                    className={`text-xs ${
                      wordCount > 200
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-500 dark:text-slate-400"
                    }`}
                  >
                    {wordCount}/200 kata
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 dark:bg-blue-700 dark:hover:bg-blue-800 font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  Daftar Sekarang
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

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
  );
}