"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, CheckCircle, Clock, RefreshCw, ArrowRight } from "lucide-react";
import { auth } from "@/lib/firebaseConfig";
import {
  onAuthStateChanged,
  sendEmailVerification,
  type User,
} from "firebase/auth";
import Link from "next/link";

export default function VerifyEmailPage() {
  const [message, setMessage] = useState(
    "Kami sudah mengirim link verifikasi ke email kamu. Silakan cek inbox atau folder spam."
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60); // ⏳ langsung terkunci 60 detik
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();

  // Cek status verifikasi
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setCurrentUser(fbUser);

        // reload emailVerified setiap 2 detik
        intervalId = setInterval(async () => {
          await fbUser.reload();
          if (fbUser.emailVerified) {
            if (intervalId) clearInterval(intervalId);
            setIsVerified(true);
            setMessage("Email kamu sudah terverifikasi! Sedang mengarahkan ke pendaftaran...");
            setTimeout(() => router.push("/pendaftaran"), 2000);
          }
        }, 2000);
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
      unsubscribe();
    };
  }, [router]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handler kirim ulang
  const handleResend = async () => {
    if (!currentUser) return;
    try {
      setResending(true);
      await sendEmailVerification(currentUser);
      setMessage("Link verifikasi baru sudah dikirim ke email kamu! Cek inbox atau folder spam.");
      setCooldown(60); // reset 60 detik
    } catch (err) {
      console.error("Gagal kirim ulang email:", err);
      setMessage("Terjadi kesalahan saat mengirim ulang email. Silakan coba lagi.");
    } finally {
      setResending(false);
    }
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
          {/* Logo */}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 mb-4"
          >
            <div className="w-16 h-16 bg-blue-600 dark:bg-blue-700 rounded-full flex items-center justify-center">
              {isVerified ? (
                <CheckCircle className="w-8 h-8 text-white dark:text-gray-100" />
              ) : (
                <Mail className="w-8 h-8 text-white dark:text-gray-100" />
              )}
            </div>
          </Link>
          
          <h1 className="text-2xl md:text-3xl font-bold text-white dark:text-gray-100 mb-2">
            UKM Robotik PNP
          </h1>
          <p className="text-gray-300 dark:text-gray-400 text-sm">
            Verifikasi Email
          </p>
        </motion.div>

        {/* Main Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-xl border border-white/20 dark:border-gray-700/30"
        >
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              animate={isVerified ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5 }}
              className={`w-20 h-20 rounded-full flex items-center justify-center ${
                isVerified 
                  ? 'bg-green-500/20 dark:bg-green-600/30' 
                  : 'bg-blue-500/20 dark:bg-blue-600/30'
              }`}
            >
              {isVerified ? (
                <CheckCircle className="w-10 h-10 text-green-400 dark:text-green-300" />
              ) : (
                <Mail className="w-10 h-10 text-blue-400 dark:text-blue-300" />
              )}
            </motion.div>
          </div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-6"
          >
            <h2 className={`text-xl font-semibold mb-3 ${
              isVerified 
                ? 'text-green-300 dark:text-green-200' 
                : 'text-white dark:text-gray-100'
            }`}>
              {isVerified ? 'Email Terverifikasi!' : 'Cek Email Kamu'}
            </h2>
            
            <p className="text-gray-300 dark:text-gray-400 text-sm leading-relaxed">
              {message}
            </p>

            {/* Email info */}
            {currentUser?.email && !isVerified && (
              <div className="mt-4 p-3 bg-white/5 dark:bg-gray-700/20 rounded-lg border border-white/10 dark:border-gray-600/30">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                  Email dikirim ke:
                </p>
                <p className="text-blue-300 dark:text-blue-200 font-medium text-sm">
                  {currentUser.email}
                </p>
              </div>
            )}
          </motion.div>

          {/* Resend Button */}
          {!isVerified && (
            <motion.button
              onClick={handleResend}
              disabled={resending || !currentUser || cooldown > 0}
              whileHover={cooldown <= 0 ? { scale: 1.02 } : {}}
              whileTap={cooldown <= 0 ? { scale: 0.98 } : {}}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-800 dark:hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {resending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : cooldown > 0 ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Tunggu {cooldown}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Kirim Ulang Email
                </>
              )}
            </motion.button>
          )}

          {/* Success Button */}
          {isVerified && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={() => router.push("/pendaftaran")}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 text-white font-semibold py-3 px-4 rounded-lg hover:from-green-700 hover:to-green-800 dark:hover:from-green-800 dark:hover:to-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-all duration-200 flex items-center justify-center"
              >
                Lanjut ke Pendaftaran
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </motion.div>
          )}

          {/* Help Text */}
          {!isVerified && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center mt-6"
            >
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                Tidak menerima email?
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-600">
                • Cek folder spam atau junk mail<br />
                • Pastikan email dari admin@robotik-pnp.firebaseapp.com tidak diblokir
              </div>
            </motion.div>
          )}
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

        {/* Back to Login */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-4"
        >
          <Link
            href="/login"
            className="text-sm text-blue-400 dark:text-blue-300 hover:text-blue-300 dark:hover:text-blue-200 transition-colors duration-200"
          >
            ← Kembali ke Login
          </Link>
        </motion.div>
      </div>
    </div>
  );
}