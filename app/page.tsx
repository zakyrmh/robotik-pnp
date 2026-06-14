import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { StatsSection } from "@/components/landing/stats-section";
import { DivisionsSection } from "@/components/landing/divisions-section";
import { GallerySection } from "@/components/landing/gallery-section";
import { TimelineSection } from "@/components/landing/timeline-section";
import { CtaSection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "UKM Robotika PNP — Mesin. Logika. Juara.",
  description:
    "Unit Kegiatan Mahasiswa Robotika Politeknik Negeri Padang. Tim robot kompetisi unggulan di KRAI, KRSBI-B, KRSBI-H, KRSTI, dan KRSRI. Bergabunglah dan berikan prestasi terbaik untuk PNP.",
  keywords: [
    "robotika",
    "PNP",
    "KRAI",
    "KRSBI",
    "KRSTI",
    "KRSRI",
    "robot kompetisi",
    "Padang",
  ],
  openGraph: {
    title: "UKM Robotika PNP — Mesin. Logika. Juara.",
    description:
      "Unit Kegiatan Mahasiswa Robotika Politeknik Negeri Padang — Bergerak dengan Presisi, Bersaing di Pentas Nasional.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky Navbar */}
      <LandingNavbar />

      <main className="flex-1">
        {/* 1. Hero Section */}
        <HeroSection />

        {/* 2. Statistika & Peta Kekuatan (Social Proof) */}
        <StatsSection />

        {/* 3. Eksplorasi Divisi Robot */}
        <DivisionsSection />

        {/* 4. Galeri Prestasi & Showcase */}
        {/* <GallerySection /> */}

        {/* 5. Alur Kegiatan */}
        <TimelineSection />

        {/* 6. CTA Section */}
        <CtaSection />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
