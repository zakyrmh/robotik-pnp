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
    <div className="flex min-h-screen bg-background font-sans">
      {/* Kiri: Hero Panel (Hidden on Mobile) */}
      <aside className="relative hidden w-[45%] flex-col items-center justify-center overflow-hidden bg-linear-to-br from-indigo-950 via-indigo-900 to-purple-950 p-12 lg:flex">
        {/* Decorative Grid & Orbs */}
        <div className="absolute inset-0 z-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[40px_40px]" />
        <div className="absolute top-[-10%] right-[-10%] h-80 w-80 animate-pulse rounded-full bg-indigo-500/30 blur-[80px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-64 w-64 animate-pulse rounded-full bg-purple-500/30 blur-[80px] [animation-delay:2s]" />

        <div className="relative z-10 max-w-sm text-white">
          <div className="mb-4 flex h-auto w-12 items-center gap-3">
            <Image
              src="/images/logo-politeknik-negeri-padang.webp"
              alt="Logo UKM Robotik PNP"
              width={150}
              height={150}
            />
            <Image
              src="/images/logo-ukm-robotik-pnp.webp"
              alt="Logo UKM Robotik PNP"
              width={150}
              height={150}
            />
          </div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight">
            UKM Robotik PNP
          </h1>
          <p className="mb-10 text-lg text-indigo-100/60 leading-relaxed">
            Sistem manajemen terpadu untuk kegiatan, turnamen, dan anggota UKM
            Robotik Politeknik Negeri Padang.
          </p>
          <ul className="space-y-4">
            {[
              { icon: "🤖", text: "Pendataan tim & robot" },
              { icon: "📊", text: "Laporan & statistik anggota" },
              { icon: "⚡", text: "Manajemen turnamen real-time" },
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-indigo-50/80">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-medium">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Kanan: Form Area */}
      <main className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>
    </div>
  );
}
