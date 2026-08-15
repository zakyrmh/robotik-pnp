import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Autentifikasi | UKM Robotik PNP",
  description: "Masuk atau daftar ke sistem manajemen UKM Robotik PNP",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground font-sans transition-colors duration-200">
      {/* ── Left Panel: Hero & Technical Blueprint (Desktop Only) ─────── */}
      <aside className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-[#0f1b2d] p-8 xl:p-12 lg:flex border-r border-white/10 text-white">
        {/* Ambient Orange & Blue Glow Orbs */}
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-primary/40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-accent-strong/20 blur-3xl pointer-events-none" />

        {/* Tricolor Tech Stripe on Right Edge */}
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-linear-to-b from-primary via-accent-strong to-[#0f1b2d] z-10" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white/10 p-2.5 border border-white/15 rounded-lg backdrop-blur-xs">
            <Image
              src="/images/logo-politeknik-negeri-padang.webp"
              alt="Logo PNP"
              width={34}
              height={34}
              className="object-contain h-auto w-auto"
            />
            <div className="h-6 w-px bg-white/20" />
            <Image
              src="/images/logo-ukm-robotik-pnp.webp"
              alt="Logo UKM Robotik PNP"
              width={34}
              height={34}
              className="object-contain h-auto w-auto"
            />
          </div>
          <div>
            <div className="font-display font-semibold text-sm sm:text-base text-white">
              Unit Kegiatan Mahasiswa Robotik
            </div>
            <div className="text-xs sm:text-sm text-accent-strong font-semibold tracking-wide">
              Politeknik Negeri Padang
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 my-auto max-w-md flex flex-col gap-6">
          <div>
            <h1 className="text-3xl xl:text-4xl font-display font-bold tracking-tight leading-tight text-white">
              Portal UKM Robotik
              <span className="block text-accent-strong">PNP</span>
            </h1>
            {/* PNP Orange Accent Divider */}
            <div className="h-1 w-20 bg-accent-strong rounded-full mt-4" />
          </div>

          <p className="text-xs xl:text-sm text-slate-300 font-light leading-relaxed">
            Sistem informasi manajemen terpadu untuk administrasi,
            inventarisasi, telemetri robotika, dan rekrutmen terbuka calon
            anggota UKM Robotik Politeknik Negeri Padang.
          </p>

          <ul className="flex flex-col gap-3 text-xs xl:text-sm text-slate-200">
            {[
              "Registrasi & telemetri robotik",
              "Database & log aktivitas",
              "Kontrol akses & presensi realtime",
            ].map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-3 bg-white/5 border border-white/10 px-3.5 py-2.5 rounded-lg"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* ── Right Panel: Form Canvas (Mobile First) ───────────────────── */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-12 min-h-screen relative overflow-y-auto bg-background transition-colors duration-200">
        {/* Mobile Header Branding (sticky at top on mobile) */}
        <div className="sticky top-0 z-20 w-full max-w-md self-center flex items-center justify-between pb-4 mb-2 border-b border-border bg-background lg:hidden">
          <div className="flex items-center gap-2.5">
            <Image
              src="/images/logo-politeknik-negeri-padang.webp"
              alt="Logo PNP"
              width={28}
              height={28}
              className="object-contain h-auto w-auto"
            />
            <div className="h-5 w-px bg-border" />
            <Image
              src="/images/logo-ukm-robotik-pnp.webp"
              alt="Logo UKM Robotik PNP"
              width={28}
              height={28}
              className="object-contain h-auto w-auto"
            />
            <span className="font-display font-bold text-xs tracking-tight text-foreground ml-1">
              UKM Robotik PNP
            </span>
          </div>
        </div>

        {/* Main Content Wrap */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md relative z-10 py-2 sm:py-4">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
