import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/hero-section";
import { getActiveMemberCountAction } from "@/lib/actions/profiles";
import { getAchievementCountAction } from "@/lib/actions/achievements";
import {
  getDivisionCountAction,
  getDivisionsAction,
} from "@/lib/actions/divisions";
import type { Division } from "@/lib/repositories/divisions";
import { StatsSection } from "@/components/landing/stats-section";
import { DivisionsSection } from "@/components/landing/divisions-section";
import { TimelineSection } from "@/components/landing/timeline-section";
import { CtaSection } from "@/components/landing/cta-section";

export const metadata: Metadata = {
  title: "UKM Robotik PNP — We Play with Technology",
  description:
    "Unit Kegiatan Mahasiswa Robotika Politeknik Negeri Padang. Pusat riset, perancangan, dan fabrikasi robot kompetisi Kontes Robot Indonesia (KRI).",
  openGraph: {
    title: "UKM Robotik Politeknik Negeri Padang",
    description:
      "No Victory Without Sacrifice. Wadah pengembangan mekatronika, elektronika, dan sistem cerdas otonom.",
    url: "https://robotik-pnp.vercel.app/",
    siteName: "UKM Robotik PNP",
    locale: "id_ID",
    type: "website",
  },
};

export default async function HomePage() {
  let memberCount = 60;
  let achievementCount = 40;
  let divisionCount = 5;

  try {
    memberCount = await getActiveMemberCountAction();
  } catch (error) {
    console.error("Error loading active member count:", error);
  }

  try {
    achievementCount = await getAchievementCountAction();
  } catch (error) {
    console.error("Error loading achievements count:", error);
  }

  try {
    divisionCount = await getDivisionCountAction();
  } catch (error) {
    console.error("Error loading division count:", error);
  }

  let divisionsList: Division[] = [];
  try {
    divisionsList = await getDivisionsAction();
  } catch (error) {
    console.error("Error loading divisions list:", error);
  }

  const currentYear = new Date().getFullYear();
  const yearFounded = parseInt(process.env.YEAR_FOUNDED || "2005", 10);
  const yearsStanding = currentYear - yearFounded;

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://robotik-pnp.vercel.app"
  ).replace(/\/$/, "");

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: "UKM Robotik PNP",
    description:
      "Unit Kegiatan Mahasiswa Robotik Politeknik Negeri Padang — We Play with Technology",
    publisher: {
      "@id": `${siteUrl}/#organization`,
    },
  };

  return (
    <div className="w-full bg-background text-foreground transition-colors duration-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd),
        }}
      />
      {/* 1. Hero Section */}
      <HeroSection
        activeMemberCount={memberCount}
        totalAchievements={achievementCount}
      />

      {/* 2. Statistika & Peta Kekuatan (Social Proof) */}
      <StatsSection
        activeMemberCount={memberCount}
        totalAchievements={achievementCount}
        divisionCount={divisionCount}
        yearsStanding={yearsStanding}
      />

      {/* 3. Eksplorasi Divisi Robot */}
      <DivisionsSection divisions={divisionsList} />

      {/* 4. Galeri Prestasi & Showcase */}
      {/* <GallerySection /> */}

      {/* 5. Alur Kegiatan */}
      <TimelineSection />

      {/* 6. CTA Section */}
      <CtaSection />
    </div>
  );
}
