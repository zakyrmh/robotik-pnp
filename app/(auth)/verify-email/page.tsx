"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { resendVerificationEmail } from "@/lib/firebase/services/auth";
import Link from "next/link";

import { toast } from "sonner";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);

  // Verification State from Firestore
  const [resendAttempts, setResendAttempts] = useState(0);
  const [blockResendUntil, setBlockResendUntil] = useState<Date | null>(null);
  const [lastResendAt, setLastResendAt] = useState<Date | null>(null);
  const [createdAt, setCreatedAt] = useState<Date | null>(null);

  // UI Countdown State
  const [countdown, setCountdown] = useState(0); // For short UX cooldown or long block
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // If already verified, redirect
        if (currentUser.emailVerified) {
          toast.success("Email sudah terverifikasi.");
          router.push("/login");
        }

        // Listen to User Verification Data in 'users_new'
        // Using onSnapshot for real-time updates
        const unsubDoc = onSnapshot(
          doc(db, "users_new", currentUser.uid),
          (doc) => {
            const data = doc.data();
            if (data) {
              if (data.createdAt) {
                setCreatedAt(data.createdAt.toDate());
              }
              if (data.verification) {
                setResendAttempts(data.verification.resendAttempts || 0);
                if (data.verification.blockResendUntil) {
                  setBlockResendUntil(
                    data.verification.blockResendUntil.toDate()
                  );
                } else {
                  setBlockResendUntil(null);
                }
                if (data.verification.lastResendAt) {
                  setLastResendAt(data.verification.lastResendAt.toDate());
                }
              }
            }
          }
        );

        setLoading(false);
        return () => unsubDoc();
      } else {
        // No user, redirect to login
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Auto-Redirect/Polling Logic
  useEffect(() => {
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        try {
          await auth.currentUser.reload();
          if (auth.currentUser.emailVerified) {
            clearInterval(interval);
            toast.success("Email berhasil diverifikasi! Mengalihkan...", {
              duration: 2000,
            });
            router.push("/login");
          }
        } catch (error) {
          // Silent fail on network error during polling to avoid flicker
          console.debug("Verification poll failed", error);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  // Countdown Logic
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      let targetTime: Date | null = null;
      let isLongBlock = false;

      // Priority 1: Long Block (24h)
      if (blockResendUntil) {
        targetTime = blockResendUntil;
        isLongBlock = true;
      }
      // Priority 2: Short Cooldown (60s)
      else {
        // Calculate 60s from last action
        const lastActionTime = lastResendAt || createdAt;
        if (lastActionTime) {
          const cooldownUntil = new Date(lastActionTime.getTime() + 60 * 1000);
          if (now < cooldownUntil) {
            targetTime = cooldownUntil;
          }
        }
      }

      if (targetTime) {
        const diff = Math.ceil((targetTime.getTime() - now.getTime()) / 1000);
        if (diff > 0) {
          setCountdown(diff);
        } else {
          setCountdown(0);
          if (isLongBlock) {
            // Let the snapshot update handle the actual nullifying of blockResendUntil
            // But locally we can imply it's done.
            // We don't manually setBlockResendUntil(null) here to avoid fighting with snapshot.
          }
        }
      } else {
        setCountdown(0);
      }
    };

    updateTimer(); // Run immediately
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [blockResendUntil, lastResendAt, createdAt]);

  // Helper formats seconds to HH:MM:SS
  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "0s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}j ${m}m ${s}d`;
    return `${m}m ${s}d`;
  };

  const handleResend = async () => {
    if (!user) return;
    setResending(true);
    setMessage(null);
    setError(null);

    const result = await resendVerificationEmail(user);

    if (result.success) {
      setMessage("Email verifikasi telah dikirim ulang. Cek inbox/spam anda.");
    } else {
      setError(result.error || "Gagal mengirim ulang email.");
      if (result.nextAvailable) {
        setBlockResendUntil(result.nextAvailable);
      }
    }
    setResending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-black px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 p-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl text-center">
        {/* Icon / Illustration */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100/10 mb-4">
          <svg
            className="h-8 w-8 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Verifikasi Email
        </h2>

        <div className="text-sm text-gray-300">
          <p>Kami telah mengirimkan link verifikasi ke:</p>
          <p className="font-semibold text-white mt-1 text-lg">{user?.email}</p>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          Silakan cek kotak masuk atau folder spam Anda. Klik link yang
          dikirimkan untuk mengaktifkan akun.
        </p>

        {/* Status Messages */}
        {message && (
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3">
            <p className="text-sm text-green-400 font-medium">{message}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
            <p className="text-sm text-red-400 font-medium">{error}</p>
          </div>
        )}

        <div className="pt-4 space-y-4">
          {/* Info Attempts */}
          <div className="flex justify-between text-xs text-gray-500 px-2">
            <span>Attempt: {resendAttempts}/3</span>
            {countdown > 0 && (
              <span className="text-red-400">
                Tunggu: {formatTime(countdown)}
              </span>
            )}
          </div>

          <button
            onClick={handleResend}
            disabled={resending || countdown > 0}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {resending
              ? "Mengirim..."
              : countdown > 0
              ? `Tunggu ${formatTime(countdown)}`
              : "Kirim Ulang Verifikasi"}
          </button>

          <div>
            <Link
              href="/login"
              className="text-sm text-gray-400 hover:text-white transition-colors"
              onClick={() => auth.signOut()}
            >
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
