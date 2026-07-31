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
      <aside className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-dongker-ink dark:bg-[#060d19] p-8 xl:p-12 lg:flex border-r border-blueprint-border/20 dark:border-white/10 text-white">
        {/* Subtle Engineering Grid Background */}
        <div className="absolute inset-0 z-0 blueprint-grid-bg opacity-30 pointer-events-none" />

        {/* Ambient Orange & Blue Glow Orbs */}
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-dongker-surface/40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-pnp-orange/15 blur-3xl pointer-events-none" />

        {/* Tricolor Tech Stripe on Right Edge */}
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-linear-to-b from-dongker-surface via-pnp-orange to-dongker-ink z-10" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex items-center gap-3 bg-dongker-ink/80 dark:bg-[#060d19]/90 p-2.5 border border-white/15 rounded-lg backdrop-blur-xs">
            <Image
              src="/images/logo-politeknik-negeri-padang.webp"
              alt="Logo PNP"
              width={34}
              height={34}
              className="object-contain"
            />
            <div className="h-6 w-px bg-white/20" />
            <Image
              src="/images/logo-ukm-robotik-pnp.webp"
              alt="Logo UKM Robotik PNP"
              width={34}
              height={34}
              className="object-contain"
            />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[2px] text-pnp-orange font-bold">
              DEPARTMENT OF ROBOTICS
            </div>
            <div className="font-display font-semibold text-xs tracking-wide text-white">
              POLITEKNIK NEGERI PADANG
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 my-auto max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[2px] text-pnp-orange font-semibold bg-pnp-orange/10 border border-pnp-orange/30 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-pnp-orange animate-pulse" />
            SYSTEM AUTHENTICATION // PORTAL
          </div>

          <div>
            <h1 className="text-3xl xl:text-4xl font-display font-bold tracking-tight uppercase leading-tight text-white">
              UKM ROBOTIK
              <span className="block text-pnp-orange">PNP PORTAL</span>
            </h1>
            {/* PNP Orange Accent Divider */}
            <div className="h-1 w-20 bg-pnp-orange rounded-full mt-4" />
          </div>

          <p className="text-xs xl:text-sm text-slate-300 font-light leading-relaxed">
            Sistem informasi manajemen terpadu untuk administrasi,
            inventarisasi, telemetri robotika, dan rekrutmen terbuka calon
            anggota UKM Robotik Politeknik Negeri Padang.
          </p>

          <ul className="space-y-3 font-mono text-xs text-slate-200">
            {[
              { icon: "🤖", text: "Registrasi & Telemetri Robotik" },
              { icon: "📊", text: "Database & Log Activities" },
              { icon: "⚡", text: "Kontrol Akses & Presensi Realtime" },
            ].map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-3 bg-white/5 border border-white/10 px-3.5 py-2.5 rounded-lg"
              >
                <span className="text-base">{item.icon}</span>
                <span className="font-mono text-micro tracking-wider uppercase">
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex justify-between items-center border-t border-white/10 pt-5 font-mono text-[10px] uppercase tracking-[1.5px] text-slate-400">
          <span>SECURE PROTOCOL // TLS 1.3</span>
          <span>EST. 2026 // SYSTEM STABLE</span>
        </div>
      </aside>

      {/* ── Right Panel: Form Canvas (Mobile First) ───────────────────── */}
      <main className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-12 min-h-screen relative overflow-y-auto bg-background transition-colors duration-200">
        {/* Mobile Header Branding (Visible on Mobile only) */}
        <div className="w-full max-w-md flex items-center justify-between pb-6 mb-2 border-b border-border lg:hidden">
          <div className="flex items-center gap-2.5">
            <Image
              src="/images/logo-politeknik-negeri-padang.webp"
              alt="Logo PNP"
              width={28}
              height={28}
              className="object-contain"
            />
            <div className="h-5 w-px bg-border" />
            <Image
              src="/images/logo-ukm-robotik-pnp.webp"
              alt="Logo UKM Robotik PNP"
              width={28}
              height={28}
              className="object-contain"
            />
            <span className="font-display font-bold text-xs uppercase tracking-tight text-foreground ml-1">
              UKM ROBOTIK PNP
            </span>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-wider bg-orange-wash dark:bg-pnp-orange/15 text-orange-deep dark:text-pnp-orange border border-pnp-orange/20 px-2 py-0.5 rounded-full font-semibold">
            PORTAL
          </span>
        </div>

        {/* Main Content Wrap */}
        <div className="w-full max-w-md relative z-10 py-2 sm:py-4">
          {children}
        </div>
      </main>
    </div>
  );
}
