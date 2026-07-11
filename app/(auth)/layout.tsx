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
    <div className="flex min-h-screen bg-canvas-dark text-white font-sans overflow-hidden">
      {/* Kiri: Hero Panel (Hidden on Mobile) */}
      <aside className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-canvas-dark p-12 lg:flex border-r border-hairline-dark">
        {/* Full-bleed Robotics Background */}
        <div className="absolute inset-0 z-0 opacity-20">
          <Image
            src="/images/robotics_hero.webp"
            alt="Robotics Hero Background"
            fill
            className="object-cover grayscale object-center contrast-125"
            priority
          />
        </div>

        {/* Tech Overlay */}
        <div className="absolute inset-0 z-0 bg-linear-to-b from-canvas-dark/95 via-canvas-dark/80 to-canvas-dark/95" />

        {/* Tricolor Tech Stripe on the right edge */}
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-linear-to-b from-cyber-blue via-tech-navy to-crimson-red z-10" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex items-center gap-2 bg-canvas-dark/80 p-2 border border-hairline-dark backdrop-blur-xs">
            <Image
              src="/images/logo-politeknik-negeri-padang.webp"
              alt="Logo PNP"
              width={36}
              height={36}
              className="object-contain"
            />
            <div className="h-6 w-px bg-hairline-dark" />
            <Image
              src="/images/logo-ukm-robotik-pnp.webp"
              alt="Logo UKM Robotik"
              width={36}
              height={36}
              className="object-contain"
            />
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[2px] text-cyber-blue font-bold">
              DEPARTMENT OF ROBOTICS
            </div>
            <div className="font-sans font-bold text-xs tracking-wide text-white">
              POLITEKNIK NEGERI PADANG
            </div>
          </div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 my-auto max-w-md">
          <span className="font-mono text-[10px] uppercase tracking-[2px] text-cyber-blue font-semibold bg-cyber-blue/10 border border-cyber-blue/30 px-2 py-0.5 rounded-sm">
            SYSTEM AUTHENTICATION
          </span>
          <h1 className="mt-4 text-4xl xl:text-5xl font-bold tracking-tight uppercase text-white leading-none">
            UKM ROBOTIK
            <span className="block text-tech-navy">PNP PORTAL</span>
          </h1>

          {/* Tricolor divider under the heading */}
          <div className="h-0.75 w-24 bg-linear-to-r from-cyber-blue via-tech-navy to-crimson-red my-6" />

          <p className="mb-8 text-sm xl:text-base text-gray-400 font-light leading-relaxed">
            Sistem manajemen terkomputerisasi terpadu untuk administrasi,
            inventarisasi, telemetri robotika, dan rekrutmen terbuka UKM Robotik
            Politeknik Negeri Padang.
          </p>

          <ul className="space-y-4 font-mono text-xs uppercase tracking-[1.5px] text-gray-300">
            {[
              { icon: "🤖", text: "Registrasi & Telemetri Robot" },
              { icon: "📊", text: "Database & Log Kegiatan" },
              { icon: "⚡", text: "Komputasi & Kontrol Akses" },
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="text-lg bg-canvas-dark p-1 border border-hairline-dark">
                  {item.icon}
                </span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex justify-between items-center border-t border-hairline-dark pt-6 font-mono text-[9px] uppercase tracking-[1.5px] text-gray-500">
          <span>SECURE PROTOCOL // TLS 1.3</span>
          <span>EST. 2026 // SYSTEM STABLE</span>
        </div>
      </aside>

      {/* Kanan: Form Area */}
      <main className="flex flex-1 items-center justify-center p-6 lg:p-12 bg-canvas-dark relative overflow-y-auto">
        {/* Subtle Tech Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#222b5415_1px,transparent_1px),linear-gradient(to_bottom,#222b5415_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none z-0" />

        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-87.5 w-87.5 rounded-full bg-cyber-blue/5 blur-[120px] pointer-events-none z-0" />

        <div className="w-full max-w-110 relative z-10">{children}</div>
      </main>
    </div>
  );
}
