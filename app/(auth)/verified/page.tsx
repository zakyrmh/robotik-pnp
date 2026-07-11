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
      <Card className="border-hairline-dark bg-surface-card-dark text-center rounded-none shadow-none">
        <CardHeader className="pt-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-none bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/30 shadow-[0_0_12px_rgba(0,102,177,0.2)]">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={32} />
          </div>
          <CardTitle className="text-2xl font-bold uppercase tracking-tight text-white font-sans">
            EMAIL TERVERIFIKASI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pb-8">
          <p className="text-gray-400 font-sans font-light text-sm leading-relaxed">
            Selamat, akun UKM Robotik PNP Anda telah aktif. Sistem sedang
            mengalihkan sesi Anda ke halaman onboarding.
          </p>

          <div className="flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-wider text-cyber-blue bg-cyber-blue/10 py-3.5 px-4 rounded-none border border-cyber-blue/20">
            <HugeiconsIcon
              icon={RocketIcon}
              size={16}
              className="animate-pulse"
            />
            OTOMATIS REDIRECT DALAM {countdown} DETIK...
          </div>
        </CardContent>
      </Card>

      <button
        onClick={() => router.push("/onboarding")}
        className="w-full text-[10px] font-mono uppercase tracking-widest text-gray-500 hover:text-white transition-colors cursor-pointer"
      >
        [ LEWATI REDIRECT DAN LANJUTKAN ]
      </button>
    </div>
  );
}
