import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { InitialLoader } from "@/components/shared/initial-loader";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
import { RecoveryHashListener } from "@/components/shared/recovery-hash-listener";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "UKM Robotik PNP — We Play with Technology",
    template: "%s | UKM Robotik PNP",
  },
  description:
    "Unit Kegiatan Mahasiswa Robotika Politeknik Negeri Padang. Pusat riset, perancangan, dan fabrikasi robot kompetisi Kontes Robot Indonesia (KRI).",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://robotik-pnp.vercel.app",
  ),
  keywords: [
    "UKM Robotik PNP",
    "Robotik PNP",
    "Politeknik Negeri Padang",
    "Kontes Robot Indonesia",
    "KRI",
    "KRAI",
    "KRSBI",
    "KRSTI",
    "KRSRI",
    "Mekatronika",
    "Robotika Padang",
    "We Play with Technology",
  ],
  authors: [{ name: "UKM Robotika Politeknik Negeri Padang" }],
  creator: "UKM Robotik PNP",
  publisher: "Politeknik Negeri Padang",
  openGraph: {
    title: "UKM Robotik Politeknik Negeri Padang",
    description:
      "No Victory Without Sacrifice. Wadah pengembangan mekatronika, elektronika, dan sistem cerdas otonom.",
    url: "https://robotik-pnp.vercel.app/",
    siteName: "UKM Robotik PNP",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/images/logo-ukm-robotik-pnp.webp",
        width: 800,
        height: 800,
        alt: "Logo UKM Robotik Politeknik Negeri Padang",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UKM Robotik Politeknik Negeri Padang",
    description:
      "No Victory Without Sacrifice. Wadah pengembangan mekatronika, elektronika, dan sistem cerdas otonom.",
    images: ["/images/logo-ukm-robotik-pnp.webp"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        plusJakartaSans.variable,
        geistMono.variable,
        inter.variable,
        "font-sans",
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
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200">
        <RecoveryHashListener />
        <InitialLoader>{children}</InitialLoader>
        <Toaster position="bottom-right" closeButton richColors />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
