import { Metadata } from "next";
import { HeroSection } from "@/components/profil/hero-section";
import { VisiMisiSection } from "@/components/profil/visi-misi-section";
import { TimelineSection } from "@/components/profil/timeline-section";
import { BphSection } from "@/components/profil/bph-section";
import { WorkshopGallerySection } from "@/components/profil/workshop-gallery-section";

export const metadata: Metadata = {
  title: "Profil | UKM Robotika PNP",
  description:
    "Dapur Inovasi & Pusat Riset Teknologi Robotika Politeknik Negeri Padang. Wadah bagi mahasiswa kreatif, solutif, dan inovatif di bidang robotika.",
  openGraph: {
    title: "Profil | UKM Robotika PNP",
    description:
      "Kenali lebih dekat identitas, arah gerak, sejarah, dan ekosistem riset Unit Kegiatan Mahasiswa Robotika Politeknik Negeri Padang.",
    type: "website",
  },
};

export default function ProfilPage() {
  return (
    <>
      <HeroSection />
      <VisiMisiSection />
      <TimelineSection />
      <BphSection />
      <WorkshopGallerySection />
    </>
  );
}
