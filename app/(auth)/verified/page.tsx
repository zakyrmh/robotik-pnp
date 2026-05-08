"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon, RocketIcon } from "@hugeicons/core-free-icons";

export default function VerifiedPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    // Redirect setelah 3 detik
    const timeout = setTimeout(() => {
      router.push("/onboarding");
    }, 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/50 text-center shadow-xl backdrop-blur-sm">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 ring-8 ring-emerald-500/5">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={40} />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Email Terverifikasi!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Selamat, akun UKM Robotik PNP Anda telah aktif. Kami akan
            mengarahkan Anda ke halaman onboarding dalam beberapa detik.
          </p>

          <div className="flex items-center justify-center gap-2 font-medium text-indigo-400 bg-indigo-500/5 py-3 rounded-xl border border-indigo-500/10">
            <HugeiconsIcon
              icon={RocketIcon}
              size={18}
              className="animate-bounce"
            />
            Mengarahkan otomatis dalam {countdown} detik...
          </div>
        </CardContent>
      </Card>

      <button
        onClick={() => router.push("/onboarding")}
        className="w-full text-sm text-muted-foreground hover:text-indigo-400 transition-colors underline"
      >
        Klik di sini jika tidak berpindah otomatis
      </button>
    </div>
  );
}
