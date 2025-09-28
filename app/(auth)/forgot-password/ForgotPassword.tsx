"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Mail, User } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { motion } from "framer-motion";
import { toast, Toaster } from "sonner";

export default function ForgotPasswordForm() {
    const [formData, setFormData] = useState({
      email: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.email) {
      toast.error("Harap isi kolom email.");
      setIsLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, formData.email);
      toast.success("Email berhasil dikirim.");
      router.push("/login");
    } catch (err: unknown) {
      let message = "Terjadi kesalahan. Silakan coba lagi.";

      if (err && typeof err === "object" && "code" in err) {
        const errorCode = (err as { code: string; message: string }).code;

        switch (errorCode) {
          case "auth/invalid-credential":
            message = "Email atau kata sandi salah. Coba lagi.";
            break;
          case "auth/user-not-found":
            message = "Email tidak ditemukan. Silakan daftar terlebih dahulu.";
            break;
          case "auth/invalid-email":
            message = "Format email tidak valid.";
            break;
          case "auth/too-many-requests":
            message =
              "Terlalu banyak percobaan gagal. Silakan coba beberapa saat lagi.";
            break;
          case "auth/network-request-failed":
            message = "Koneksi internet bermasalah. Silakan coba lagi.";
            break;
          default:
            message = (err as unknown as { message: string }).message;
        }
      }

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-800 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="mx-auto w-16 h-16 bg-blue-600 dark:bg-blue-700 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-white dark:text-gray-100" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white dark:text-gray-100 mb-2">
            UKM Robotik PNP
          </h1>
          <p className="text-gray-300 dark:text-gray-400 text-sm">
            Kirim email untuk reset kata sandi
          </p>
        </motion.div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-xl border border-white/20 dark:border-gray-700/30"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-200 dark:text-gray-300 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 dark:bg-gray-700/30 border border-white/20 dark:border-gray-600/50 rounded-lg text-white dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-800 dark:hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 dark:border-white/20 border-t-white dark:border-t-gray-100 rounded-full animate-spin" />
              ) : (
                <>
                  Kirim Email
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </motion.button>

            {/* Forgot Password */}
            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-blue-400 dark:text-blue-300 hover:text-blue-300 dark:hover:text-blue-200 transition-colors duration-200"
              >
                Masuk
              </Link>
            </div>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-8"
        >
          <p className="text-gray-400 dark:text-gray-500 text-xs">
            © 2024 UKM Robotik Politeknik Negeri Padang
          </p>
        </motion.div>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
