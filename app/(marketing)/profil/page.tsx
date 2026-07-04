import { Metadata } from "next";
import { HeroSection } from "@/components/profil/hero-section";
import { VisiMisiSection } from "@/components/profil/visi-misi-section";
import { MotoSloganSection } from "@/components/profil/moto-slogan-section";
import { TimelineSection } from "@/components/profil/timeline-section";
import { BphSection } from "@/components/profil/bph-section";
import { WorkshopGallerySection } from "@/components/profil/workshop-gallery-section";

export const metadata: Metadata = {
  title: "Profil | UKM Robotik PNP",
  description:
    "Dapur Inovasi & Pusat Riset Teknologi Robotik Politeknik Negeri Padang. Wadah bagi mahasiswa kreatif, solutif, dan inovatif di bidang robotik.",
  openGraph: {
    title: "Profil | UKM Robotik PNP",
    description:
      "Kenali lebih dekat identitas, arah gerak, sejarah, dan ekosistem riset Unit Kegiatan Mahasiswa Robotik Politeknik Negeri Padang.",
    type: "website",
  },
};

export default function ProfilPage() {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://robotik-pnp.vercel.app"
  ).replace(/\/$/, "");

  const aboutPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${siteUrl}/profil/#webpage`,
    url: `${siteUrl}/profil`,
    name: "Profil | UKM Robotik PNP",
    description:
      "Kenali lebih dekat identitas, arah gerak, sejarah, dan ekosistem riset Unit Kegiatan Mahasiswa Robotik Politeknik Negeri Padang.",
    isPartOf: {
      "@id": `${siteUrl}/#website`,
    },
    about: {
      "@id": `${siteUrl}/#organization`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(aboutPageJsonLd),
        }}
      />
      <HeroSection />
      <VisiMisiSection />
      <MotoSloganSection />
      <TimelineSection />
      <BphSection />
      <WorkshopGallerySection />
    </>
  );
}
