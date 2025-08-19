"use client";

import { auth } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function VerifyEmail() {
  const [message, setMessage] = useState(
    "Kami sudah mengirim link verifikasi ke email kamu. Silakan cek inbox atau folder spam."
  );
  const router = useRouter();

  useEffect(() => {
    // Pantau status user
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Cek status emailVerified setiap beberapa detik
        const interval = setInterval(async () => {
          await user.reload();
          if (user.emailVerified) {
            clearInterval(interval);
            setMessage(
              "Email kamu sudah terverifikasi ✅, sedang mengarahkan ke pendaftaran caang..."
            );
            setTimeout(() => router.push("/pendaftaran"), 1500);
          }
        }, 2000); // cek tiap 2 detik

        return () => clearInterval(interval);
      }
    });

    return () => unsubscribe();
  }, [router]);
  return (
    <>
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

                <p className="mb-7.5 text-dark-4 dark:text-dark-6">
                  {message}
                </p>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
