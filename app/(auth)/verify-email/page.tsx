"use client";

import { auth } from "@/lib/firebaseConfig";
import {
  onAuthStateChanged,
  sendEmailVerification,
  type User,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function VerifyEmail() {
  const [message, setMessage] = useState<string>(
    "Kami sudah mengirim link verifikasi ke email kamu. Silakan cek inbox atau folder spam dari admin@robotik-pnp.firebaseapp.com."
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [resending, setResending] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(60); // ⏳ langsung mulai 60 detik dari awal
  const router = useRouter();

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setCurrentUser(fbUser);

        // cek status verifikasi tiap 2 detik
        intervalId = setInterval(async () => {
          await fbUser.reload();
          if (fbUser.emailVerified) {
            if (intervalId) clearInterval(intervalId);
            setMessage(
              "Email kamu sudah terverifikasi ✅, sedang mengarahkan ke pendaftaran caang..."
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

  // handler hitung mundur
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!currentUser) return;
    try {
      setResending(true);
      await sendEmailVerification(currentUser);
      setMessage("Link verifikasi baru sudah dikirim ke email kamu 📩, cek inbox atau folder spam dari admin@robotik-pnp.firebaseapp.com");
      setCooldown(60); // ⏳ reset cooldown tiap kali kirim ulang
    } catch (err) {
      console.error("Gagal kirim ulang email:", err);
      setMessage("Terjadi kesalahan saat mengirim ulang email ❌");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex max-h-fit flex-col items-center justify-center overflow-hidden">
      <div className="no-scrollbar overflow-y-auto">
        <div className="mx-auto w-full max-w-[480px]">
          <div className="text-center">
            <div className="rounded-xl bg-white p-4 shadow-card-10 dark:bg-gray-dark lg:p-7.5 xl:p-12.5">
              <Link
                className="flex justify-center items-center gap-2 mx-auto mb-7.5"
                href="/"
              >
                <Image
                  alt="Logo"
                  width={45}
                  height={45}
                  src="/images/logo/logo.webp"
                />
                <span className="font-semibold text-dark dark:text-white">
                  Robotik PNP
                </span>
              </Link>

              <h1 className="mb-2.5 text-3xl font-black leading-[48px] text-dark dark:text-white">
                Verifikasi Email
              </h1>

              <p className="mb-7.5 text-dark-4 dark:text-dark-6">{message}</p>

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
      </div>
    </div>
  );
}
