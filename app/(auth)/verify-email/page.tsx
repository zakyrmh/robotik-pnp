import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon } from "@hugeicons/core-free-icons";

export const metadata: Metadata = {
  title: "Verifikasi Email | UKM Robotik PNP",
  description: "Periksa email Anda untuk konfirmasi pendaftaran",
};

export default function VerifyEmailPage() {
  return (
    <div className="space-y-6">
      <Card className="border-hairline-dark bg-surface-card-dark text-center rounded-none shadow-none">
        <CardHeader className="pt-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-none bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/30 shadow-[0_0_12px_rgba(0,102,177,0.2)]">
            <HugeiconsIcon
              icon={Mail01Icon}
              size={32}
              className="animate-pulse"
            />
          </div>
          <CardTitle className="text-2xl font-bold uppercase tracking-tight text-white font-sans">
            CEK EMAIL ANDA
          </CardTitle>
          <CardDescription className="text-xs text-gray-400 font-sans font-light mt-1">
            Kami telah mengirimkan link verifikasi ke email Anda untuk
            mengaktifkan akun.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          <div className="space-y-3">
            {[
              "Buka aplikasi email di perangkat Anda",
              "Cari email dari UKM Robotik PNP",
              "Klik tombol Konfirmasi Email",
            ].map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border border-hairline-dark bg-canvas-dark/40 p-4 text-left hover:bg-canvas-dark/80 transition-colors rounded-none"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-cyber-blue text-white font-mono text-xs font-bold rounded-none">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-300 font-sans font-light leading-snug">
                  {step}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-none border border-cyber-blue/20 bg-cyber-blue/5 p-4 text-xs font-sans font-light text-gray-400 text-left">
            <p className="mb-2">
              Tidak menemukan email? Silakan periksa folder{" "}
              <strong>Spam</strong> atau coba kirim ulang beberapa saat lagi.
            </p>
            <div className="border-t border-hairline-dark pt-2.5 mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider">
              <span>DEVELOPMENT ENV // MAILPIT</span>
              <a
                href="http://127.0.0.1:54324"
                target="_blank"
                className="font-bold text-cyber-blue hover:text-tech-navy hover:underline transition-colors"
              >
                [ BUKA MAILPIT ]
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-center">
        <Link
          href="/register"
          className="font-mono text-[10px] uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
        >
          [ KEMBALI KE HALAMAN DAFTAR ]
        </Link>
      </p>
    </div>
  );
}
