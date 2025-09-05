"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";
import {
  onAuthStateChanged,
  sendEmailVerification,
  type User,
} from "firebase/auth";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const [message, setMessage] = useState(
    "Kami sudah mengirim link verifikasi ke email kamu. Silakan cek inbox atau folder spam dari admin@robotik-pnp.firebaseapp.com."
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60); // ⏳ langsung terkunci 60 detik
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
            setMessage(
              "Email kamu sudah terverifikasi ✅, sedang mengarahkan ke pendaftaran..."
            );
            setTimeout(() => router.push("/pendaftaran"), 1500);
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
      setMessage(
        "Link verifikasi baru sudah dikirim ke email kamu 📩, cek inbox atau folder spam dari admin@robotik-pnp.firebaseapp.com"
      );
      setCooldown(60); // reset 60 detik
    } catch (err) {
      console.error("Gagal kirim ulang email:", err);
      setMessage("Terjadi kesalahan saat mengirim ulang email ❌");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-md text-center">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center justify-center gap-2 mx-auto mb-6"
          >
            <Image
              src="/images/logo.png"
              alt="Logo Robotik PNP"
              width={48}
              height={48}
              className="rounded-full"
            />
            <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">
              Robotik PNP
            </span>
          </Link>

          {/* Judul */}
          <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Verifikasi Email
          </h1>

          {/* Pesan */}
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>

          {/* Tombol resend */}
          <Button
            onClick={handleResend}
            disabled={resending || !currentUser || cooldown > 0}
            className="w-full"
          >
            {resending
              ? "Mengirim..."
              : cooldown > 0
              ? `Tunggu ${cooldown}s`
              : "Kirim Ulang Email Verifikasi"}
          </Button>
        </div>
      </div>
    </div>
  );
}
