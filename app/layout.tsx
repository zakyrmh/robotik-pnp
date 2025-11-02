import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ThemeToggle from "@/components/layouts/ThemeToggle"
import {Toaster} from "@/components/ui/sonner";

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
  description: "Website resmi UKM Robotik PNP",
  keywords: ["robotik", "robotik pnp", "ukm robotik", "ukm robotik pnp", "pnp"],
  authors: [{ name: "Zaky Ramadhan" }],
  creator: "Zaky Ramadhan",
  publisher: "UKM Robotik PNP",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://robotik-pnp.vercel.app",
    title: "UKM Robotik PNP",
    description: "Website resmi UKM Robotik PNP",
    siteName: "UKM Robotik PNP",
    images: [
      {
        url: "https://robotik-pnp.vercel.app/images/logo.png",
        width: 630,
        height: 630,
        alt: "Website Description",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Analytics />
        <SpeedInsights />
        <Providers>
          {children}
          <Toaster />
          <ThemeToggle />
        </Providers>
      </body>
    </html>
  );
}
