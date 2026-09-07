import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  ArrowLeft01Icon,
  Home01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "404 - Halaman Tidak Ditemukan | UKM Robotik PNP",
  description: "Halaman yang Anda cari tidak ditemukan atau telah dipindahkan.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-background px-4 py-12 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
        {/* Visual Badge Icon */}
        <div className="mb-6 flex size-20 items-center justify-center rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex size-14 items-center justify-center rounded-xl bg-accent/20 text-accent-strong dark:bg-accent/10 dark:text-primary">
            <HugeiconsIcon icon={Search01Icon} size={32} />
          </div>
        </div>

        {/* 404 Tag */}
        <span className="mb-2 font-mono text-micro font-bold uppercase tracking-widest text-primary">
          Error 404
        </span>

        {/* Heading & Subtitle */}
        <h1 className="mb-3 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Halaman Tidak Ditemukan
        </h1>
        <p className="mb-8 text-sm text-muted-foreground leading-relaxed">
          Maaf, halaman atau kegiatan yang Anda tuju tidak ditemukan, telah
          dibatalkan, atau Anda tidak memiliki akses ke rute ini.
        </p>

        {/* Action Buttons */}
        <div className="flex w-full flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto h-10 rounded-md border-border text-foreground hover:bg-muted text-sm font-medium"
          >
            <Link href="/kegiatan">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
              Daftar Kegiatan
            </Link>
          </Button>

          <Button
            asChild
            className="w-full sm:w-auto h-10 rounded-md bg-primary text-primary-foreground hover:bg-primary-hover text-sm font-medium"
          >
            <Link href="/dashboard">
              <HugeiconsIcon icon={Home01Icon} size={16} />
              Kembali ke Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
