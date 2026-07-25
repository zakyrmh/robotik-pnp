import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { InitialLoader } from "@/components/shared/initial-loader";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
import { RecoveryHashListener } from "@/components/shared/recovery-hash-listener";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UKM Robotik PNP",
  description:
    "Sistem Manajemen Unit Kegiatan Mahasiswa Robotik Politeknik Negeri Padang",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
        {/* Deteksi recovery hash sebelum React/Supabase hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var h = window.location.hash;
                if (h && h.indexOf('type=recovery') !== -1 && h.indexOf('access_token=') !== -1) {
                  sessionStorage.setItem('supabase_recovery_redirect', 'true');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <RecoveryHashListener />
        <InitialLoader>{children}</InitialLoader>
        <Toaster position="top-center" closeButton richColors />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
