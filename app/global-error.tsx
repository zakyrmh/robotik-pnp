"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Laporkan exception ke Sentry secara otomatis
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="id">
      <body className="bg-dongker-ink text-white min-h-screen flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full border border-white/15 bg-[#112240] rounded-xl p-8 text-center shadow-2xl relative overflow-hidden">
          {/* Top Tricolor Accent Stripe */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-dongker-surface via-pnp-orange to-dongker-ink" />

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-pnp-orange/15 text-pnp-orange mb-4 font-mono font-bold text-lg">
            !
          </div>

          <span className="block font-mono text-xs uppercase tracking-widest text-pnp-orange mb-2">
            CRITICAL SYSTEM ERROR
          </span>

          <h1 className="font-bold text-2xl uppercase tracking-tight text-white mb-3">
            GANGGUAN SISTEM TERJADI
          </h1>

          <p className="text-slate-300 text-sm font-light leading-relaxed mb-6">
            Terjadi kesalahan yang tidak terduga. Tim pengembang telah menerima
            laporan otomatis melalui Sentry Error Tracking.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => reset()}
              className="w-full py-3 px-6 rounded-lg bg-pnp-orange hover:bg-pnp-orange/90 text-white font-mono text-xs font-semibold uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              COBA LAGI
            </button>
            <Link
              href="/"
              className="w-full py-3 px-6 rounded-lg border border-white/20 hover:bg-white/10 text-white font-mono text-xs font-semibold uppercase tracking-wider transition-all text-center"
            >
              KEMBALI KE BERANDA
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
