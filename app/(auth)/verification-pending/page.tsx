"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, ArrowRight, RefreshCw } from "lucide-react";

import { sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { toast, Toaster } from "sonner";

export default function VerificationPendingPage() {
  const router = useRouter();

  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  useEffect(() => {
    // Check auth state
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user?.emailVerified) {
        toast.success("Email sudah terverifikasi. Mengalihkan ke login...");
        signOut(auth).then(() => router.push("/login"));
      }
    });

    // Interval to poll verification status
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        try {
          // console.log("Checking verification status...");
          await auth.currentUser.reload();
          if (auth.currentUser.emailVerified) {
            toast.success("Email berhasil diverifikasi! Silakan login.");
            await signOut(auth);
            router.push("/login");
          }
        } catch (error) {
          console.error("Error checking verification", error);
        }
      }
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = async () => {
    if (!currentUser) {
      toast.error(
        "Sesi habis. Silakan login ulang untuk mengirim ulang verifikasi."
      );
      router.push("/login");
      return;
    }

    setIsResending(true);
    try {
      await sendEmailVerification(currentUser);
      toast.success("Email verifikasi dikirim ulang!");
      setTimer(60); // Reset timer 1 minute
      setCanResend(false);
    } catch (error: unknown) {
      console.error("Resend error:", error);
      const err = error as { code?: string };
      if (err.code === "auth/too-many-requests") {
        toast.error("Terlalu banyak permintaan. Tunggu sebentar.");
      } else {
        toast.error("Gagal mengirim ulang email.");
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error", error);
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-800 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/20 dark:border-gray-700/30 text-center"
        >
          <div className="mx-auto w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mb-6">
            <Mail className="w-10 h-10 text-blue-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Cek Email Anda</h1>
          <p className="text-gray-300 mb-6">
            Link verifikasi telah dikirim ke alamat email Anda. <br />
            Silakan cek kotak masuk (atau folder spam).
          </p>

          <div className="bg-blue-900/40 rounded-lg p-4 mb-8 text-sm text-blue-200 border border-blue-500/30">
            <p>Akun Anda belum aktif sampai email diverifikasi.</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleResend}
              disabled={!canResend || isResending || !currentUser}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isResending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : !canResend ? (
                <span>Kirim Ulang ({timer}s)</span>
              ) : (
                <span>Kirim Ulang Verifikasi</span>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              Ke Halaman Login
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        <div className="text-center mt-8">
          <p className="text-gray-400 text-xs">
            © 2024 UKM Robotik Politeknik Negeri Padang
          </p>
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
