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
      <Card className="border-border/50 bg-card/50 text-center shadow-xl">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 ring-8 ring-indigo-500/5">
            <HugeiconsIcon icon={Mail01Icon} size={32} />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Cek Email Anda!
          </CardTitle>
          <CardDescription>
            Kami telah mengirimkan link verifikasi ke email Anda untuk
            mengaktifkan akun.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            {[
              "Buka aplikasi email di perangkat Anda",
              "Cari email dari UKM Robotik PNP",
              "Klik tombol Konfirmasi Email",
            ].map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl border border-border/50 bg-muted/30 p-4 text-left transition-colors hover:bg-muted/50"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground/80 leading-snug">
                  {step}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-sm text-muted-foreground">
            <p className="mb-2">
              Tidak menemukan email? Cek folder <strong>Spam</strong>.
            </p>
            <div className="border-t border-indigo-500/10 pt-2">
              <p className="text-xs">
                Dev Environment?{" "}
                <a
                  href="http://127.0.0.1:54324"
                  target="_blank"
                  className="font-bold text-indigo-500 hover:underline"
                >
                  Buka Mailpit
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sm">
        <Link
          href="/register"
          className="text-muted-foreground hover:text-indigo-500 transition-colors"
        >
          ← Kembali ke halaman daftar
        </Link>
      </p>
    </div>
  );
}
